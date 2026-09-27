#!/usr/bin/env node
// 글 → 티스토리용 HTML + 모바일 미리보기 + 대표 썸네일 + 하루치 검수 대시보드.
// 사용: node scripts/build.js [날짜|글.md ...] [--no-thumb]
// 산출물(out/<날짜>/): NN-slug.tistory.html · NN-slug.preview.html · NN-slug.thumb.png · index.html(대시보드)

const fs = require('fs');
const path = require('path');
const { loadConfig, loadPost, loadAllPosts, loadExisting, parseArgs, resolveTargets, outPathsFor, isUnset } = require('./lib/core');
const { renderPost, dataUri, esc } = require('./lib/render');
const { checkPost, checkBatch, linkIndexFrom } = require('./lib/checks');

const PALETTE = ['#1f4e79', '#2e6b4f', '#7a3e1d', '#4b3b7a', '#1d5f6b', '#6b2440', '#3d4a5c'];
const pickColor = (s) => PALETTE[[...String(s || '')].reduce((a, c) => a + c.charCodeAt(0), 0) % PALETTE.length];

function thumbHtml(post, config) {
  const m = post.meta;
  const color = pickColor(m.category);
  // 제목을 쉼표·물음표 기준으로 두 줄로
  const t = String(m.title || '');
  const cut = t.search(/[,?]\s/);
  const [l1, l2] = cut > 0 ? [t.slice(0, cut + 1), t.slice(cut + 2)] : [t, ''];
  const blog = !isUnset(config.blogName) ? config.blogName : '';
  return `<!doctype html><html><head><meta charset="utf-8"><style>
  *{margin:0;box-sizing:border-box}
  body{width:1200px;height:675px;font-family:'Pretendard','Malgun Gothic','Apple SD Gothic Neo','Noto Sans KR','WenQuanYi Zen Hei',sans-serif;
    background:${color};color:#fff;display:flex;flex-direction:column;justify-content:center;padding:70px 90px;position:relative;overflow:hidden}
  .cat{display:inline-block;align-self:flex-start;border:2px solid rgba(255,255,255,.7);border-radius:40px;padding:8px 22px;font-size:28px;margin-bottom:34px}
  h1{font-size:${t.length > 30 ? 64 : 74}px;line-height:1.22;font-weight:800;letter-spacing:-1px;word-break:keep-all}
  h2{font-size:40px;line-height:1.35;font-weight:500;margin-top:22px;opacity:.92;word-break:keep-all}
  .foot{position:absolute;left:90px;bottom:48px;font-size:26px;opacity:.75}
  .deco{position:absolute;right:-120px;top:-120px;width:420px;height:420px;border-radius:50%;background:rgba(255,255,255,.08)}
  </style></head><body><div class="deco"></div><span class="cat">${esc(m.category || '')}</span><h1>${esc(l1)}</h1>${l2 ? `<h2>${esc(l2)}</h2>` : ''}<div class="foot">${esc([blog, m.basisDate ? `${m.basisDate} 기준` : ''].filter(Boolean).join(' · '))}</div></body></html>`;
}

function previewHtml(post, r, check, thumbSrc) {
  const m = post.meta;
  const list = (arr, icon) => arr.map((x) => `<li>${icon} ${esc(x)}</li>`).join('');
  const s = check.stats;
  const facts = (m.facts || []).map((f) => `<li>${f.verified === true ? '✅' : '⛔'} ${esc(f.claim)} <small>(${esc(f.source)})</small></li>`).join('');
  return `<!doctype html><html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(m.title)} — 미리보기</title><style>
:root{--bg:#f6f6f4;--card:#fff;--ink:#222;--mute:#777;--line:#e5e5e0;--bad:#b3261e;--warn:#8a5a00;--ok:#1e6b3a}
@media (prefers-color-scheme:dark){:root{--bg:#18181a;--card:#222226;--ink:#e8e8e8;--mute:#a0a0a0;--line:#333;--bad:#ff8a80;--warn:#ffcc66;--ok:#7fd49b}}
body{margin:0;background:var(--bg);color:var(--ink);font-family:'Pretendard','Malgun Gothic','Apple SD Gothic Neo',sans-serif}
.wrap{max-width:720px;margin:0 auto;padding:16px}
.panel,.post{background:var(--card);border:1px solid var(--line);border-radius:12px;padding:18px 20px;margin-bottom:16px}
.panel h3{margin:0 0 8px;font-size:15px}.panel ul{margin:6px 0;padding-left:4px;list-style:none;font-size:14px;line-height:1.6}
.bad{color:var(--bad)}.warn{color:var(--warn)}.ok{color:var(--ok)}.mute{color:var(--mute);font-size:13px}
.post h1{font-size:26px;line-height:1.35;word-break:keep-all}.post{font-size:16px;line-height:1.8;word-break:keep-all}
.post h2{font-size:22px;margin-top:40px;padding-bottom:6px;border-bottom:2px solid var(--line)}.post h3{font-size:18px;margin-top:28px}
.post blockquote{margin:20px 0;padding:12px 16px;border-left:4px solid #999;background:rgba(127,127,127,.08);border-radius:6px}
.post blockquote[data-ke-style=style3]{border:1px solid var(--line);border-left-width:1px}
.post table{border-collapse:collapse;width:100%;font-size:14px}.post th,.post td{border:1px solid var(--line);padding:6px 8px}
.post code{background:rgba(127,127,127,.15);padding:1px 5px;border-radius:4px;font-size:14px}
.post img{max-width:100%}.tags span{display:inline-block;margin:3px;padding:2px 10px;border-radius:12px;background:rgba(127,127,127,.15);font-size:13px}
</style></head><body><div class="wrap">
<div class="panel"><h3>검수 정보 — ${esc(post.rel)}</h3>
<div class="mute">상태 ${esc(m.status || 'draft')} · 검수 점수 ${m.review && m.review.score != null ? esc(m.review.score) : '미검수'} · 게이트 점수 ${s.gateScore} · 승인 ${m.approved === true ? '예' : '아니오'}</div>
<ul><li>키워드: <b>${esc(m.mainKeyword)}</b> ${s.keyword ? `(${s.keyword.count}회, ${s.keyword.density}%)` : ''} · 형식 ${esc(m.format)} · 카테고리 ${esc(m.category)}</li>
<li>페르소나: ${esc(m.persona)}</li><li>정보 이득: ${esc(m.infoGain)}</li>
<li>본문 ${s.chars}자 · 소제목 ${s.h2} · 사진 ${s.images} · 표 ${s.tables} · 최대 유사도 ${s.maxSimilarity ? s.maxSimilarity.score : '-'}</li></ul>
${check.errors.length ? `<ul class="bad">${list(check.errors, '❌')}</ul>` : '<div class="ok">❌ 오류 없음</div>'}
${check.warnings.length ? `<ul class="warn">${list(check.warnings, '⚠️')}</ul>` : ''}
${facts ? `<h3>사실 검증</h3><ul>${facts}</ul>` : ''}
${m.review && m.review.notes ? `<h3>검수 메모</h3><div class="mute">${esc(m.review.notes)}</div>` : ''}
</div>
<article class="post">${thumbSrc ? `<img src="${thumbSrc}" alt="${esc(m.title)}" style="border-radius:8px">` : ''}<h1>${esc(m.title)}</h1>${r.html}
<div class="tags">${(m.tags || []).map((t) => `<span>#${esc(String(t).replace(/^#+/, ''))}</span>`).join('')}</div></article>
</div></body></html>`;
}

function dashboardHtml(date, rows, batch) {
  const tr = rows
    .map(
      (x) => `<tr><td>${esc(x.n)}</td><td><a href="${esc(x.previewName)}">${esc(x.title)}</a><div class="mute">${esc(x.keyword)} · ${esc(x.format)} · ${esc(x.category)}</div></td>
<td>${esc(x.status)}</td><td>${x.review ?? '—'}</td><td class="${x.errors ? 'bad' : 'ok'}">${x.errors}</td><td class="${x.warnings ? 'warn' : ''}">${x.warnings}</td><td>${x.chars}</td><td>${x.approved ? '✅' : ''}</td></tr>`,
    )
    .join('');
  return `<!doctype html><html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${date} 글 검수</title><style>
:root{--bg:#f6f6f4;--card:#fff;--ink:#222;--mute:#777;--line:#e5e5e0;--bad:#b3261e;--warn:#8a5a00;--ok:#1e6b3a}
@media (prefers-color-scheme:dark){:root{--bg:#18181a;--card:#222226;--ink:#e8e8e8;--mute:#a0a0a0;--line:#333;--bad:#ff8a80;--warn:#ffcc66;--ok:#7fd49b}}
body{margin:0;background:var(--bg);color:var(--ink);font-family:'Pretendard','Malgun Gothic',sans-serif}.wrap{max-width:960px;margin:0 auto;padding:16px}
table{width:100%;border-collapse:collapse;background:var(--card);font-size:14px}th,td{border-bottom:1px solid var(--line);padding:8px;text-align:left;vertical-align:top}
a{color:inherit}.mute{color:var(--mute);font-size:12px}.bad{color:var(--bad)}.warn{color:var(--warn)}.ok{color:var(--ok)}
.box{background:var(--card);border:1px solid var(--line);border-radius:10px;padding:12px 16px;margin:12px 0;font-size:14px}.scroll{overflow-x:auto}
</style></head><body><div class="wrap"><h2>${date} 오늘의 글 ${rows.length}/${batch.quota}</h2>
<div class="box">묶음 점검: ${batch.errors.length ? batch.errors.map((e) => `<div class="bad">❌ ${esc(e)}</div>`).join('') : '<span class="ok">오류 없음</span>'}${batch.warnings.map((w) => `<div class="warn">⚠️ ${esc(w)}</div>`).join('')}</div>
<div class="scroll"><table><thead><tr><th>#</th><th>제목</th><th>상태</th><th>검수</th><th>오류</th><th>경고</th><th>글자</th><th>승인</th></tr></thead><tbody>${tr}</tbody></table></div>
<div class="box">다음 단계: 각 제목을 눌러 미리보기 확인 → Claude Code 에 <b>/upload ${date} 1,2,3</b> (승인할 번호) — 기본은 <b>비공개 저장</b>, 예약 발행은 <b>--schedule</b>.</div>
</div></body></html>`;
}

async function renderThumb(browser, html, file) {
  const page = await browser.newPage({ viewport: { width: 1200, height: 675 } });
  await page.setContent(html, { waitUntil: 'load' });
  await page.screenshot({ path: file });
  await page.close();
}

async function main() {
  const { pos, opt } = parseArgs(process.argv.slice(2));
  const config = loadConfig();
  const allPosts = loadAllPosts();
  const existing = loadExisting();
  const linkIndex = linkIndexFrom(allPosts, existing);
  const files = resolveTargets(pos);
  if (!files.length) throw new Error('빌드할 글이 없습니다.');

  let browser = null;
  if (!opt['no-thumb']) {
    try {
      browser = await require('./lib/browser').launchHeadless();
    } catch (e) {
      console.warn(`⚠️ 썸네일용 브라우저 실행 실패 — 썸네일 없이 진행 (npx playwright install chromium 필요): ${e.message.split('\n')[0]}`);
    }
  }
  const byDate = new Map();
  for (const f of files) {
    const post = loadPost(f);
    const out = outPathsFor(post);
    fs.mkdirSync(out.dir, { recursive: true });
    const check = checkPost(post, { config, allPosts, existing });
    const r = renderPost(post, { mode: 'tistory', config, linkIndex });
    fs.writeFileSync(out.html, r.html);
    let thumbSrc = '';
    if (browser && post.meta.cover !== 'none') {
      await renderThumb(browser, thumbHtml(post, config), out.thumb);
      thumbSrc = dataUri(out.thumb);
    }
    const rp = renderPost(post, { mode: 'preview', config, linkIndex, imageSrc: dataUri });
    fs.writeFileSync(out.preview, previewHtml(post, rp, check, thumbSrc));
    console.log(`✅ ${post.rel} → ${path.relative(process.cwd(), out.preview)}  (❌${check.errors.length} ⚠️${check.warnings.length})`);
    const date = path.basename(out.dir);
    if (!byDate.has(date)) byDate.set(date, { dir: out.dir, rows: [] });
    byDate.get(date).rows.push({
      n: path.basename(post.file).split('-')[0],
      title: post.meta.title,
      keyword: post.meta.mainKeyword,
      format: post.meta.format,
      category: post.meta.category,
      status: post.meta.status || 'draft',
      review: post.meta.review && post.meta.review.score,
      approved: post.meta.approved === true,
      errors: check.errors.length,
      warnings: check.warnings.length,
      chars: check.stats.chars,
      previewName: path.basename(out.preview),
    });
  }
  if (browser) await browser.close();
  for (const [date, { dir, rows }] of byDate) {
    const batch = checkBatch(loadAllPosts({ date }), config);
    const file = path.join(dir, 'index.html');
    fs.writeFileSync(file, dashboardHtml(date, rows, batch));
    console.log(`📋 대시보드: ${path.relative(process.cwd(), file)}`);
  }
}

main().catch((e) => {
  console.error(`❌ ${e.stack || e.message}`);
  process.exit(1);
});
