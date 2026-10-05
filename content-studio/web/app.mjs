// 콘텐츠 스튜디오 웹 화면. claude.ai 아티팩트 안에서 열면 sample 기능으로 사용자의 Claude 계정을 통해 자료를 만든다.
// 프롬프트·스키마·렌더러는 명령줄 도구(src/)와 같은 파일을 그대로 쓴다.
import { z } from 'zod';
import JSZip from 'jszip';
import { ProductSchema, MarketingSchema } from '../src/schemas.mjs';
import { PRODUCT_SYSTEM, MARKETING_SYSTEM, productPrompt, marketingPrompt, jsonOnlyPrompt } from '../src/prompts.mjs';
import {
  escapeHtml,
  slugify,
  PRODUCT_CSS,
  renderProductSheet,
  renderKit,
  renderProductHtml,
  renderChecklistMd,
  renderBlogMd,
  checklistSections,
} from '../src/render.mjs';
import { SAMPLE_KIT } from '../src/sample.mjs';

const PRODUCT_JSON_SCHEMA = z.toJSONSchema(ProductSchema);
const MARKETING_JSON_SCHEMA = z.toJSONSchema(MarketingSchema);
const HISTORY_KEY = 'content-studio.kits';
const CHECKS_KEY = 'content-studio.checks';
const MAX_HISTORY = 8;

const $ = (id) => document.getElementById(id);
const els = {
  form: $('order'),
  go: $('go'),
  stop: $('stop'),
  status: $('status'),
  statusText: $('status-text'),
  meter: $('meter').firstElementChild,
  availability: $('availability'),
  recent: $('recent'),
  recentList: $('recent-list'),
  kit: $('kit'),
  toast: $('toast'),
};

const state = {
  kit: { ...SAMPLE_KIT, id: 'sample', isSample: true, createdAt: null, input: { author: '' } },
  tab: 'preview',
  sample: null,
  downloads: null,
  busy: false,
  ctl: null,
};

// ---------- 저장소 (브라우저마다 따로. 저장 공간을 못 쓰는 창에서는 이번 화면에서만 기억) ----------
const memory = new Map();
function load(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    if (raw) return JSON.parse(raw);
  } catch {
    /* 아래 메모리 값으로 */
  }
  return memory.has(key) ? structuredClone(memory.get(key)) : fallback;
}
function save(key, value) {
  memory.set(key, structuredClone(value));
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* 메모리에만 남는다 */
  }
}

// ---------- 공통 UI ----------
let toastTimer;
function toast(message) {
  els.toast.textContent = message;
  els.toast.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => (els.toast.hidden = true), 2400);
}

async function copyText(text, el) {
  try {
    await navigator.clipboard.writeText(text);
    toast('복사했습니다');
  } catch {
    if (el) {
      const range = document.createRange();
      range.selectNodeContents(el);
      const sel = window.getSelection();
      sel.removeAllRanges();
      sel.addRange(range);
    }
    toast('복사가 막혀 있어 글을 선택해 두었습니다. Ctrl+C 로 복사하세요');
  }
}

const SAMPLE_ERRORS = {
  not_granted: '이 화면이 Claude를 쓰도록 허락되지 않았습니다. 허락하면 다시 만들 수 있습니다.',
  sampling_disabled: '이 계정에서는 이 화면으로 Claude를 쓸 수 없습니다.',
  rate_limited: '사용량 한도에 걸렸습니다. 잠시 뒤 다시 눌러 주세요.',
  session_expired: 'claude.ai에 다시 로그인해 주세요.',
  refused: 'Claude가 이 요청을 거절했습니다. 주제나 추가 요청 표현을 바꿔 보세요.',
  invalid_json: '결과 형식이 깨졌습니다. 다시 눌러 주세요. 계속되면 문항 수를 줄여 보세요.',
  empty_completion: '결과가 비어 있습니다. 주제를 조금 더 구체적으로 적어 보세요.',
  prompt_too_large: '입력이 너무 깁니다. 추가 요청을 줄여 주세요.',
  upstream_error: '연결이 끊겼습니다. 다시 눌러 주세요.',
};
const PERMANENT = new Set(['not_granted', 'sampling_disabled', 'not_declared', 'capability_disabled', 'capability_removed']);

function sampleErrorText(e) {
  return SAMPLE_ERRORS[e?.code] ?? e?.message ?? SAMPLE_ERRORS.upstream_error;
}

function setStatus(text, { progress = null, error = false, stoppable = false } = {}) {
  els.status.hidden = !text;
  els.status.classList.toggle('error', error);
  els.statusText.textContent = text ?? '';
  els.stop.hidden = !stoppable;
  els.meter.parentElement.hidden = progress === null;
  if (progress !== null) els.meter.style.width = `${Math.round(progress * 100)}%`;
}

// ---------- 생성 ----------
function readForm() {
  const f = new FormData(els.form);
  const questions = Math.min(20, Math.max(3, Number.parseInt(f.get('questions'), 10) || 10));
  return {
    topic: String(f.get('topic') ?? '').trim(),
    grade: String(f.get('grade') ?? '').trim() || '중학교 2학년',
    type: f.get('type') === 'study-guide' ? 'study-guide' : 'lesson-pack',
    questions,
    platforms: String(f.get('platforms') ?? '')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean),
    note: String(f.get('note') ?? '').trim(),
    author: String(f.get('author') ?? '').trim(),
    careful: f.get('careful') === 'on',
  };
}

function issuesText(error) {
  return error.issues
    .slice(0, 3)
    .map((i) => `${i.path.join('.')}: ${i.message}`)
    .join(', ');
}

async function ask(prompt, schema, label, step, opts) {
  let chars = 0;
  setStatus(`${step} ${label} — 생각하는 중…`, { progress: 0.03, stoppable: true });
  const data = await state.sample.json(prompt, {
    modelTier: opts.careful ? 'complex' : 'default',
    signal: state.ctl.signal,
    cache: false,
    onText: ({ text }) => {
      chars = text.length;
      // 대략적인 길이로 진행 막대를 채운다 (자료 본문은 보통 6천~1만 자).
      setStatus(`${step} ${label} — ${chars.toLocaleString('ko-KR')}자 작성`, {
        progress: Math.min(0.95, chars / 9000),
        stoppable: true,
      });
    },
  });
  const parsed = schema.safeParse(data);
  if (!parsed.success) {
    const err = new Error(`${label}의 형식이 맞지 않습니다 (${issuesText(parsed.error)}). 다시 눌러 주세요.`);
    err.code = 'invalid_shape';
    throw err;
  }
  return parsed.data;
}

async function makeMarketing(product, opts) {
  const platforms = opts.platforms.length ? opts.platforms : ['크몽'];
  return ask(
    jsonOnlyPrompt(MARKETING_SYSTEM, marketingPrompt({ product, platforms }), MARKETING_JSON_SCHEMA),
    MarketingSchema,
    '판매·홍보 문구',
    '2/2',
    opts,
  );
}

async function generate(opts) {
  state.busy = true;
  state.ctl = new AbortController();
  els.go.disabled = true;
  let kit = null;
  try {
    const product = await ask(
      jsonOnlyPrompt(PRODUCT_SYSTEM, productPrompt(opts), PRODUCT_JSON_SCHEMA),
      ProductSchema,
      '자료 본문',
      '1/2',
      opts,
    );
    kit = { id: `k${Date.now()}`, createdAt: new Date().toISOString(), input: opts, product, marketing: null };
    showKit(kit, { remember: true });
    const marketing = await makeMarketing(product, opts);
    kit = { ...kit, marketing };
    showKit(kit, { remember: true });
    setStatus('완성했습니다. 판매 전 체크를 마치고 파일을 받으세요.');
  } catch (e) {
    handleFailure(e, kit);
  } finally {
    state.busy = false;
    state.ctl = null;
    els.go.disabled = !state.sample;
    els.stop.hidden = true;
  }
}

async function retryMarketing() {
  const kit = state.kit;
  if (state.busy || !state.sample || !kit?.product) return;
  state.busy = true;
  state.ctl = new AbortController();
  els.go.disabled = true;
  try {
    const marketing = await makeMarketing(kit.product, kit.input);
    showKit({ ...kit, marketing }, { remember: true });
    setStatus('판매·홍보 문구를 만들었습니다.');
  } catch (e) {
    handleFailure(e, kit);
  } finally {
    state.busy = false;
    state.ctl = null;
    els.go.disabled = !state.sample;
    els.stop.hidden = true;
  }
}

function handleFailure(e, kit) {
  if (e?.code === 'cancelled') {
    setStatus(kit ? '멈췄습니다. 자료 본문까지는 저장했습니다.' : '멈췄습니다.');
    return;
  }
  if (PERMANENT.has(e?.code)) disableGeneration(sampleErrorText(e));
  const prefix = kit ? '자료 본문은 저장했지만 판매 문구를 만들지 못했습니다. ' : '';
  setStatus(prefix + (e?.code === 'invalid_shape' ? e.message : sampleErrorText(e)), { error: true });
}

function disableGeneration(message) {
  state.sample = null;
  els.go.disabled = true;
  els.availability.textContent = message;
}

// ---------- 기록 ----------
function history() {
  const list = load(HISTORY_KEY, []);
  return Array.isArray(list) ? list.filter((k) => k && k.product && k.id) : [];
}

function remember(kit) {
  const list = history().filter((k) => k.id !== kit.id);
  list.unshift(kit);
  save(HISTORY_KEY, list.slice(0, MAX_HISTORY));
  renderRecent();
}

function renderRecent() {
  const list = history();
  els.recent.hidden = list.length === 0;
  els.recentList.innerHTML = list
    .map((k) => {
      const d = new Date(k.createdAt);
      const when = Number.isNaN(d.getTime()) ? '' : `${d.getMonth() + 1}/${d.getDate()}`;
      return `<li><button type="button" data-kit="${escapeHtml(k.id)}" aria-current="${k.id === state.kit.id}"><span>${escapeHtml(k.product.title)}</span><time>${when}</time></button></li>`;
    })
    .join('');
}

// ---------- 결과물 화면 ----------
function checksFor(kitId) {
  const all = load(CHECKS_KEY, {});
  return Array.isArray(all[kitId]) ? all[kitId] : [];
}

function setChecks(kitId, keys) {
  const all = load(CHECKS_KEY, {});
  all[kitId] = keys;
  save(CHECKS_KEY, all);
}

function checklistCounts(kit) {
  const total = checklistSections(kit.product).reduce((n, s) => n + s.items.length, 0);
  const done = checksFor(kit.id).length;
  return { done: Math.min(done, total), total };
}

const TABS = [
  ['preview', '자료 미리보기'],
  ['listing', '판매 문구'],
  ['blog', '블로그 글'],
  ['sns', 'SNS·숏폼'],
  ['check', '판매 전 체크'],
];

function showKit(kit, { remember: keep = false } = {}) {
  state.kit = kit;
  if (keep) remember(kit);
  else renderRecent();
  renderKitView();
}

function renderKitView() {
  const kit = state.kit;
  const p = kit.product;
  const { done, total } = checklistCounts(kit);
  const when = kit.createdAt ? new Date(kit.createdAt).toLocaleString('ko-KR', { dateStyle: 'medium', timeStyle: 'short' }) : '';
  const canDownload = Boolean(state.downloads);

  els.kit.innerHTML = `
    <div class="kit-head">
      <div class="kit-title">
        <h2>${escapeHtml(p.title)}</h2>
        ${kit.isSample ? '<span class="badge">예시</span>' : ''}
      </div>
      <p class="kit-meta">${escapeHtml(p.audience)}${when ? ` · ${escapeHtml(when)} 생성` : ''}${
        kit.isSample ? ' · 화면 구성을 보여 주는 예시입니다. 왼쪽에서 주제를 넣고 직접 만들어 보세요.' : ''
      }</p>
      <div class="actions">
        ${
          canDownload
            ? `<button type="button" class="btn small" data-act="dl-html">자료 HTML 받기</button>
               <button type="button" class="btn small" data-act="dl-zip">전체 묶음 zip 받기</button>`
            : '<span class="note">claude.ai에서 열면 파일로 받을 수 있습니다. 지금은 각 탭의 복사 버튼을 쓰세요.</span>'
        }
      </div>
    </div>
    <div class="tabs" role="tablist">
      ${TABS.map(
        ([key, label]) =>
          `<button type="button" role="tab" id="tab-${key}" aria-selected="${state.tab === key}" data-tab="${key}">${label}${
            key === 'check' ? `<span class="count">${done}/${total}</span>` : ''
          }</button>`,
      ).join('')}
    </div>
    <div class="panel" role="tabpanel" aria-labelledby="tab-${state.tab}" id="panel"></div>`;
  renderPanel();
}

function needMarketing() {
  if (state.kit.marketing) return null;
  const can = Boolean(state.sample) && !state.busy;
  return `<div class="empty"><p>판매·홍보 문구가 아직 없습니다.</p>${
    can ? '<button type="button" class="btn" data-act="retry-marketing">판매 문구 만들기</button>' : ''
  }</div>`;
}

function copyButton(label, key) {
  return `<button type="button" class="btn small" data-copy="${key}">${label}</button>`;
}

// 복사할 원문은 data 속성 대신 이 표에 담아 둔다(긴 글·따옴표 걱정 없이).
let copySources = {};

function renderPanel() {
  const panel = $('panel');
  const kit = state.kit;
  copySources = {};
  const src = (key, text) => {
    copySources[key] = text;
    return key;
  };

  if (state.tab === 'preview') {
    panel.innerHTML = `<p class="howto">받은 HTML 파일을 크롬·엣지에서 열고 인쇄(Ctrl+P) → "PDF로 저장"을 고르면 판매용 PDF가 됩니다.</p>
      <div class="paper"><div class="paper-host" id="paper-host"></div></div>`;
    const host = $('paper-host');
    const root = host.attachShadow({ mode: 'open' });
    root.innerHTML = `<style>${PRODUCT_CSS}</style>${renderProductSheet(kit.product, { author: kit.input?.author ?? '' })}`;
    return;
  }

  if (state.tab === 'check') {
    const checked = new Set(checksFor(kit.id));
    const { done, total } = checklistCounts(kit);
    panel.innerHTML = `<div class="stack checklist">
      <div class="progress"><div class="bar"><i style="width:${total ? (done / total) * 100 : 0}%"></i></div><b>${done}/${total}</b></div>
      <p class="note">${done === total ? '<span class="ready">판매 준비가 끝났습니다.</span>' : 'AI가 만든 초안은 틀릴 수 있습니다. 모두 확인한 뒤에 판매처에 올리세요. 체크 상태는 이 브라우저에만 저장됩니다.'}</p>
      ${checklistSections(kit.product)
        .map(
          (sec, si) => `<div><h3>${si + 1}. ${escapeHtml(sec.title)}</h3><ul>${sec.items
            .map((it, ii) => {
              const key = `${si}.${ii}`;
              return `<li${si === 0 ? ' class="fact"' : ''}><label for="chk-${key}"><input type="checkbox" id="chk-${key}" data-check="${key}"${
                checked.has(key) ? ' checked' : ''
              }><span>${escapeHtml(it.text)}${it.hint ? `<small>${escapeHtml(it.hint)}</small>` : ''}</span></label></li>`;
            })
            .join('')}</ul></div>`,
        )
        .join('')}
    </div>`;
    return;
  }

  const missing = needMarketing();
  if (missing) {
    panel.innerHTML = missing;
    return;
  }
  const m = kit.marketing;

  if (state.tab === 'listing') {
    panel.innerHTML = `<div class="stack">${m.listings
      .map(
        (l, i) => `<article class="card">
          <div class="card-head"><h3>${escapeHtml(l.platform)}</h3><span class="price">${l.suggestedPriceKRW.toLocaleString('ko-KR')}원</span></div>
          <dl class="kv">
            <dt>상품명</dt><dd id="l${i}-t">${escapeHtml(l.title)}</dd><dd>${copyButton('복사', src(`l${i}-t`, l.title))}</dd>
            <dt>한 줄 소개</dt><dd id="l${i}-s">${escapeHtml(l.shortDescription)}</dd><dd>${copyButton('복사', src(`l${i}-s`, l.shortDescription))}</dd>
            <dt>태그</dt><dd id="l${i}-g"><div class="chips">${l.tags.map((t) => `<span>${escapeHtml(t)}</span>`).join('')}</div></dd><dd>${copyButton('복사', src(`l${i}-g`, l.tags.join(', ')))}</dd>
            <dt>가격 근거</dt><dd>${escapeHtml(l.priceRationale)}</dd><dd></dd>
          </dl>
          <div class="card-head"><h3>상세 설명</h3>${copyButton('상세 설명 복사', src(`l${i}-d`, l.longDescription))}</div>
          <div class="text" id="l${i}-d">${escapeHtml(l.longDescription)}</div>
        </article>`,
      )
      .join('')}</div>`;
    return;
  }

  if (state.tab === 'blog') {
    const b = m.blogPost;
    panel.innerHTML = `<article class="card">
      <div class="card-head"><h3>${escapeHtml(b.title)}</h3>${copyButton('글 전체 복사', src('blog', renderBlogMd(m)))}</div>
      <p class="note">검색 설명: ${escapeHtml(b.metaDescription)}</p>
      <div class="chips">${b.keywords.map((k) => `<span>${escapeHtml(k)}</span>`).join('')}</div>
      <div class="text" id="blog">${escapeHtml(b.bodyMarkdown)}\n\n${escapeHtml(b.callToAction)}</div>
      <p class="note">게시하기 전에 마지막 문단의 "판매 페이지" 자리에 실제 판매 링크를 넣으세요.</p>
    </article>`;
    return;
  }

  if (state.tab === 'sns') {
    const s = m.shortsScript;
    const scriptText = [`첫 3초: ${s.hook}`, ...s.scenes.map((sc) => `[${sc.seconds}초] ${sc.narration} / 자막: ${sc.onScreenText}`), `마무리: ${s.cta}`].join('\n');
    panel.innerHTML = `<div class="stack">
      ${m.sns
        .map((post, i) => {
          const tags = post.hashtags.map((h) => (h.startsWith('#') ? h : `#${h}`)).join(' ');
          const full = `${post.text}\n\n${tags}`;
          return `<article class="card"><div class="card-head"><h3>${escapeHtml(post.channel)}</h3>${copyButton('복사', src(`s${i}`, full))}</div>
            <div class="text" id="s${i}">${escapeHtml(full)}</div></article>`;
        })
        .join('')}
      <article class="card">
        <div class="card-head"><h3>숏폼 대본</h3>${copyButton('대본 복사', src('shorts', scriptText))}</div>
        <p><b>첫 3초</b> ${escapeHtml(s.hook)}</p>
        <div class="table-scroll" id="shorts"><table class="scenes"><thead><tr><th>초</th><th>내레이션</th><th>화면 자막</th></tr></thead><tbody>
          ${s.scenes.map((sc) => `<tr><td>${sc.seconds}초</td><td>${escapeHtml(sc.narration)}</td><td>${escapeHtml(sc.onScreenText)}</td></tr>`).join('')}
        </tbody></table></div>
        <p><b>마무리</b> ${escapeHtml(s.cta)}</p>
      </article>
    </div>`;
  }
}

// ---------- 파일 받기 ----------
async function offer(filename, data) {
  try {
    await state.downloads.save({ filename, data });
    toast('저장했습니다');
  } catch (e) {
    if (e?.code === 'declined') return;
    if (e?.code === 'rate_limited') return toast('저장 창이 이미 열려 있습니다');
    toast('이 화면에서는 파일을 저장할 수 없습니다');
  }
}

function kitFiles(kit) {
  const opts = { author: kit.input?.author ?? '' };
  if (kit.marketing) return renderKit(kit, opts);
  // 판매 문구가 없을 때는 자료 본문과 체크리스트만 묶는다.
  return { 'product.html': renderProductHtml(kit.product, opts), 'CHECKLIST.md': renderChecklistMd(kit.product) };
}

async function downloadHtml() {
  const kit = state.kit;
  await offer(`${slugify(kit.product.title)}.html`, kitFiles(kit)['product.html']);
}

async function downloadZip() {
  const kit = state.kit;
  const zip = new JSZip();
  const files = kitFiles(kit);
  for (const [name, content] of Object.entries(files)) zip.file(name, content);
  zip.file('kit.json', JSON.stringify({ product: kit.product, marketing: kit.marketing }, null, 2));
  const blob = await zip.generateAsync({ type: 'blob' });
  await offer(`${slugify(kit.product.title)}.zip`, blob);
}

// ---------- 이벤트 ----------
els.form.addEventListener('submit', (ev) => {
  ev.preventDefault();
  if (state.busy) return;
  const opts = readForm();
  if (!opts.topic) {
    setStatus('주제를 적어 주세요.', { error: true });
    $('topic').focus();
    return;
  }
  if (!state.sample) {
    setStatus('claude.ai에서 이 화면을 열어야 자료를 만들 수 있습니다.', { error: true });
    return;
  }
  state.tab = 'preview';
  generate(opts);
});

els.stop.addEventListener('click', () => state.ctl?.abort());

els.recentList.addEventListener('click', (ev) => {
  const btn = ev.target.closest('[data-kit]');
  if (!btn) return;
  const kit = history().find((k) => k.id === btn.dataset.kit);
  if (kit) showKit(kit);
});

els.kit.addEventListener('click', (ev) => {
  const tab = ev.target.closest('[data-tab]');
  if (tab) {
    state.tab = tab.dataset.tab;
    renderKitView();
    return;
  }
  const copy = ev.target.closest('[data-copy]');
  if (copy) {
    const key = copy.dataset.copy;
    copyText(copySources[key] ?? '', $(key));
    return;
  }
  const act = ev.target.closest('[data-act]')?.dataset.act;
  if (act === 'dl-html') downloadHtml();
  else if (act === 'dl-zip') downloadZip();
  else if (act === 'retry-marketing') retryMarketing();
});

els.kit.addEventListener('change', (ev) => {
  const box = ev.target.closest('[data-check]');
  if (!box) return;
  const keys = new Set(checksFor(state.kit.id));
  if (box.checked) keys.add(box.dataset.check);
  else keys.delete(box.dataset.check);
  setChecks(state.kit.id, [...keys]);
  const scrollY = window.scrollY;
  renderKitView();
  window.scrollTo(0, scrollY);
  $(`chk-${box.dataset.check}`)?.focus();
});

// ---------- 시작 ----------
const latest = history()[0];
if (latest) state.kit = latest;
renderRecent();
renderKitView();
els.go.disabled = true;

(async () => {
  if (!window.claude?.use) {
    disableGeneration('이 화면은 claude.ai에서 열어야 자료를 만들 수 있습니다. 지금은 예시와 지난 기록만 볼 수 있습니다.');
    return;
  }
  const [sample, downloads] = await Promise.all([
    window.claude.use('sample').catch(() => null),
    window.claude.use('downloads').catch(() => null),
  ]);
  state.downloads = downloads;
  if (sample) {
    state.sample = sample;
    els.go.disabled = state.busy;
  } else {
    disableGeneration('지금 보기 방식에서는 자료를 만들 수 없습니다. claude.ai에 로그인한 상태로 열어 주세요.');
  }
  renderKitView();
})();
