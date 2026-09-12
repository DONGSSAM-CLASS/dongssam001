// ---------------------------------------------------------------------------
// ui.js — DOM 도우미, 오른쪽 위 상태창(HUD), 사료 상자, 단서 수첩, 알림
// ---------------------------------------------------------------------------
import { sceneSVG, portraitSVG } from './art.js';
import { SOURCES } from './data/sources.js';
import { STANDARDS } from './data/standards.js';
import * as S from './store.js';
import { CHAPTERS } from './data/chapters.js';

export const $ = (sel, root) => (root || document).querySelector(sel);
export const $$ = (sel, root) => Array.from((root || document).querySelectorAll(sel));

export function h(tag, attrs, ...kids) {
  const el = document.createElement(tag);
  Object.entries(attrs || {}).forEach(([k, v]) => {
    if (v === null || v === undefined || v === false) return;
    if (k === 'class') el.className = v;
    else if (k === 'html') el.innerHTML = v;
    else if (k === 'text') el.textContent = v;
    else if (k.startsWith('on') && typeof v === 'function') el.addEventListener(k.slice(2).toLowerCase(), v);
    else if (k === 'dataset') Object.assign(el.dataset, v);
    else el.setAttribute(k, v);
  });
  kids.flat().forEach((kid) => {
    if (kid === null || kid === undefined || kid === false) return;
    el.append(kid.nodeType ? kid : document.createTextNode(String(kid)));
  });
  return el;
}

export function escapeHTML(s) {
  return String(s ?? '').replace(/[&<>"']/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

/** 줄바꿈을 <p> 로 바꾼다(입력은 이스케이프한다). */
export function paras(text) {
  return String(text || '')
    .split(/\n{2,}|\n/)
    .filter((t) => t.trim())
    .map((t) => `<p>${escapeHTML(t.trim())}</p>`)
    .join('');
}

// ── 화면 전환 ──────────────────────────────────────────────────────────
const stage = () => $('#stage');

export function showScene(artKey) {
  const back = $('#backdrop');
  if (back.dataset.art === artKey) return;
  back.dataset.art = artKey;
  back.innerHTML = sceneSVG(artKey);
}

export function render(node, opts) {
  const st = stage();
  st.innerHTML = '';
  st.append(node);
  st.scrollTop = 0;
  if (opts && opts.focus) {
    const target = $(opts.focus, st);
    if (target) setTimeout(() => target.focus(), 60);
  }
  // 스크린리더에 화면이 바뀌었음을 알린다
  if (opts && opts.announce) announce(opts.announce);
}

let liveTimer = null;
export function announce(msg) {
  const live = $('#live');
  if (!live) return;
  clearTimeout(liveTimer);
  live.textContent = '';
  liveTimer = setTimeout(() => { live.textContent = msg; }, 40);
}

// ── 알림 토스트 ────────────────────────────────────────────────────────
export function toast(msg, kind) {
  const box = $('#toasts');
  const el = h('div', { class: `toast ${kind || ''}`, role: 'status' }, msg);
  box.append(el);
  setTimeout(() => el.classList.add('in'), 10);
  setTimeout(() => {
    el.classList.remove('in');
    setTimeout(() => el.remove(), 320);
  }, 3600);
}

// ── 모달 ───────────────────────────────────────────────────────────────
let lastFocus = null;
export function modal(title, bodyNode, opts) {
  closeModal();
  lastFocus = document.activeElement;
  const close = () => closeModal();
  const wrap = h('div', { class: 'modal-wrap', role: 'dialog', 'aria-modal': 'true', 'aria-label': title },
    h('div', { class: 'modal-back', onclick: close }),
    h('div', { class: 'modal' },
      h('div', { class: 'modal-head' },
        h('h2', { text: title }),
        h('button', { class: 'icon-btn', onclick: close, 'aria-label': '닫기', text: '✕' })
      ),
      h('div', { class: 'modal-body' }, bodyNode),
      opts && opts.footer ? h('div', { class: 'modal-foot' }, opts.footer) : null
    )
  );
  document.body.append(wrap);
  document.body.classList.add('modal-open');
  setTimeout(() => {
    const f = wrap.querySelector('button, [href], input, select, textarea');
    if (f) f.focus();
  }, 40);
  wrap.addEventListener('keydown', (e) => { if (e.key === 'Escape') close(); });
  return wrap;
}

export function closeModal() {
  const w = $('.modal-wrap');
  if (w) w.remove();
  document.body.classList.remove('modal-open');
  if (lastFocus && lastFocus.isConnected) lastFocus.focus();
  lastFocus = null;
}

// ── 사료 상자 (원문 · 쉬운 해석 · APA 출처) ────────────────────────────
// 요구 사항: 인물의 대사 <바로 밑>에 원문 / 해석 / APA 출처가 함께 보여야 한다.
export function sourceBox(sourceId) {
  const s = SOURCES[sourceId];
  if (!s) return null;
  const notes = (s.note || []).map(([w, d]) =>
    h('li', {}, h('b', { text: w }), ' — ', d));

  return h('figure', { class: 'source' },
    h('figcaption', { class: 'source-title' },
      h('span', { class: 'tag-src', text: '사료' }), ' ', s.title),

    s.original ? h('div', { class: 'source-orig' },
      h('div', { class: 'source-label', text: '원문' }),
      h('p', { class: 'hanja', text: s.original })
    ) : null,

    s.reading ? h('div', { class: 'source-read' },
      h('div', { class: 'source-label', text: s.original ? '원문 풀이' : '원문' }),
      h('p', { text: s.reading })
    ) : null,

    h('div', { class: 'source-easy' },
      h('div', { class: 'source-label', text: '쉽게 말하면' }),
      h('p', { text: s.easy })
    ),

    notes.length ? h('details', { class: 'source-note' },
      h('summary', { text: `어려운 말 풀이 (${notes.length})` }),
      h('ul', {}, notes)
    ) : null,

    h('cite', { class: 'source-apa', text: s.apa })
  );
}

/** append 에 null/undefined 가 섞여 들어가 "null" 글자가 찍히는 것을 막는다. */
export function appendAll(parent, ...kids) {
  kids.flat().forEach((k) => {
    if (k === null || k === undefined || k === false) return;
    parent.append(k);
  });
}

// ── 오른쪽 위 상태창 ───────────────────────────────────────────────────
let hudTimer = null;

export function mountHUD() {
  const hud = $('#hud');
  hud.hidden = false;
  paintHUD();
  clearInterval(hudTimer);
  hudTimer = setInterval(() => {
    const t = $('#hud-time');
    if (t) t.textContent = S.formatTime(S.elapsed());
  }, 1000);
}

export function unmountHUD() {
  $('#hud').hidden = true;
  clearInterval(hudTimer);
  hudTimer = null;
}

export function paintHUD() {
  const hud = $('#hud');
  if (!hud || hud.hidden) return;
  const ci = Math.min(S.save.chapterIndex, CHAPTERS.length - 1);
  const ch = CHAPTERS[ci];
  const isFinal = S.save.chapterIndex >= CHAPTERS.length;
  const list = S.puzzlesOf(ch, S.save.tier);
  const done = list.filter((p) => S.save.solved[p.id]).length;
  const pct = S.percent();

  hud.innerHTML = '';
  // append 는 null 을 문자열 "null" 로 넣어 버리므로 반드시 걸러 낸다
  appendAll(hud,
    h('div', { class: 'hud-top' },
      h('span', { class: 'hud-badge', text: isFinal ? '마지막' : `미션 ${ch.no}/${CHAPTERS.length}` }),
      h('span', { class: 'hud-tier', text: S.isHigh() ? '고등학생용' : '중학생용' }),
      h('span', { class: 'hud-time', id: 'hud-time', text: S.formatTime(S.elapsed()) })
    ),
    h('h2', { class: 'hud-title', text: isFinal ? '시간의 문' : ch.title }),
    h('div', { class: 'hud-where', text: isFinal ? '모든 시대의 끝' : `${ch.place} · ${ch.era}` }),
    h('div', { class: 'hud-goal' },
      h('span', { class: 'hud-goal-label', text: '지금 할 일' }),
      h('span', { text: isFinal ? '여섯 조각을 맞추고 문을 연다' : ch.goal })
    ),
    isFinal ? null : h('div', { class: 'hud-row' },
      h('span', { class: 'hud-k', text: '자물쇠' }),
      h('span', { class: 'hud-v', text: `${done} / ${list.length} 풀었어요` })
    ),
    h('div', { class: 'hud-bar', role: 'progressbar', 'aria-valuenow': String(pct),
      'aria-valuemin': '0', 'aria-valuemax': '100', 'aria-label': '전체 진행률' },
      h('i', { style: `width:${pct}%` })
    ),
    h('div', { class: 'hud-pct', text: `전체 진행 ${pct}%` }),
    h('div', { class: 'hud-shards', 'aria-label': '모은 열쇠 조각' },
      ...['開', '疆', '亂', '抗', '革', '文'].map((g) =>
        h('span', { class: `shard ${S.save.shards.includes(g) ? 'on' : ''}`, text: g, title: g }))
    ),
    h('div', { class: 'hud-acts' },
      h('button', { class: 'hud-btn', onclick: openNotebook },
        `단서 수첩 (${S.save.clues.length})`),
      h('button', { class: 'hud-btn', onclick: openStandard }, '이 미션의 성취기준')
    )
  );
}

// ── 단서 수첩 ──────────────────────────────────────────────────────────
export function openNotebook() {
  const byChapter = {};
  S.save.clues.forEach((c) => {
    (byChapter[c.chapter] = byChapter[c.chapter] || { title: c.chapterTitle, items: [] }).items.push(c);
  });
  const keys = Object.keys(byChapter).sort((a, b) => a - b);
  const body = keys.length
    ? h('div', { class: 'notebook' }, ...keys.map((k) =>
        h('section', {},
          h('h3', { text: `${k}장 · ${byChapter[k].title}` }),
          h('ul', {}, ...byChapter[k].items.map((c) =>
            h('li', {}, h('b', { text: c.title }), h('span', { text: c.text }))))
        )))
    : h('p', { class: 'muted', text: '아직 모은 단서가 없어요. 사람들과 이야기해 보세요.' });
  modal('단서 수첩', body);
}

// ── 성취기준 안내 ──────────────────────────────────────────────────────
export function openStandard() {
  const ci = Math.min(S.save.chapterIndex, CHAPTERS.length - 1);
  const ch = CHAPTERS[ci];
  const st = STANDARDS[ch.standard];
  modal('이 미션이 닿는 곳', h('div', { class: 'std-box' },
    h('div', { class: 'std-code', text: `[${st.code}]` }),
    h('p', { class: 'std-text', text: st.text }),
    h('p', { class: 'std-area', text: `영역 · ${st.area}` }),
    h('hr'),
    h('p', { class: 'muted small', text:
      '이 게임의 성취기준은 2022 개정 역사과 교육과정을 따릅니다. ' +
      '지금 학교에서 운영 중인 교육과정은 2015 개정 교육과정이지만, ' +
      '2015 개정 교육과정이 올해 안에 적용을 마치기 때문에 ' +
      '이후에도 계속 사용할 수 있도록 2022 개정 교육과정으로 편성했습니다.' })
  ));
}

// ── 인물 말풍선 ────────────────────────────────────────────────────────
export function speaker(beat) {
  return h('div', { class: 'speaker' },
    h('div', { class: 'portrait', html: portraitSVG(beat.portrait || 'commoner') }),
    h('div', { class: 'who' },
      h('div', { class: 'who-name', text: beat.who }),
      h('div', { class: 'who-role', text: beat.role || '' })
    )
  );
}

export function button(label, onclick, cls) {
  return h('button', { class: `btn ${cls || ''}`, onclick, type: 'button' }, label);
}
