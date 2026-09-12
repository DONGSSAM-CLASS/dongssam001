import { chromium } from 'playwright';
const BASE = 'http://localhost:8321/';
const EXE = process.env.CHROME || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const errs = [];
const browser = await chromium.launch({ executablePath: EXE });
const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
const page = await ctx.newPage();
page.on('pageerror', (e) => errs.push('pageerror: ' + e.message));
page.on('console', (m) => { if (m.type() === 'error') errs.push('console: ' + m.text()); });

const shot = (n) => page.screenshot({ path: `${process.env.SHOTS}/${n}.png` });

await page.goto(BASE, { waitUntil: 'networkidle' });
await page.waitForSelector('.title-panel');
await shot('01-title');

await page.getByRole('button', { name: /학생으로 시작하기/ }).click();
await page.getByRole('button', { name: /체험 모드로 바로 시작/ }).click();
await page.waitForSelector('.tier-panel');
await shot('02-tier');
await page.getByRole('button', { name: /중학생용/ }).click();
await page.waitForSelector('.brief');
await shot('03-brief');

await page.locator('#stage .btn.primary').click();
await page.waitForSelector('.talk');
await shot('04-talk');

// 단서 수첩
await page.getByRole('button', { name: /단서 수첩/ }).click();
await page.waitForSelector('.notebook, .modal-body');
const clues = await page.locator('.notebook li').count();
console.log('· 단서 수첩 항목:', clues);
await shot('05-notebook');
await page.locator('.modal .icon-btn').click();

// 성취기준 모달
await page.getByRole('button', { name: /이 미션의 성취기준/ }).click();
await page.waitForSelector('.std-box');
const stdCode = await page.locator('.std-code').textContent();
console.log('· 1장 성취기준:', stdCode.trim());
if (stdCode.trim() !== '[9역10-01]') errs.push('1장 성취기준 불일치');
await shot('06-standard');
await page.locator('.modal .icon-btn').click();

// 대화 끝까지 → 퍼즐 화면
for (let i = 0; i < 4; i++) {
  await page.locator('#stage .btn.primary').click();
  await page.waitForTimeout(250);
}
await page.waitForSelector('.puzzle');
await shot('07-puzzle');

// 중학생용: 힌트가 처음부터 열려 있어야 한다
const hintLabel = await page.locator('#stage .btn.ghost').first().textContent();
console.log('· 중학생용 힌트 버튼:', hintLabel.trim());
if (/두 번 틀리면/.test(hintLabel)) errs.push('중학생용인데 힌트가 잠겨 있음');
await page.locator('#stage .btn.ghost').first().click();
await page.waitForSelector('.hint-text');
await shot('08-hint');
await page.locator('.modal .icon-btn').click();

// 정답 → 해설 화면
await page.locator('input[name="ans"][value="1"]').check();
await page.locator('input[name="ans"][value="2"]').check();
await page.locator('#stage .btn.primary').click();
await page.waitForSelector('#pmsg.ok');
await shot('09-solved');

// ── 진행 저장 후 새로 열었을 때 이어지는가 ──────────────────────────────
const before = await page.evaluate(() => JSON.parse(localStorage.getItem('koreaTime.save.v1')));
console.log('· 저장 상태: 장', before.chapterIndex, '· 푼 문제', Object.keys(before.solved).length);

await page.goto(BASE, { waitUntil: 'networkidle' });   // 브라우저를 껐다 켠 셈
await page.waitForSelector('.title-panel');
const hasResume = await page.getByRole('button', { name: /이어서 하기/ }).count();
console.log('· [이어서 하기] 단추 노출:', hasResume === 1);
if (hasResume !== 1) errs.push('저장된 진행이 있는데 [이어서 하기]가 없음');
await page.getByRole('button', { name: /이어서 하기/ }).click();
await page.waitForSelector('.puzzle', { timeout: 6000 });
const lock = await page.locator('.lock-name').textContent();
console.log('· 이어서 시작한 자물쇠:', lock.trim());
if (lock.trim() !== '둘째 자물쇠') errs.push('이어하기 지점이 어긋남: ' + lock);
await shot('10-resume');

// ── 고등학생용 힌트 잠금 ────────────────────────────────────────────────
const p2 = await ctx.newPage();
await p2.goto(BASE, { waitUntil: 'networkidle' });
await p2.evaluate(() => localStorage.clear());
await p2.reload({ waitUntil: 'networkidle' });
await p2.getByRole('button', { name: /학생으로 시작하기/ }).click();
await p2.getByRole('button', { name: /체험 모드로 바로 시작/ }).click();
await p2.getByRole('button', { name: /고등학생용/ }).click();
await p2.waitForSelector('.brief');
await p2.locator('#stage .btn.primary').click();
for (let i = 0; i < 4; i++) { await p2.locator('#stage .btn.primary').click(); await p2.waitForTimeout(200); }
await p2.waitForSelector('.puzzle');
const hs = await p2.locator('#stage .btn.ghost').first().textContent();
console.log('· 고등학생용 힌트 버튼:', hs.trim());
if (!/두 번 틀리면/.test(hs)) errs.push('고등학생용인데 힌트가 처음부터 열려 있음');

// 교사 화면(체험 모드 안내)
await p2.goto(BASE, { waitUntil: 'networkidle' });
await p2.getByRole('button', { name: /선생님으로 들어가기|선생님 방/ }).click();
await p2.waitForSelector('.auth');
await p2.screenshot({ path: `${process.env.SHOTS}/11-teacher-setup.png` });

// 휴대폰 화면
await page.setViewportSize({ width: 390, height: 844 });
await page.goto(BASE, { waitUntil: 'networkidle' });
await page.waitForSelector('.title-panel');
await shot('12-mobile-title');
await page.getByRole('button', { name: /이어서 하기/ }).click();
await page.waitForSelector('.puzzle');
await shot('13-mobile-puzzle');
const ov = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
console.log('· 390px 가로 넘침:', ov + 'px');
if (ov > 2) errs.push('휴대폰 가로 넘침 ' + ov);

await browser.close();
if (errs.length) { console.error('\n실패:'); [...new Set(errs)].forEach(e => console.error('  ✗ ' + e)); process.exit(1); }
console.log('\n✓ UX/저장/난이도 검사 통과');
