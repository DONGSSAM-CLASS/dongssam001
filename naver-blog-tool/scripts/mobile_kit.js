#!/usr/bin/env node
// 모바일 붙여넣기 키트 — PC 없이 폰에서 네이버 블로그 앱으로 옮겨 적기 위한 한 장짜리 HTML.
// 블록마다 [복사] 버튼, 사진 슬롯 안내, 태그 복사, 발행 전 체크리스트. 사진이 파일로 있으면 썸네일도 넣는다.
// 점검(check_draft) 오류가 남아 있으면 상단에 "아직 붙여넣지 마세요" 배너를 띄운다.
//
// 사용: node scripts/mobile_kit.js drafts/<초안>.json   → drafts/<초안>.kit.html

const fs = require('fs');
const path = require('path');
const { loadDraft, checkDraft, resolvePath } = require('./lib/draft');

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const MIME = { '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp' };

function thumb(p) {
  if (!p) return '';
  const abs = resolvePath(p);
  if (!fs.existsSync(abs)) return '';
  const mime = MIME[path.extname(abs).toLowerCase()];
  if (!mime) return '';
  return `<img src="data:${mime};base64,${fs.readFileSync(abs).toString('base64')}" alt="">`;
}

// 블록 → 붙여넣기 단계. 연속된 text 블록은 한 번에 붙여넣도록 묶는다(블록 사이 빈 줄).
function buildSteps(draft) {
  const steps = [{ kind: 'title', label: '제목', how: '제목 칸에 붙여넣기', copy: draft.title }];
  let photoNo = 0;
  let buf = [];
  const flush = () => {
    if (!buf.length) return;
    steps.push({ kind: 'text', label: '본문', how: '본문에 붙여넣기 (서식: 본문)', copy: buf.join('\n\n') });
    buf = [];
  };
  for (const b of draft.blocks) {
    if (b.type === 'text') {
      buf.push(b.text);
      continue;
    }
    flush();
    if (b.type === 'subtitle') steps.push({ kind: 'subtitle', label: '소제목', how: '문단 서식을 "소제목"으로 바꾼 뒤 붙여넣기 → 다음 줄은 다시 "본문"', copy: b.text });
    else if (b.type === 'quote') steps.push({ kind: 'quote', label: '인용구', how: '+ 버튼 → 인용구 선택 후 붙여넣기', copy: b.text });
    else if (b.type === 'divider') steps.push({ kind: 'divider', label: '구분선', how: '+ 버튼 → 구분선 삽입', copy: '' });
    else if (b.type === 'image') {
      photoNo += 1;
      steps.push({
        kind: 'image',
        label: `사진 ${photoNo}`,
        how: `${b.label || path.basename(String(b.path || ''))}${b.caption ? ' — 사진 넣은 뒤 설명(캡션)에 붙여넣기' : ' — 캡션 없음'}`,
        copy: b.caption || '',
        img: thumb(b.path),
      });
    }
  }
  flush();
  return steps;
}

function render(draft, check, key) {
  const steps = buildSteps(draft);
  const tags = (draft.tags || []).map((t) => String(t).replace(/^#+/, '').trim()).filter(Boolean);
  const blocked = check.errors.length > 0;
  const facts = draft.facts || [];
  const verified = facts.filter((f) => f.verified === true).length;
  const photoCount = steps.filter((s) => s.kind === 'image').length;

  const stepHtml = steps
    .map((s, i) => {
      const copyBtn = s.copy ? `<button class="copy" data-i="${i}">복사</button>` : '';
      const body = s.copy ? `<pre class="txt">${esc(s.copy)}</pre>` : '';
      return `<li class="step k-${s.kind}" data-step="${i}">
  <div class="row"><label class="chk"><input type="checkbox" data-done="${i}"><span class="n">${i + 1}</span><b>${esc(s.label)}</b></label>${copyBtn}</div>
  <div class="how">${esc(s.how)}</div>${s.img ? `<div class="thumb">${s.img}<small>길게 눌러 사진 저장</small></div>` : ''}${body}
</li>`;
    })
    .join('\n');

  const banner = blocked
    ? `<div class="banner stop"><b>아직 붙여넣지 마세요</b> — 점검 오류 ${check.errors.length}건<ul>${check.errors
        .slice(0, 6)
        .map((e) => `<li>${esc(e)}</li>`)
        .join('')}</ul>채팅에서 해결한 뒤 키트를 다시 받으세요.</div>`
    : `<div class="banner go"><b>붙여넣기 준비 완료</b> — 점검 통과${facts.length ? ` · 사실 검증 ${verified}/${facts.length}` : ''}</div>`;

  const copies = JSON.stringify(steps.map((s) => s.copy));
  return `<!DOCTYPE html>
<html lang="ko"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>모바일 붙여넣기 키트</title>
<style>
:root { --bg:#f3f4f6; --card:#fff; --ink:#111827; --sub:#6b7280; --line:#e5e7eb; --accent:#03c75a; --accent-ink:#fff; --stop:#fef2f2; --stop-ink:#991b1b; --go:#ecfdf5; --go-ink:#065f46; --pre:#f9fafb; }
@media (prefers-color-scheme: dark) { :root:not([data-theme="light"]) { --bg:#0f1115; --card:#1a1d23; --ink:#e5e7eb; --sub:#9ca3af; --line:#2b2f37; --stop:#3b1414; --stop-ink:#fecaca; --go:#0f2e24; --go-ink:#a7f3d0; --pre:#14161b; } }
:root[data-theme="dark"] { --bg:#0f1115; --card:#1a1d23; --ink:#e5e7eb; --sub:#9ca3af; --line:#2b2f37; --stop:#3b1414; --stop-ink:#fecaca; --go:#0f2e24; --go-ink:#a7f3d0; --pre:#14161b; }
* { box-sizing:border-box; }
body { margin:0; background:var(--bg); color:var(--ink); font-family:-apple-system,BlinkMacSystemFont,"Apple SD Gothic Neo","Malgun Gothic",sans-serif; font-size:15px; }
main { max-width:560px; margin:0 auto; padding:16px 16px 48px; }
h1 { font-size:18px; margin:4px 0 4px; line-height:1.4; }
.meta { color:var(--sub); font-size:13px; margin-bottom:12px; line-height:1.6; }
.banner { border-radius:12px; padding:12px 14px; margin:12px 0; font-size:14px; line-height:1.55; }
.banner ul { margin:6px 0; padding-left:18px; } .stop { background:var(--stop); color:var(--stop-ink); } .go { background:var(--go); color:var(--go-ink); }
.guide { background:var(--card); border-radius:12px; padding:12px 14px; font-size:13px; line-height:1.7; color:var(--sub); }
.guide b { color:var(--ink); }
ol.steps { list-style:none; margin:14px 0 0; padding:0; display:flex; flex-direction:column; gap:10px; }
.step { background:var(--card); border-radius:12px; padding:12px 14px; border-left:4px solid var(--line); }
.step.done { opacity:.55; }
.k-subtitle { border-left-color:#3b82f6; } .k-quote { border-left-color:var(--accent); } .k-image { border-left-color:#f59e0b; } .k-title { border-left-color:#8b5cf6; }
.row { display:flex; align-items:center; justify-content:space-between; gap:8px; }
.chk { display:flex; align-items:center; gap:8px; min-width:0; }
.chk input { width:20px; height:20px; accent-color:var(--accent); flex:none; }
.n { font-size:12px; color:var(--sub); }
.how { font-size:13px; color:var(--sub); margin:6px 0 0; line-height:1.5; }
pre.txt { white-space:pre-wrap; word-break:keep-all; overflow-wrap:anywhere; background:var(--pre); border-radius:8px; padding:10px; margin:8px 0 0; font:inherit; font-size:14px; line-height:1.7; max-height:220px; overflow:auto; }
button.copy, .tagbtn { flex:none; border:0; border-radius:999px; background:var(--accent); color:var(--accent-ink); font-weight:700; padding:8px 16px; font-size:14px; min-height:36px; }
button.copy.ok { background:var(--sub); }
.thumb { margin-top:8px; } .thumb img { width:100%; border-radius:8px; display:block; } .thumb small { color:var(--sub); font-size:12px; }
.tags { background:var(--card); border-radius:12px; padding:12px 14px; margin-top:10px; }
.tagwrap { display:flex; flex-wrap:wrap; gap:6px; margin-top:8px; }
.tagbtn { background:transparent; color:var(--accent); border:1px solid var(--accent); padding:6px 12px; font-weight:600; min-height:32px; }
.final { background:var(--card); border-radius:12px; padding:12px 14px; margin-top:10px; font-size:14px; line-height:1.8; }
.final ul { margin:0; padding-left:18px; }
.toast { position:fixed; left:50%; bottom:24px; transform:translateX(-50%); background:var(--ink); color:var(--bg); padding:8px 16px; border-radius:999px; font-size:13px; opacity:0; transition:opacity .2s; pointer-events:none; }
.toast.on { opacity:1; }
</style></head><body><main>
<h1>${esc(draft.title)}</h1>
<div class="meta">메인 키워드 <b>${esc(draft.mainKeyword || '-')}</b> · 사진 ${photoCount}장 · 협찬 ${draft.sponsored ? '예(첫 줄 표기 확인)' : '아니오'}${draft.basisDate ? ` · 기준일 ${esc(draft.basisDate)}` : ''}</div>
${banner}
<div class="guide"><b>사용법</b> — 이 페이지와 네이버 블로그 앱을 번갈아 보세요.<br>
① 사진은 폰 갤러리에 미리 준비 (개인정보는 편집에서 가리기)<br>
② 앱에서 글쓰기 → 아래 순서대로 [복사] → 붙여넣기, 끝난 단계는 체크<br>
③ 마지막에 태그 입력 → <b>저장(임시저장)</b> → 미리보기로 확인 후 발행</div>
<ol class="steps">
${stepHtml}
</ol>
<div class="tags"><div class="row"><b>태그 ${tags.length}개</b><button class="copy" id="tagall">전체 복사</button></div>
<div class="how">발행 설정의 태그 칸에 하나씩 입력 (탭하면 하나씩 복사)</div>
<div class="tagwrap">${tags.map((t) => `<button class="tagbtn" data-tag="${esc(t)}">#${esc(t)}</button>`).join('')}</div></div>
<div class="final"><b>발행 전 체크</b><ul>
<li>소제목 ${steps.filter((s) => s.kind === 'subtitle').length}개가 "소제목" 서식인지</li>
<li>인용구 ${steps.filter((s) => s.kind === 'quote').length}개가 인용구로 들어갔는지</li>
<li>사진 속 이름·주민번호·계좌·금액이 가려졌는지</li>
${draft.sponsored ? '<li>첫 줄 협찬 표기가 보이는지</li>' : ''}
<li>광고 클릭을 부탁하는 문구가 없는지</li>
<li>발행 직전 공식 안내를 한 번 더 열어 날짜 확인</li>
<li>발행 후 24시간은 수정하지 않기</li></ul></div>
</main>
<div class="toast" id="toast">복사했어요</div>
<script>
const COPIES = ${copies.replace(/</g, '\\u003c')};
const TAGS = ${JSON.stringify(tags).replace(/</g, '\\u003c')};
const KEY = ${JSON.stringify(key)};
const toast = (m) => { const t = document.getElementById('toast'); t.textContent = m; t.classList.add('on'); clearTimeout(toast._t); toast._t = setTimeout(() => t.classList.remove('on'), 1200); };
async function copyText(text) {
  try { await navigator.clipboard.writeText(text); return true; } catch (_) {}
  const ta = document.createElement('textarea'); ta.value = text; ta.setAttribute('readonly', ''); ta.style.position = 'fixed'; ta.style.opacity = '0';
  document.body.appendChild(ta); ta.select(); ta.setSelectionRange(0, text.length);
  let ok = false; try { ok = document.execCommand('copy'); } catch (_) {}
  ta.remove(); return ok;
}
let done = {};
try { done = JSON.parse(localStorage.getItem(KEY) || '{}'); } catch (_) {}
const save = () => { try { localStorage.setItem(KEY, JSON.stringify(done)); } catch (_) {} };
const mark = (i, v) => { done[i] = v; const li = document.querySelector('[data-step="' + i + '"]'); if (li) li.classList.toggle('done', v); const cb = document.querySelector('[data-done="' + i + '"]'); if (cb) cb.checked = v; save(); };
Object.keys(done).forEach((i) => done[i] && mark(i, true));
document.querySelectorAll('[data-done]').forEach((cb) => cb.addEventListener('change', () => mark(cb.dataset.done, cb.checked)));
document.querySelectorAll('button.copy[data-i]').forEach((b) => b.addEventListener('click', async () => {
  const ok = await copyText(COPIES[+b.dataset.i]);
  toast(ok ? '복사했어요 — 앱에 붙여넣으세요' : '복사 실패 — 글을 길게 눌러 복사하세요');
  if (ok) { b.classList.add('ok'); b.textContent = '다시 복사'; mark(b.dataset.i, true); }
}));
document.getElementById('tagall').addEventListener('click', async () => { toast((await copyText(TAGS.map((t) => '#' + t).join(' '))) ? '태그 전체 복사' : '복사 실패'); });
document.querySelectorAll('.tagbtn').forEach((b) => b.addEventListener('click', async () => { toast((await copyText(b.dataset.tag)) ? '#' + b.dataset.tag + ' 복사' : '복사 실패'); }));
</script>
</body></html>`;
}

function main() {
  const file = process.argv[2];
  if (!file) {
    console.error('사용법: node scripts/mobile_kit.js <초안.json>');
    process.exit(1);
  }
  const draft = loadDraft(file);
  const check = checkDraft(draft);
  const out = draft.__file.replace(/\.json$/, '.kit.html');
  fs.writeFileSync(out, render(draft, check, `kit:${path.basename(out)}`));
  console.log(`모바일 붙여넣기 키트: ${path.relative(process.cwd(), out)}${check.errors.length ? ` (⚠ 점검 오류 ${check.errors.length}건 — 배너 표시)` : ''}`);
}

try {
  main();
} catch (e) {
  console.error(`❌ ${e.message}`);
  process.exit(1);
}
