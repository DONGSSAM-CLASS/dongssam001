// 냉전의 목격자 — 키보드만으로 진행 + 360px 가로 넘침 점검
import { chromium } from 'playwright';
// 실행 전: npm run emulators (터미널 1) + npm run dev:emu (터미널 2)
// 실행: npm run e2e   (처음 한 번: npx playwright install chromium)
// CHROME_PATH 환경 변수가 있으면 그 브라우저를 쓴다.
const launchOptions = {
  ...(process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : {}),
  // 한글 파일 이름 내려받기 확인을 위해 UTF-8 로캘
  env: { ...process.env, LANG: 'C.UTF-8', LC_ALL: 'C.UTF-8' },
};

await fetch('http://127.0.0.1:8080/emulator/v1/projects/demo-cold-war-witness/databases/(default)/documents', { method: 'DELETE' });
const admin = { Authorization: 'Bearer owner', 'Content-Type': 'application/json' };
const base = 'http://127.0.0.1:8080/v1/projects/demo-cold-war-witness/databases/(default)/documents';
const now = new Date().toISOString();
const unl = (v) => ({ mapValue: { fields: { ch1: { booleanValue: v }, ch2: { booleanValue: v }, ch3: { booleanValue: v }, finale: { booleanValue: v } } } });
await fetch(`${base}/classes?documentId=kb`, { method: 'POST', headers: admin, body: JSON.stringify({ fields: { name: { stringValue: '키보드반' }, code: { stringValue: 'KBKBKB' }, teacherUid: { stringValue: 't' }, unlocked: unl(true), showDistribution: { booleanValue: false }, createdAt: { timestampValue: now }, updatedAt: { timestampValue: now } } }) });
await fetch(`${base}/classCodes?documentId=KBKBKB`, { method: 'POST', headers: admin, body: JSON.stringify({ fields: { classId: { stringValue: 'kb' }, className: { stringValue: '키보드반' }, teacherUid: { stringValue: 't' }, createdAt: { timestampValue: now } } }) });

const b = await chromium.launch(launchOptions);
const p = await b.newPage({ viewport: { width: 360, height: 740 } });
const overflow = async (name) => {
  const o = await p.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  console.log(`${o > 0 ? '✗' : '✓'} 가로 넘침 ${o}px — ${name}`);
};
await p.goto('http://127.0.0.1:5173/'); await overflow('첫 화면');
await p.goto('http://127.0.0.1:5173/about'); await overflow('앱 정보');
await p.goto('http://127.0.0.1:5173/join?code=KBKBKB'); await overflow('입장');

// 키보드만으로 입장
const tab = async (n = 1) => { for (let i = 0; i < n; i++) await p.keyboard.press('Tab'); };
await p.getByLabel('학급 코드').focus();
await p.keyboard.press('Enter');
await p.getByLabel('내 번호').waitFor();
await p.keyboard.type('4');
await tab(); await p.keyboard.type('키보드');
await p.keyboard.press('Enter');
await p.getByLabel('PIN (숫자 4개)').waitFor();
await p.keyboard.type('2468'); await tab(); await p.keyboard.type('2468'); await p.keyboard.press('Enter');
await p.getByRole('heading', { name: '사건 파일' }).waitFor(); await overflow('사건 파일');
console.log('✓ 키보드로 입장');
await p.goto('http://127.0.0.1:5173/play/chapter/ch2');
await p.getByRole('button', { name: /장면 1 시작하기/ }).focus();
await p.keyboard.press('Enter');
await p.getByText('라디오에서 들려온 뉴스').waitFor(); await overflow('장면');
// 제목에 초점이 옮겨졌는지
const focused = await p.evaluate(() => document.activeElement?.textContent);
console.log(focused?.includes('명단에 오른 이름') ? '✓ 장면이 바뀌면 제목으로 초점 이동' : '✗ 초점: ' + focused);
// Tab 으로 감정 → 선택지 → 정하기
// 제목에서 Tab → 감정 묶음(첫 항목) → → 키 3번 = 망설임 → Tab → 선택지 묶음 → ↓ 2번 = 두 번째 선택지 → Tab → 정하기
await tab();
const f1 = await p.evaluate(() => document.activeElement?.textContent);
console.log(f1?.includes('불안') ? '✓ Tab 한 번에 감정 묶음으로' : '✗ 초점: ' + f1);
for (let i = 0; i < 3; i++) await p.keyboard.press('ArrowRight');
await tab();
await p.keyboard.press('ArrowDown'); await p.keyboard.press('ArrowDown');
await tab();
const f2 = await p.evaluate(() => document.activeElement?.textContent);
console.log(f2?.includes('이 선택으로 정하기') ? '✓ 선택지 묶음 다음 Tab 은 정하기 단추' : '✗ 초점: ' + f2);
await p.keyboard.press('Enter');
await p.getByText('이 선택이 가져올 수 있는 결과').waitFor();
const saved = await p.getByText(/내가 고른 마음:/).textContent();
console.log(saved.includes('망설임') && saved.includes('억울하게 지목될까') ? '✓ 키보드로 감정·선택·저장 (망설임 / 세 번째 선택지)' : '✗ ' + saved);
await p.getByRole('button', { name: /실제 역사에서는/ }).focus(); await p.keyboard.press('Enter');
await p.getByText('휠링 연설').waitFor(); await overflow('사실 카드');
await p.goto('http://127.0.0.1:5173/play/cards'); await p.getByRole('heading', { name: /도감/ }).waitFor(); await overflow('카드 도감');
await p.goto('http://127.0.0.1:5173/play/finale'); await p.getByRole('heading', { name: /선언문/ }).first().waitFor(); await overflow('선언문');
await p.screenshot({ path: new URL('./shots/18-finale-360.png', import.meta.url).pathname, fullPage: false });
await b.close();
