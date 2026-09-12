// 전체 플레이 자동 테스트 — 모든 퍼즐을 실제로 풀어 본다.
import { chromium } from 'playwright';
// 브라우저 실행 파일 경로 — 환경에 맞게 CHROME 환경변수로 바꿀 수 있습니다.
const EXE = process.env.CHROME || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
import { CHAPTERS, FINAL_GATE } from '../js/data/chapters.js';

const TIER = process.argv[2] || 'ms';
const BASE = 'http://localhost:8321/';
const errs = [];
const log = (...a) => console.log(...a);

const browser = await chromium.launch({ executablePath: EXE });
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });

page.on('console', (m) => { if (m.type() === 'error') errs.push('console: ' + m.text()); });
page.on('pageerror', (e) => errs.push('pageerror: ' + e.message));
page.on('requestfailed', (r) => {
  const u = r.url();
  if (!/gstatic|googleapis/.test(u)) errs.push('requestfailed: ' + u + ' ' + r.failure()?.errorText);
});

await page.goto(BASE, { waitUntil: 'networkidle' });
await page.waitForSelector('.title-panel', { timeout: 15000 });
log('· 시작 화면 로드 OK');

// 안내 모달 두 개 열어 보기
for (const label of ['이 게임과 교육과정', '사료와 출처']) {
  await page.getByRole('button', { name: label }).click();
  await page.waitForSelector('.modal', { timeout: 4000 });
  await page.locator('.modal .icon-btn').click();
  await page.waitForSelector('.modal', { state: 'detached', timeout: 4000 });
}
log('· 안내 모달 OK');

// 체험 모드로 시작 → 수준 선택
await page.getByRole('button', { name: /학생으로 시작하기/ }).click();
await page.waitForSelector('.auth');
await page.getByRole('button', { name: /체험 모드로 바로 시작/ }).click();
await page.waitForSelector('.tier-panel');
await page.getByRole('button', { name: TIER === 'hs' ? /고등학생용/ : /중학생용/ }).click();
await page.waitForSelector('.brief', { timeout: 8000 });
log(`· 수준 선택(${TIER}) OK`);

// HUD 확인
const hudVisible = await page.locator('#hud').isVisible();
if (!hudVisible) errs.push('HUD 가 보이지 않음');
log('· 상태창 표시:', hudVisible);

async function clickNext(rx) {
  await page.locator('#stage .btn.primary', { hasText: rx }).first().click();
}

let sourceBoxCount = 0;
let apaCount = 0;

for (const ch of CHAPTERS) {
  await page.waitForSelector('.brief', { timeout: 8000 });
  const title = await page.locator('.brief-title').textContent();
  if (title.trim() !== ch.title) errs.push(`브리핑 제목 불일치: ${title} != ${ch.title}`);
  await clickNext(/들어가기/);

  // 대화 진행
  for (let i = 0; i < ch.beats.length; i++) {
    await page.waitForSelector('.talk', { timeout: 8000 });
    sourceBoxCount += await page.locator('.talk .source').count();
    apaCount += await page.locator('.talk .source-apa').count();
    const last = i === ch.beats.length - 1;
    await clickNext(last ? /자물쇠 풀러 가기/ : /다음/);
  }

  // 퍼즐 풀기
  const list = [...ch.puzzles, ...(TIER === 'hs' && ch.hsExtra ? [ch.hsExtra] : [])];
  for (let pi = 0; pi < list.length; pi++) {
    const p = list[pi];
    await page.waitForSelector('.puzzle', { timeout: 8000 });
    const lockName = await page.locator('.lock-name').textContent();
    if (p.lock && lockName.trim() !== p.lock) errs.push(`자물쇠 이름 불일치: ${lockName} != ${p.lock}`);

    // 일부러 한 번 틀려서 오답 안내가 뜨는지 본다 (첫 문제만)
    if (pi === 0) {
      if (p.kind === 'input') await page.fill('#ans', '0000');
      else if (p.kind === 'choice') {
        const wrong = p.options.findIndex((_, i) => i !== p.answer);
        await page.locator(`input[name="ans"][value="${wrong}"]`).check();
      } else if (p.kind === 'multi') {
        await page.locator('input[name="ans"]').first().check();
        await page.locator('input[name="ans"]').last().check();
      }
      if (p.kind !== 'order') {
        await page.locator('#stage .btn.primary').click();
        await page.waitForTimeout(180);
        const cls = await page.locator('#pmsg').getAttribute('class');
        if (!/no/.test(cls || '')) errs.push(`${p.id}: 오답인데 오답 표시가 안 됨`);
        if (p.kind === 'multi') {
          await page.locator('input[name="ans"]').evaluateAll(
            (els) => els.forEach((e) => { e.checked = false; }));
        }
      }
    }

    // 정답 입력
    if (p.kind === 'input') {
      await page.fill('#ans', p.accept[0]);
    } else if (p.kind === 'choice') {
      await page.locator(`input[name="ans"][value="${p.answer}"]`).check();
    } else if (p.kind === 'multi') {
      for (const a of p.answer) await page.locator(`input[name="ans"][value="${a}"]`).check();
    } else if (p.kind === 'order') {
      // 정답 순서가 될 때까지 ▲ 로 끌어올린다 (선택 정렬)
      for (let pos = 0; pos < p.answer.length; pos++) {
        const want = String(p.answer[pos]);
        for (let guard = 0; guard < 12; guard++) {
          const cur = await page.locator('#orderlist .order-item').evaluateAll(
            (els) => els.map((e) => e.dataset.idx));
          const at = cur.indexOf(want);
          if (at === pos) break;
          await page.locator('#orderlist .order-item').nth(at)
            .locator('button[aria-label="위로"]').click();
        }
      }
    }
    await page.locator('#stage .btn.primary').click();
    await page.waitForSelector('#pmsg.ok', { timeout: 6000 }).catch(() => {
      errs.push(`${p.id}: 정답을 넣었는데 열리지 않음`);
    });
    const last = pi === list.length - 1;
    await page.locator('#pmsg .btn.primary', { hasText: last ? /조각 받기/ : /다음 자물쇠/ }).click();
  }

  // 조각 화면
  await page.waitForSelector('.shard-panel', { timeout: 8000 });
  const glyph = (await page.locator('.shard-big').textContent()).trim();
  if (glyph !== ch.shard.glyph) errs.push(`조각 불일치: ${glyph} != ${ch.shard.glyph}`);
  log(`· ${ch.no}장 「${ch.title}」 완료 → 조각 ${glyph}`);
  await page.locator('.shard-panel .btn.primary').click();
}

// 시간의 문
await page.waitForSelector('.gate', { timeout: 8000 });
const recordCount = await page.locator('.gate-records li').count();
if (recordCount !== CHAPTERS.length) errs.push(`기록판 항목 ${recordCount}개 (기대 ${CHAPTERS.length})`);
await page.fill('#ans', FINAL_GATE.puzzle.accept[0]);
await page.locator('#stage .btn.primary').click();
await page.waitForSelector('.victory', { timeout: 8000 });
log('· 시간의 문 통과');

await page.locator('.victory .btn.primary').click();
await page.waitForSelector('.result', { timeout: 8000 });
const stats = await page.locator('.result-stats .fact-v').allTextContents();
log('· 결과:', stats.join(' | '));
const stdItems = await page.locator('.std-list li').count();
if (stdItems !== 4) errs.push(`성취기준 목록 ${stdItems}개 (기대 4)`);

// 제작자 표기
const maker = await page.locator('.result .maker').textContent();
if (!/동쌤\(김동은 선생님\)/.test(maker)) errs.push('제작자 표기 없음');

log(`· 사료 상자 ${sourceBoxCount}개 · APA 출처 ${apaCount}개 노출`);
if (sourceBoxCount !== apaCount) errs.push('사료 상자와 APA 출처 개수 불일치');

// 좁은 화면(휴대폰)에서 가로 스크롤이 생기지 않는지
await page.setViewportSize({ width: 380, height: 780 });
await page.waitForTimeout(400);
const overflow = await page.evaluate(() =>
  document.documentElement.scrollWidth - document.documentElement.clientWidth);
if (overflow > 2) errs.push(`휴대폰 화면에서 가로 넘침 ${overflow}px`);
log('· 380px 가로 넘침:', overflow + 'px');

await browser.close();

if (errs.length) {
  console.error('\n실패 ' + errs.length + '건:');
  [...new Set(errs)].forEach((e) => console.error('  ✗ ' + e));
  process.exit(1);
}
console.log('\n✓ ' + TIER + ' 전체 플레이 통과');
