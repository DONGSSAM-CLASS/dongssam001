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
// 관리자 권한(에뮬레이터 owner)으로 6차시가 열린 학급과 모둠 2개를 만든다
const toValue = (v) => {
  if (v === null) return { nullValue: null };
  if (typeof v === 'string') return v === '__now__' ? { timestampValue: now } : { stringValue: v };
  if (typeof v === 'number') return { integerValue: String(v) };
  if (typeof v === 'boolean') return { booleanValue: v };
  if (Array.isArray(v)) return { arrayValue: { values: v.map(toValue) } };
  return { mapValue: { fields: Object.fromEntries(Object.entries(v).map(([k, x]) => [k, toValue(x)])) } };
};
const fields = (o) => Object.fromEntries(Object.entries(o).map(([k, v]) => [k, toValue(v)]));
const put = (path, id, o) => fetch(`${base}/${path}?documentId=${id}`, { method: 'POST', headers: admin, body: JSON.stringify({ fields: fields(o) }) });
await put('classes', 'kb', { name: '키보드반', code: 'KBKBKB', teacherUid: 't', session: 6, groupCount: 2, showDistribution: false, createdAt: '__now__', updatedAt: '__now__' });
await put('classCodes', 'KBKBKB', { classId: 'kb', className: '키보드반', teacherUid: 't', createdAt: '__now__' });
const plan = { title: '', audience: '', aiCase: '', message: '', outline: '', tools: '', aiUse: '', schedule: '', format: null, formatOther: '', factIds: [], principleIds: [], aspectTags: [], valueIds: [] };
for (const no of [1, 2]) {
  await put('classes/kb/groups', `g${no}`, {
    no, name: '', caseId: null, pledge: '', members: {}, plan, planChecks: {}, finalChecks: {}, planStatus: 'draft', teacherComment: '',
    storyboard: {}, stage: 'idea', aiLog: { tools: '', where: '', human: '', label: '' }, sources: '', submission: null, createdAt: '__now__', updatedAt: '__now__',
  });
}

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
await p.getByRole('heading', { name: '6차시 로드맵' }).waitFor(); await overflow('6차시 로드맵');
console.log('✓ 키보드로 입장');
for (const [path, heading] of [['/play/guide', '활동 안내'], ['/play/team', '우리 모둠']]) {
  await p.goto(`http://127.0.0.1:5173${path}`); await p.getByRole('heading', { name: heading }).waitFor(); await overflow(heading);
}
await p.getByRole('button', { name: '이 모둠 고르기' }).first().click();
await p.getByText('우리 모둠', { exact: true }).first().waitFor();
await p.getByRole('radio', { name: /슈타지의 벽/ }).focus();
await p.keyboard.press('ArrowRight');
await p.getByRole('radio', { name: /명단에 오른 이름/, checked: true }).waitFor();
console.log('✓ 사건 파일 고르기: 화살표 키');
await overflow('우리 모둠 (모둠 고른 뒤)');
for (const [path, heading] of [['/play/explore', '사건 파일 탐구'], ['/play/plan', '콘텐츠 기획서'], ['/play/review', '기획서 검토'], ['/play/create', '창작 작업실'], ['/play/gallery', '발표·피드백']]) {
  await p.goto(`http://127.0.0.1:5173${path}`); await p.getByRole('heading', { name: heading }).waitFor(); await overflow(heading);
}
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
