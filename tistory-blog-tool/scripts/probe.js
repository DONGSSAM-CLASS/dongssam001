#!/usr/bin/env node
// 셀렉터 진단 (읽기 전용) — 글쓰기 화면을 열어 id·버튼·입력란 목록과 스크린샷을 out/probe/ 에 저장한다.
// 절대 저장·발행 버튼을 누르지 않는다. 업로드가 셀렉터 문제로 실패하면 이 결과로 scripts/lib/tistory.js 를 고친다.
//   node scripts/probe.js [--wait 30]   (--wait: 열어 둔 채 N초 대기 — 그동안 직접 레이어를 열어 두면 그 상태도 덤프)
const fs = require('fs');
const path = require('path');
const { loadConfig, isUnset, parseArgs, OUT_DIR } = require('./lib/core');
const { launchProfile } = require('./lib/browser');
const { normBlog } = require('./lib/tistory');

(async () => {
  const { opt } = parseArgs(process.argv.slice(2));
  const config = loadConfig();
  if (isUnset(config.blogUrl)) throw new Error('blogUrl 이 비어 있습니다.');
  const blog = normBlog(config.blogUrl);
  const context = await launchProfile({ headless: false });
  const page = context.pages()[0] || (await context.newPage());
  page.on('dialog', (d) => { console.log(`확인창: ${d.message()} → 취소`); d.dismiss(); });
  await page.goto(`${blog}/manage/newpost/`, { waitUntil: 'domcontentloaded' });
  if (opt.wait) await page.waitForTimeout(Number(opt.wait) * 1000);
  else await page.waitForTimeout(4000);
  const dump = async (frame) =>
    frame.evaluate(() => {
      const pick = (el) => ({ tag: el.tagName.toLowerCase(), id: el.id || undefined, cls: (el.className && String(el.className).slice(0, 80)) || undefined, name: el.getAttribute('name') || undefined, ph: el.getAttribute('placeholder') || undefined, text: (el.innerText || el.value || '').trim().slice(0, 40) || undefined, visible: !!(el.offsetWidth || el.offsetHeight) });
      return {
        ids: Array.from(document.querySelectorAll('[id]')).map(pick),
        buttons: Array.from(document.querySelectorAll('button, [role=button], a.btn, label')).map(pick),
        inputs: Array.from(document.querySelectorAll('input, textarea, select, [contenteditable=true]')).map(pick),
      };
    });
  const result = { url: page.url(), at: new Date().toISOString(), frames: [] };
  for (const f of page.frames()) {
    try { result.frames.push({ name: f.name(), url: f.url(), ...(await dump(f)) }); } catch {}
  }
  const dir = path.join(OUT_DIR, 'probe');
  fs.mkdirSync(dir, { recursive: true });
  const stamp = Date.now();
  fs.writeFileSync(path.join(dir, `probe-${stamp}.json`), JSON.stringify(result, null, 2));
  await page.screenshot({ path: path.join(dir, `probe-${stamp}.png`), fullPage: true });
  console.log(`✅ ${path.join('out/probe', `probe-${stamp}.json`)} (+ .png) — 프레임 ${result.frames.length}개`);
  await context.close();
})().catch((e) => { console.error(`❌ ${e.message}`); process.exit(1); });
