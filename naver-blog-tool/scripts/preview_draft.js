#!/usr/bin/env node
// 초안 모바일 미리보기 — 검수(승인 요청) 때 사용자가 브라우저로 열어 보는 HTML 한 장을 만든다.
// 사진은 data URI 로 넣어 파일 하나로 완결된다. 네이버 에디터와 똑같지는 않고, 구성·리듬 확인용이다.
//
// 사용: node scripts/preview_draft.js drafts/<초안>.json   → drafts/<초안>.preview.html

const fs = require('fs');
const path = require('path');
const { loadDraft, resolvePath } = require('./lib/draft');

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const MIME = { '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.gif': 'image/gif' };

function imgSrc(p) {
  const abs = resolvePath(p);
  if (!fs.existsSync(abs)) return null;
  const mime = MIME[path.extname(abs).toLowerCase()] || 'application/octet-stream';
  return `data:${mime};base64,${fs.readFileSync(abs).toString('base64')}`;
}

function render(draft) {
  const lines = (t) => String(t).split('\n').map((l) => `<p>${esc(l) || '&nbsp;'}</p>`).join('');
  const body = draft.blocks
    .map((b) => {
      if (b.type === 'text') return `<div class="text">${lines(b.text)}</div>`;
      if (b.type === 'subtitle') return `<h2>${esc(b.text)}</h2>`;
      if (b.type === 'quote') return `<blockquote>${lines(b.text)}</blockquote>`;
      if (b.type === 'divider') return '<hr>';
      if (b.type === 'image') {
        const src = imgSrc(b.path);
        const img = src ? `<img src="${src}" alt="${esc(b.caption || path.basename(b.path))}">` : `<div class="missing">사진 없음: ${esc(b.path)}</div>`;
        return `<figure>${img}${b.caption ? `<figcaption>${esc(b.caption)}</figcaption>` : ''}</figure>`;
      }
      return '';
    })
    .join('\n');
  const video = draft.video ? `<div class="meta-note">🎬 동영상: 첫 문단 바로 아래에 삽입 — ${esc(draft.video.path)}</div>` : '';
  const place = draft.place ? `<div class="meta-note">📍 지도: 글 맨 끝 — ${esc(draft.place.name)}</div>` : '';
  const srcById = Object.fromEntries((draft.sources || []).map((x) => [x.id, x]));
  const facts = (draft.facts || []).length
    ? `<section class="facts"><h3>사실 검증 현황 (${draft.facts.filter((f) => f.verified === true).length}/${draft.facts.length}) · 기준일 ${esc(draft.basisDate || '-')}</h3><ul>${draft.facts
        .map((f) => {
          const src = srcById[f.source];
          return `<li class="${f.verified === true ? 'ok' : 'todo'}">${f.verified === true ? '✅' : '⏳ 미검증'} ${esc(f.claim)} <small>— ${src ? `<a href="${esc(src.url)}">${esc(src.title || src.id)}</a>` : esc(f.source || '출처 없음')}</small></li>`;
        })
        .join('')}</ul></section>`
    : '';
  const shots = (draft.shotList || []).length
    ? `<section class="facts"><h3>준비할 캡처 (${draft.shotList.length}장)</h3><ol>${draft.shotList.map((x) => `<li>${esc(x)}</li>`).join('')}</ol></section>`
    : '';
  const tags = (draft.tags || []).map((t) => `<span>#${esc(String(t).replace(/^#+/, ''))}</span>`).join('');
  return `<!DOCTYPE html>
<html lang="ko"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>초안 미리보기</title>
<style>
:root { --bg:#f4f5f7; --paper:#fff; --ink:#1f2328; --sub:#6b7280; --line:#e5e7eb; --accent:#03c75a; --quote:#f7f8fa; }
@media (prefers-color-scheme: dark) { :root:not([data-theme="light"]) { --bg:#111317; --paper:#1a1d23; --ink:#e8eaed; --sub:#9aa0a6; --line:#2d3139; --quote:#22262d; } }
:root[data-theme="dark"] { --bg:#111317; --paper:#1a1d23; --ink:#e8eaed; --sub:#9aa0a6; --line:#2d3139; --quote:#22262d; }
* { box-sizing:border-box; }
body { margin:0; background:var(--bg); color:var(--ink); font-family:-apple-system,BlinkMacSystemFont,"Apple SD Gothic Neo","Malgun Gothic",sans-serif; }
.meta { max-width:430px; margin:0 auto; padding:16px 16px 0; font-size:13px; color:var(--sub); line-height:1.6; }
.meta b { color:var(--ink); }
article { max-width:430px; margin:12px auto 40px; background:var(--paper); padding:28px 16px 32px; border-radius:12px; }
h1 { font-size:22px; line-height:1.4; margin:0 0 24px; padding-bottom:18px; border-bottom:1px solid var(--line); }
.text { margin:0 0 22px; } .text p { margin:0; font-size:16px; line-height:1.85; }
h2 { font-size:19px; margin:34px 0 16px; line-height:1.45; }
blockquote { margin:26px 0; padding:18px 16px; background:var(--quote); border-left:4px solid var(--accent); font-size:17px; font-weight:600; }
blockquote p { margin:0; line-height:1.7; }
figure { margin:22px -16px; } figure img { width:100%; display:block; }
figcaption { font-size:13px; color:var(--sub); text-align:center; padding:8px 16px 0; }
hr { border:0; border-top:1px solid var(--line); margin:34px 30%; }
.tags { margin-top:30px; display:flex; flex-wrap:wrap; gap:6px; } .tags span { font-size:13px; color:var(--accent); }
.facts { max-width:430px; margin:12px auto 0; padding:12px 16px; background:var(--paper); border-radius:12px; font-size:13px; line-height:1.6; }
.facts h3 { font-size:14px; margin:0 0 6px; } .facts ul, .facts ol { margin:0; padding-left:18px; } .facts li.todo { color:#b45309; } .facts a { color:var(--accent); }
.meta-note, .missing { font-size:13px; color:var(--sub); border:1px dashed var(--line); padding:8px 10px; border-radius:8px; margin:10px 0; }
</style></head><body>
<div class="meta">
  <div><b>메인 키워드</b> ${esc(draft.mainKeyword || '-')} · <b>서브</b> ${esc((draft.subKeywords || []).join(', ') || '-')}</div>
  <div><b>페르소나</b> ${esc(draft.persona || '-')}</div>
  <div><b>후킹</b> ${esc(draft.hookPattern || '-')} · <b>협찬</b> ${draft.sponsored ? '예' : '아니오'}</div>
</div>
${facts}
${shots}
<article>
<h1>${esc(draft.title)}</h1>
${video}
${body}
${place}
<div class="tags">${tags}</div>
</article>
</body></html>`;
}

function main() {
  const file = process.argv[2];
  if (!file) {
    console.error('사용법: node scripts/preview_draft.js <초안.json>');
    process.exit(1);
  }
  const draft = loadDraft(file);
  const out = draft.__file.replace(/\.json$/, '.preview.html');
  fs.writeFileSync(out, render(draft));
  console.log(`미리보기: ${path.relative(process.cwd(), out)}`);
}

try {
  main();
} catch (e) {
  console.error(`❌ ${e.message}`);
  process.exit(1);
}
