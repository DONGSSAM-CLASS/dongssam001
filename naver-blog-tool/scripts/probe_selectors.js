#!/usr/bin/env node
// 셀렉터 진단용 DOM 덤프 — 읽기 전용. 스크립트는 아무것도 클릭·입력·저장하지 않는다.
// 셀렉터가 실패하면 추측으로 고치지 말고 이걸로 실제 DOM 을 실측한 뒤 수정한다.
//
// 사용:
//   node scripts/probe_selectors.js                       # 에디터 기본 덤프
//   node scripts/probe_selectors.js --wait 60             # 60초 동안 사용자가 직접 패널/팝업을 열어두면 그 상태를 덤프
//   node scripts/probe_selectors.js --selector ".se-popup" # 특정 셀렉터의 outerHTML 덤프 (여러 번 지정 가능)

const fs = require('fs');
const path = require('path');
const { SEL, DRAFTS_DIR, sleep, timestamp, launchContext, openEditor } = require('./lib/naver');

const args = process.argv.slice(2);
const waitIdx = args.indexOf('--wait');
const waitSec = waitIdx >= 0 ? Number(args[waitIdx + 1]) || 0 : 0;
const extraSelectors = args.reduce((acc, a, i) => (a === '--selector' && args[i + 1] ? acc.concat(args[i + 1]) : acc), []);

async function dumpFrame(frame, extra) {
  return frame.evaluate(
    ({ known, extra }) => {
      const vis = (el) => {
        const r = el.getBoundingClientRect();
        const st = getComputedStyle(el);
        return r.width > 0 && r.height > 0 && st.visibility !== 'hidden' && st.display !== 'none';
      };
      const short = (s, n = 80) => String(s || '').replace(/\s+/g, ' ').trim().slice(0, n);
      const counts = {};
      for (const [k, s] of Object.entries(known)) {
        try {
          const els = [...document.querySelectorAll(s)];
          counts[k] = { selector: s, total: els.length, visible: els.filter(vis).length };
        } catch (e) {
          counts[k] = { selector: s, error: String(e) };
        }
      }
      const buttons = [...document.querySelectorAll('button')].filter(vis).map((b) => ({
        class: short(b.className, 160),
        text: short(b.innerText, 40),
        testid: b.getAttribute('data-testid') || undefined,
        aria: b.getAttribute('aria-label') || undefined,
        name: b.getAttribute('data-name') || undefined,
      }));
      const inputs = [...document.querySelectorAll('input, textarea')].filter(vis).map((i) => ({
        id: i.id || undefined,
        class: short(i.className, 120),
        type: i.type,
        placeholder: i.placeholder || undefined,
      }));
      const components = [...document.querySelectorAll('.se-component')].map((c) => ({ class: short(c.className, 160), text: short(c.innerText, 60) }));
      const popups = [...document.querySelectorAll('[class*="popup"], [class*="layer"], [role="dialog"]')]
        .filter(vis)
        .map((p) => ({ class: short(p.className, 160), text: short(p.innerText, 80) }));
      const extras = {};
      for (const s of extra) {
        try {
          extras[s] = [...document.querySelectorAll(s)].slice(0, 5).map((e) => e.outerHTML.slice(0, 5000));
        } catch (e) {
          extras[s] = String(e);
        }
      }
      return {
        url: location.href,
        publishGuard: window.__publishGuardInstalled === true,
        counts,
        buttons,
        inputs,
        components,
        popups,
        extras,
      };
    },
    { known: SEL, extra },
  );
}

async function main() {
  const context = await launchContext({ headless: false });
  const page = context.pages()[0] || (await context.newPage());
  try {
    const editor = await openEditor(page);
    if (waitSec) {
      console.log(`⏳ ${waitSec}초 대기 — 확인하고 싶은 패널/팝업을 직접 열어두세요 (진짜 "발행"은 가드로 차단됨).`);
      await sleep(waitSec * 1000);
    }
    const out = {
      probedAt: new Date().toISOString(),
      viewport: page.viewportSize(),
      hasMainFrame: editor !== page.mainFrame(),
      editorFrame: await dumpFrame(editor, extraSelectors),
      topFrame: editor !== page.mainFrame() ? await dumpFrame(page.mainFrame(), extraSelectors) : undefined,
    };
    fs.mkdirSync(DRAFTS_DIR, { recursive: true });
    const file = path.join(DRAFTS_DIR, `probe-${timestamp()}.json`);
    fs.writeFileSync(file, JSON.stringify(out, null, 2));
    await page.screenshot({ path: file.replace(/\.json$/, '.png') });

    console.log('\n===== 셀렉터 실측 요약 (에디터 프레임) =====');
    for (const [k, v] of Object.entries(out.editorFrame.counts)) {
      console.log(`${v.total ? '✓' : '✗'} ${k.padEnd(20)} ${v.selector}  (전체 ${v.total ?? '-'} / 보임 ${v.visible ?? '-'})`);
    }
    console.log(`\n버튼 ${out.editorFrame.buttons.length}개 · 입력란 ${out.editorFrame.inputs.length}개 · 컴포넌트 ${out.editorFrame.components.length}개 · 팝업 ${out.editorFrame.popups.length}개`);
    console.log(`전체 덤프: ${path.relative(process.cwd(), file)} (+ 스크린샷 .png)`);
  } finally {
    await context.close();
  }
}

main().catch((e) => {
  console.error(`❌ ${e.message}`);
  process.exit(1);
});
