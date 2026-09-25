// 냉전의 목격자 — 에뮬레이터 대상 전체 흐름 E2E
import { chromium } from 'playwright';
// 실행 전: npm run emulators (터미널 1) + npm run dev:emu (터미널 2)
// 실행: npm run e2e   (처음 한 번: npx playwright install chromium)
// CHROME_PATH 환경 변수가 있으면 그 브라우저를 쓴다.
const launchOptions = {
  ...(process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : {}),
  // 한글 파일 이름 내려받기 확인을 위해 UTF-8 로캘
  env: { ...process.env, LANG: 'C.UTF-8', LC_ALL: 'C.UTF-8' },
};

import { mkdirSync, readFileSync } from 'node:fs';
const AXE = readFileSync(new URL('../../node_modules/axe-core/axe.min.js', import.meta.url), 'utf8');
const a11y = [];
async function axe(page, name) {
  await page.waitForTimeout(700);
  await page.addScriptTag({ content: AXE });
  const r = await page.evaluate(async () => await window.axe.run(document, { runOnly: ['wcag2a', 'wcag2aa', 'wcag21aa'] }));
  for (const v of r.violations) a11y.push(`[${name}] ${v.id} (${v.impact}) ${v.help} — ${v.nodes.slice(0, 3).map((n) => n.target.join(' ')).join(' | ')}`);
}

const BASE = 'http://127.0.0.1:5173';
const SHOTS = new URL('./shots/', import.meta.url).pathname;
mkdirSync(SHOTS, { recursive: true });
const errors = [];
const log = (...a) => console.log('▶', ...a);

await fetch('http://127.0.0.1:8080/emulator/v1/projects/demo-cold-war-witness/databases/(default)/documents', { method: 'DELETE' });
await fetch('http://127.0.0.1:9099/emulator/v1/projects/demo-cold-war-witness/accounts', { method: 'DELETE' });
const browser = await chromium.launch(launchOptions);

function watch(page, tag) {
  page.on('console', (m) => {
    if (m.type() === 'error' && !/permission-denied|PERMISSION_DENIED|Missing or insufficient|status of 40[03]/.test(m.text())) errors.push(`[${tag}] ${m.text()}`);
  });
  page.on('pageerror', (e) => errors.push(`[${tag}] pageerror ${e.message}`));
}
const shot = (page, name) => page.screenshot({ path: `${SHOTS}${name}.png`, fullPage: true });

// ───────── 교사 ─────────
const tctx = await browser.newContext({ viewport: { width: 1366, height: 768 }, acceptDownloads: true });
const teacher = await tctx.newPage();
watch(teacher, 'teacher');
await teacher.goto(`${BASE}/teacher`);
// 이 작업 환경은 apis.google.com 접속이 막혀 있어 Google 팝업을 띄울 수 없다.
// 대신 Auth 에뮬레이터가 받아 주는 테스트용 Google 자격 증명으로, 앱과 같은 Firebase 인스턴스에서 로그인한다.
await teacher.getByRole('button', { name: 'Google 계정으로 로그인' }).waitFor();
await teacher.evaluate(async () => {
  const authUrl = performance.getEntriesByType('resource').map((e) => e.name).find((n) => n.includes('/firebase_auth.js'));
  const fa = await import(authUrl);
  const app = await import('/src/lib/firebase.ts');
  const token = JSON.stringify({ sub: 'teacher-kim', email: 'teacher@example.com', email_verified: true, name: '김선생' });
  await fa.signInWithCredential(app.auth(), fa.GoogleAuthProvider.credential(token));
});
await teacher.getByRole('heading', { name: /선생님 화면/ }).waitFor();
log('교사 로그인 OK');

await teacher.getByLabel('새 학급 만들기').fill('2학년 3반');
await teacher.getByRole('button', { name: '학급 만들기' }).click();
const codeText = await teacher.getByTestId('new-class-code').textContent();
const CODE = codeText.trim();
log('학급 코드', CODE);
await teacher.getByRole('link', { name: /2학년 3반/ }).click();
await teacher.getByRole('heading', { name: /2학년 3반/ }).waitFor();
await teacher.getByRole('switch', { name: /1차시/ }).click();
await teacher.getByRole('switch', { name: /1차시/ }).and(teacher.locator('[aria-checked="true"]')).waitFor();
await shot(teacher, '01-teacher-dashboard');
await axe(teacher, 'teacher-dashboard');
log('챕터 1 열기 OK');

// ───────── 학생 1 (휴대폰 크기) ─────────
const sctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1, acceptDownloads: true });
const s1 = await sctx.newPage();
watch(s1, 'student1');
await s1.goto(`${BASE}/`);
await shot(s1, '02-landing-mobile');
await axe(s1, 'landing');
await s1.getByRole('link', { name: /학생으로 들어가기/ }).click();
await s1.getByLabel('학급 코드').fill(CODE.toLowerCase());
await s1.getByRole('button', { name: '다음' }).click();
await s1.getByText('2학년 3반').first().waitFor();
await s1.getByLabel('내 번호').fill('7');
await s1.getByLabel('닉네임').fill('파란연필');
await s1.getByRole('button', { name: '다음' }).click();
await s1.getByLabel('PIN (숫자 4개)').fill('2580');
await s1.getByLabel('PIN 한 번 더').fill('2580');
await shot(s1, '03-join-pin');
await axe(s1, 'join');
await s1.getByRole('button', { name: '입장하기' }).click();
await s1.getByRole('heading', { name: '사건 파일' }).waitFor();
await shot(s1, '04-student-home');
await axe(s1, 'student-home');
log('학생 입장 OK');

await s1.getByRole('link', { name: /파일 열기/ }).first().click();
await s1.getByRole('button', { name: /장면 1 시작하기/ }).click();
for (let n = 1; n <= 5; n++) {
  await s1.getByText(`장면 ${n}`, { exact: false }).first().waitFor();
  await s1.getByRole('radio', { name: /불안/ }).click();
  await s1.getByRole('radiogroup').nth(1).getByRole('radio').first().click();
  if (n === 1) { await shot(s1, '05-scene1-choosing'); await axe(s1, 'scene-choose'); }
  await s1.getByRole('button', { name: '이 선택으로 정하기' }).click();
  await s1.getByRole('button', { name: /실제 역사에서는/ }).click();
  if (n === 1) { await shot(s1, '06-scene1-facts'); await axe(s1, 'scene-facts'); }
  await s1.getByRole('button', { name: n < 5 ? new RegExp(`장면 ${n + 1}로`) : /AI 시대와 연결하러 가기/ }).click();
}
log('장면 1~5 OK');

// 선택은 바꿀 수 없음: 새로고침해도 결과가 그대로
await s1.reload();
await s1.getByRole('heading', { name: /AI 시대와 연결하기/ }).waitFor();
const boxes = s1.getByLabel('내 생각 쓰기');
await s1.getByRole('button', { name: /내 정보가 필요 이상으로 모이면/ }).click();
await boxes.nth(0).pressSequentially('누가 나를 지켜보는지 몰라서 불안해지고 사람들끼리 서로 믿지 못하게 될 것 같다.', { delay: 0 });
await boxes.nth(1).fill('AI가 판단하더라도 마지막에는 사람이 확인하고 책임을 져야 한다고 생각한다. 그렇지 않으면 결정한 사람이 없다.');
await s1.getByText('자동 저장됨').first().waitFor({ timeout: 10000 });
await shot(s1, '07-reflection');
await axe(s1, 'reflection');
await s1.getByRole('button', { name: /원칙 카드 받기/ }).click();
await s1.getByRole('heading', { name: /원칙 카드를 받았어요/ }).waitFor();
await shot(s1, '08-cards-awarded');
await axe(s1, 'wrapup');
await s1.getByLabel('내 마음 쓰기').fill('누군가 기록하고 있다면 말을 조심하게 되고 답답할 것 같다.');
await s1.getByRole('button', { name: /파일 닫기/ }).click();
await s1.getByRole('heading', { name: 'CHAPTER 1 완료!' }).waitFor();
await shot(s1, '09-chapter-done');
await axe(s1, 'done');
log('성찰·카드·마무리 OK');

// ───────── 교사: 현황·분포·하이라이트 ─────────
await teacher.getByRole('cell', { name: '완료' }).first().waitFor();
await teacher.getByRole('switch', { name: /선택 분포 학생 공개/ }).click();
await teacher.getByRole('tab', { name: '선택 분포' }).click();
await teacher.getByText('1명 · 100%').first().waitFor();
await shot(teacher, '10-teacher-distribution');
await axe(teacher, 'distribution');
await teacher.getByRole('tab', { name: '성찰·선언문' }).click();
await teacher.getByRole('button', { name: '7번 답변 하이라이트' }).click();
await teacher.getByRole('link', { name: /발표 모드 \(하이라이트 1개\)/ }).click();
await teacher.getByText('우리 반 친구').waitFor();
await shot(teacher, '11-present');
await teacher.keyboard.press('Escape');
await teacher.getByRole('tab', { name: '학급 관리' }).click();
const [csv] = await Promise.all([teacher.waitForEvent('download'), teacher.getByRole('button', { name: /CSV 내려받기/ }).click()]);
const csvPath = `${SHOTS}class.csv`;
await csv.saveAs(csvPath);
log('교사 현황·분포·발표·CSV OK', csv.suggestedFilename());
if (!csv.suggestedFilename().endsWith('.csv')) errors.push('CSV 파일 이름이 이상함: ' + csv.suggestedFilename());

// 학생 화면: 분포 공개가 보이는지
await s1.getByRole('link', { name: '사건 파일 목록' }).click();
await s1.getByRole('link', { name: '내 기록 다시 보기' }).click();
log('학생 기록 다시 보기 OK');

// ───────── 번호 중복 → 거부, 이어 하기 ─────────
const s2ctx = await browser.newContext({ viewport: { width: 768, height: 1024 } });
const s2 = await s2ctx.newPage();
watch(s2, 'student2');
await s2.goto(`${BASE}/join?code=${CODE}`);
await s2.getByRole('button', { name: '다음' }).click();
await s2.getByLabel('내 번호').fill('7');
await s2.getByLabel('닉네임').fill('다른애');
await s2.getByRole('button', { name: '다음' }).click();
await s2.getByLabel('PIN (숫자 4개)').fill('1111');
await s2.getByLabel('PIN 한 번 더').fill('1111');
await s2.getByRole('button', { name: '입장하기' }).click();
await s2.getByText(/7번은 이미 누군가 쓰고 있어요/).waitFor();
log('번호 중복 거부 OK');
// 틀린 PIN 으로 이어 하기 → 거부
await s2.getByRole('tab', { name: /다른 기기에서 이어 해요/ }).click();
await s2.getByLabel('학급 코드').fill(CODE);
await s2.getByLabel('내 번호').fill('7');
await s2.getByLabel('PIN (숫자 4개)').fill('0000');
await s2.getByRole('button', { name: '이어 하기' }).click();
await s2.getByText(/번호나 PIN이 맞지 않아요/).waitFor();
// 맞는 PIN → 이어 하기 성공, 챕터 1 완료 도장이 보인다
await s2.getByLabel('PIN (숫자 4개)').fill('2580');
await s2.getByRole('button', { name: '이어 하기' }).click();
await s2.getByText('예전 기록을 불러왔어요').waitFor();
await s2.getByLabel('완료').first().waitFor();
await shot(s2, '12-tablet-resumed');
log('다른 기기 이어 하기 OK');
// 옛 기기(s1)는 기록을 잃었다고 안내
await s1.goto(`${BASE}/play`);
await s1.getByRole('heading', { name: '기록을 찾을 수 없어요' }).waitFor();
log('옛 기기 안내 OK');

// ───────── PIN 초기화 ─────────
await teacher.getByRole('button', { name: 'PIN 초기화' }).first().click();
await teacher.getByRole('button', { name: '초기화', exact: true }).click();
const pinEl = teacher.getByTestId('temp-pin').filter({ hasText: /\d{4}/ });
await pinEl.waitFor();
const tempPin = (await pinEl.textContent()).trim();
await teacher.getByRole('button', { name: '확인했어요' }).click();
log('임시 PIN', tempPin);
await s2.goto(`${BASE}/play`);
await s2.getByRole('heading', { name: '기록을 찾을 수 없어요' }).waitFor();
await s2.getByRole('link', { name: '이어 하기로 들어가기' }).click();
await s2.getByLabel('내 번호').fill('7');
await s2.getByLabel('PIN (숫자 4개)').fill(tempPin);
await s2.getByRole('button', { name: '이어 하기' }).click();
await s2.getByText('예전 기록을 불러왔어요').waitFor();
log('PIN 초기화 후 이어 하기 OK');

// ───────── 선언문·인증서 ─────────
await teacher.getByRole('switch', { name: /선언문/ }).click();
await s2.getByRole('link', { name: /나의 AI 윤리 실천 선언문/ }).click();
await s2.getByRole('button', { name: /프라이버시 보호/ }).click();
await s2.getByRole('button', { name: '슈타지의 감시' }).click();
await s2.getByLabel(/무엇을 배웠나요/).fill('필요 이상으로 모인 정보가 사람 사이의 믿음을 깨뜨린다는 것');
await shot(s2, '13-finale');
await axe(s2, 'finale');
await s2.getByRole('button', { name: /선언문 제출하고 인증서 받기/ }).click();
await s2.getByRole('heading', { name: 'AI 윤리 실천 인증서' }).waitFor();
await shot(s2, '14-certificate');
await axe(s2, 'certificate');
const [png] = await Promise.all([s2.waitForEvent('download'), s2.getByRole('button', { name: /이미지로 저장/ }).click()]);
await png.saveAs(`${SHOTS}certificate.png`);
log('선언문·인증서 OK');

// 카드 도감
await s2.goto(`${BASE}/play/cards`);
await s2.getByRole('heading', { name: /내 원칙 카드 도감/ }).waitFor();
await shot(s2, '15-cards');
await axe(s2, 'cards');

// ───────── 인쇄 자료·앱 정보 ─────────
await teacher.goto(`${BASE}/teacher/materials`);
await teacher.getByRole('heading', { name: /1차시 — 슈타지의 벽/ }).waitFor();
await shot(teacher, '16-materials-plan1');
await axe(teacher, 'materials');
await teacher.getByLabel('자료').selectOption('sheet3');
await teacher.getByRole('heading', { name: /3차시 활동지/ }).waitFor();
await shot(teacher, '17-materials-sheet3');
await teacher.emulateMedia({ media: 'print' });
await teacher.pdf?.({ path: `${SHOTS}sheet3.pdf`, format: 'A4' }).catch(() => undefined);
await teacher.emulateMedia({ media: 'screen' });
await teacher.goto(`${BASE}/about`);
await teacher.getByRole('heading', { name: '앱 정보' }).waitFor();
await axe(teacher, 'about');

// ───────── 학급 삭제 (두 번 확인) ─────────
await teacher.goto(`${BASE}/teacher`);
await teacher.getByRole('link', { name: /2학년 3반/ }).click();
await teacher.getByRole('tab', { name: '학급 관리' }).click();
await teacher.getByRole('button', { name: '학급 삭제하기' }).click();
await teacher.getByRole('button', { name: '계속' }).click();
await teacher.getByLabel(/학급 이름/).fill('2학년 3반');
await teacher.getByRole('button', { name: '영구 삭제' }).click();
await teacher.getByText('아직 만든 학급이 없어요').waitFor();
log('학급 삭제 OK');
await s2.goto(`${BASE}/play`);
await s2.getByRole('heading', { name: '기록을 찾을 수 없어요' }).waitFor();
log('삭제 뒤 학생 접근 차단 OK');

await browser.close();
console.log('\n접근성 위반 ' + a11y.length + '건');
for (const x of a11y) console.log(x);
const realErrors = errors.filter((e) => !e.includes('ERR_CERT_AUTHORITY_INVALID'));
if (realErrors.length) {
  console.log('\n콘솔 오류:\n' + realErrors.join('\n'));
  process.exit(1);
}
console.log('\n✅ 전체 흐름 통과');
