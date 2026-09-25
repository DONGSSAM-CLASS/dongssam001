// 냉전의 목격자 — 에뮬레이터 대상 6차시 전체 흐름 E2E (교사 1 · 학생 2 · 모둠 2)
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

const noSaving = (page) => page.waitForFunction(() => !document.body.innerText.includes('저장 중…'), null, { timeout: 15000 });
const blurAll = (page) => page.evaluate(() => document.activeElement instanceof HTMLElement && document.activeElement.blur());
async function setSession(no, re) {
  await teacher.getByRole('radio', { name: re }).click();
  await teacher.getByRole('radio', { name: re, checked: true }).waitFor();
  log(`교사: ${no}차시 열기`);
}
async function joinAs(page, number, nickname, pin) {
  await page.goto(`${BASE}/join?code=${CODE}`);
  await page.getByRole('button', { name: '다음' }).click();
  await page.getByLabel('내 번호').fill(String(number));
  await page.getByLabel('닉네임').fill(nickname);
  await page.getByRole('button', { name: '다음' }).click();
  await page.getByLabel('PIN (숫자 4개)').fill(pin);
  await page.getByLabel('PIN 한 번 더').fill(pin);
  await page.getByRole('button', { name: '입장하기' }).click();
  await page.getByRole('heading', { name: '6차시 로드맵' }).waitFor();
}

// ───────── 교사: 로그인 · 학급 · 모둠 수 (1차시) ─────────
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
const CODE = (await teacher.getByTestId('new-class-code').textContent()).trim();
log('학급 코드', CODE);
await teacher.getByRole('link', { name: /2학년 3반/ }).click();
await teacher.getByRole('heading', { name: /2학년 3반/ }).waitFor();
await teacher.getByRole('radio', { name: /1차시 활동 안내/, checked: true }).waitFor();
await teacher.getByLabel('모둠 수').selectOption('2');
await teacher.getByRole('heading', { name: '1모둠' }).waitFor();
await shot(teacher, '01-teacher-dashboard');
await axe(teacher, 'teacher-dashboard');
log('모둠 2개 만들기 OK');

// ───────── 학생 A (휴대폰, 7번) · 학생 B (태블릿, 8번) 입장 ─────────
const sctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1, acceptDownloads: true });
const s1 = await sctx.newPage();
watch(s1, 'studentA');
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
await s1.getByRole('heading', { name: '6차시 로드맵' }).waitFor();
await shot(s1, '04-student-roadmap');
await axe(s1, 'student-roadmap');
log('학생 A 입장 OK');

const bctx = await browser.newContext({ viewport: { width: 1024, height: 900 } });
const s3 = await bctx.newPage();
watch(s3, 'studentB');
await joinAs(s3, 8, '초록지우개', '1357');
log('학생 B 입장 OK');

// ───────── 1차시: 활동 안내 · 우리 모둠 ─────────
await s1.getByRole('button', { name: '활동 안내' }).click();
await s1.getByRole('heading', { name: '활동 안내' }).waitFor();
await shot(s1, '05-guide');
await axe(s1, 'guide');
await s1.goto(`${BASE}/play/team`);
await s1.getByRole('button', { name: '이 모둠 고르기' }).first().click();
await s1.getByText('우리 모둠', { exact: true }).first().waitFor();
await s1.getByRole('button', { name: /모둠장 \(프로젝트 매니저\)/ }).click();
await s1.getByRole('button', { name: /모둠장 \(프로젝트 매니저\)/, pressed: true }).waitFor();
await s1.getByRole('button', { name: /^역사 탐구원/ }).click();
await s1.getByRole('button', { name: /^역사 탐구원/, pressed: true }).waitFor();
await s1.getByRole('textbox', { name: '모둠 이름' }).fill('파란눈');
await s1.getByRole('button', { name: /다른 친구의 의견을 끝까지 듣고 말하기/ }).click();
await blurAll(s1);
await s1.getByRole('radio', { name: /슈타지의 벽/ }).click();
await s1.getByRole('radio', { name: /슈타지의 벽/, checked: true }).waitFor();
await noSaving(s1);
await shot(s1, '06-team');
await axe(s1, 'team');
log('학생 A: 1모둠 · 역할 · 이름 · 약속 · 사건 파일 OK');

await s3.goto(`${BASE}/play/team`);
await s3.getByRole('button', { name: '이 모둠 고르기' }).nth(1).click();
await s3.getByText('우리 모둠', { exact: true }).first().waitFor();
await s3.getByRole('button', { name: /^콘텐츠 제작자/ }).click();
await s3.getByRole('radio', { name: /13일간의 선택/ }).click();
await s3.getByRole('radio', { name: /13일간의 선택/, checked: true }).waitFor();
log('학생 B: 2모둠 OK');
await teacher.getByText(/빈 역할: AI 윤리 검토관/).first().waitFor();
log('교사: 모둠 현황에 빈 역할 표시 OK');

// ───────── 2차시: 사건 파일 탐구 · 기획서 ─────────
await setSession(2, /2차시 사건 파일 탐구/);
await s1.goto(`${BASE}/play/explore`);
await s1.getByText('우리 모둠 사건 파일').waitFor();
await shot(s1, '07-explore');
await axe(s1, 'explore');
await s1.getByRole('link', { name: /파일 열기/ }).first().click();
await s1.getByRole('button', { name: /장면 1 시작하기/ }).click();
for (let n = 1; n <= 5; n++) {
  await s1.getByText(`장면 ${n}`, { exact: false }).first().waitFor();
  await s1.getByRole('radio', { name: /불안/ }).click();
  await s1.getByRole('radiogroup').nth(1).getByRole('radio').first().click();
  if (n === 1) { await shot(s1, '08-scene1-choosing'); await axe(s1, 'scene-choose'); }
  await s1.getByRole('button', { name: '이 선택으로 정하기' }).click();
  await s1.getByRole('button', { name: /실제 역사에서는/ }).click();
  if (n === 1) { await shot(s1, '09-scene1-facts'); await axe(s1, 'scene-facts'); }
  await s1.getByRole('button', { name: n < 5 ? new RegExp(`장면 ${n + 1}로`) : /AI 시대와 연결하러 가기/ }).click();
}
log('장면 1~5 OK');
await s1.reload();
await s1.getByRole('heading', { name: /AI 시대와 연결하기/ }).waitFor();
const boxes = s1.getByLabel('내 생각 쓰기');
await s1.getByRole('button', { name: /내 정보가 필요 이상으로 모이면/ }).click();
await boxes.nth(0).pressSequentially('누가 나를 지켜보는지 몰라서 불안해지고 사람들끼리 서로 믿지 못하게 될 것 같다.', { delay: 0 });
await boxes.nth(1).fill('AI가 판단하더라도 마지막에는 사람이 확인하고 책임을 져야 한다고 생각한다. 그렇지 않으면 결정한 사람이 없다.');
await s1.getByText('자동 저장됨').first().waitFor({ timeout: 10000 });
await s1.getByRole('button', { name: /원칙 카드 받기/ }).click();
await s1.getByRole('heading', { name: /원칙 카드를 받았어요/ }).waitFor();
await s1.getByLabel('내 마음 쓰기').fill('누군가 기록하고 있다면 말을 조심하게 되고 답답할 것 같다.');
await s1.getByRole('button', { name: /파일 닫기/ }).click();
await s1.getByRole('heading', { name: 'CHAPTER 1 완료!' }).waitFor();
log('사건 파일 체험·성찰·카드 OK');

await s1.getByRole('link', { name: '모둠 기획서 쓰러 가기' }).click();
await s1.getByRole('heading', { name: '콘텐츠 기획서' }).waitFor();
await s1.getByLabel(/^콘텐츠 제목/).fill('누가 내 하루를 적고 있을까?');
await s1.getByLabel(/^누구에게 보여 줄까요/).fill('AI 앱을 매일 쓰는 중학생');
await s1.getByRole('radio', { name: /카드뉴스/ }).click();
await s1.getByRole('group', { name: /근거 사실 카드/ }).getByRole('button').first().click();
await s1.getByLabel(/^오늘날 AI에서 비슷한 문제는/).fill('슈타지가 이웃의 일상을 몰래 기록한 것처럼, 오늘날 AI 앱은 위치와 검색 기록을 모아 분석할 수 있다.');
await s1.getByRole('group', { name: /중심 원칙/ }).getByRole('button', { name: /프라이버시 보호/ }).click();
await s1.getByRole('group', { name: /세부 항목/ }).getByRole('button').first().click();
await s1.getByRole('group', { name: /3대 가치/ }).getByRole('button').first().click();
await s1.getByLabel(/^핵심 메시지/).fill('내 정보의 주인은 나라는 것을 잊지 말자');
await s1.getByLabel(/^구성/).fill('처음: 슈타지 파일 장면 / 가운데: 오늘날 AI 앱이 위치를 모으는 장면 / 끝: 프라이버시 보호 원칙과 실천 방법 세 가지');
await s1.getByLabel(/^만드는 방법과 도구/).fill('발표 슬라이드로 카드 8장');
await s1.getByLabel(/^생성형 AI 활용 계획/).fill('배경 그림 일부만 이미지 생성 AI로 만들고 모둠이 고친다');
await s1.getByLabel(/^역할별 할 일/).fill('4차시 제작자 스토리보드, 역사 탐구원 사실 확인');
await blurAll(s1);
await noSaving(s1);
await s1.getByRole('group', { name: /근거 사실 카드/ }).getByRole('button', { pressed: true }).waitFor();
await shot(s1, '10-plan');
await axe(s1, 'plan');
log('기획서 쓰기 OK');

await s3.goto(`${BASE}/play/plan`);
await s3.getByLabel(/^콘텐츠 제목/).fill('13일의 버튼');
await blurAll(s3);
await noSaving(s3);

// ───────── 3차시: 윤리 점검 · 제출 · 동료 검토 · 교사 승인 ─────────
await setSession(3, /3차시 기획서 완성/);
for (const cb of await s1.getByRole('checkbox').all()) await cb.check();
await s1.getByText('18 / 18').first().waitFor();
await s1.getByRole('button', { name: '기획서 제출하기' }).click();
await s1.getByText('제출했어요 — 선생님이 검토하고 있어요').waitFor();
log('윤리 점검 18문항 · 제출 OK');

await s1.goto(`${BASE}/play/review`);
await s1.getByRole('heading', { name: /검토할 기획서 — 2모둠/ }).waitFor();
await s1.getByLabel('칭찬 한 가지').fill('긴장감 있는 제목이 좋아요');
await s1.getByLabel('제안 한 가지').fill('오늘날 AI 사례를 한 장 더 넣으면 좋겠어요');
await s1.getByLabel(/윤리 점검 의견/).fill('안전성: 겁주는 장면은 줄이면 좋겠어요');
await blurAll(s1);
await noSaving(s1);
await shot(s1, '11-review');
await axe(s1, 'review');
await s3.goto(`${BASE}/play/review`);
await s3.getByText('긴장감 있는 제목이 좋아요').waitFor();
log('동료 검토 주고받기 OK');

await teacher.getByRole('tab', { name: '기획서 검토' }).click();
await teacher.getByRole('heading', { name: /파란눈 — 누가 내 하루를/ }).waitFor();
await teacher.getByLabel(/선생님 의견/).fill('출처를 카드 마지막 장에 꼭 넣어요.');
await teacher.getByRole('button', { name: '승인' }).click();
await teacher.getByText('승인했어요').waitFor();
await shot(teacher, '12-teacher-plan-review');
await axe(teacher, 'teacher-plan-review');
await s1.goto(`${BASE}/play/plan`);
await s1.getByText('선생님이 기획서를 승인했어요').waitFor();
await s1.getByText('출처를 카드 마지막 장에 꼭 넣어요.').first().waitFor();
log('교사 승인 → 학생 화면 OK');

// ───────── 4차시: 창작 작업실 ─────────
await setSession(4, /4차시 창작 ①/);
await s1.goto(`${BASE}/play/create`);
await s1.getByRole('radio', { name: /2\. 스토리보드/ }).click();
await s1.getByLabel('장 1', { exact: true }).fill('1980년대 동베를린, 창밖을 보는 이웃 (가상 장면)');
await s1.getByLabel(/^쓴 AI 도구 이름/).fill('이미지 생성 AI');
await blurAll(s1);
await noSaving(s1);
await s1.getByRole('button', { name: /표기 문구 추천받기/ }).click();
await s1.waitForFunction(() => [...document.querySelectorAll('input')].some((i) => i.value.includes('이미지 생성 AI를 활용해 만들었고')));
await s1.getByLabel(/^쓴 자료의 출처/).fill('사실 카드 출처: BStU 자료, 배경 그림: 모둠이 수정한 AI 생성 이미지');
await blurAll(s1);
await noSaving(s1);
await shot(s1, '13-create');
await axe(s1, 'create');
log('스토리보드 · AI 활용 기록 · 출처 OK');

// ───────── 5차시: 최종 점검 · 제출 ─────────
await setSession(5, /5차시 창작 ②/);
await s1.goto(`${BASE}/play/create#submit`);
await s1.getByRole('heading', { name: /최종 윤리 점검표/ }).waitFor();
for (const cb of await s1.getByRole('checkbox').all()) await cb.check();
await s1.getByLabel('작품 링크').fill('http://example.com/our-work');
await s1.getByText('https:// 로 시작하는 주소를 넣어 주세요.').waitFor();
await s1.getByLabel('작품 링크').fill('https://example.com/our-work');
await s1.getByLabel(/작품 소개/).fill('슈타지의 감시와 오늘날 AI의 위치 기록을 비교한 카드뉴스 8장');
await s1.getByRole('button', { name: '작품 제출하기' }).click();
await s1.getByText('제출했어요! 6차시에 발표해요.').waitFor();
await shot(s1, '14-submitted');
log('최종 점검 · 작품 제출 OK');

// ───────── 6차시: 발표 · 상호 평가 ─────────
await setSession(6, /6차시 발표/);
await s3.goto(`${BASE}/play/gallery`);
await s3.getByRole('heading', { name: /1모둠 · 파란눈 — 누가 내 하루를/ }).waitFor();
for (let i = 0; i < 4; i++) await s3.getByRole('radiogroup').nth(i).getByRole('radio').nth(2).click();
await s3.getByLabel('칭찬 한 가지').fill('오늘날 AI 사례와 잘 이어져서 이해가 쉬웠어요');
await s3.getByRole('button', { name: '평가 저장' }).click();
await s3.getByText('평가를 저장했어요').waitFor();
await shot(s3, '15-gallery');
await axe(s3, 'gallery');
await s1.goto(`${BASE}/play/gallery`);
await s1.getByText('1명이 평가했어요.').waitFor();
await s1.getByText('오늘날 AI 사례와 잘 이어져서 이해가 쉬웠어요').waitFor();
log('상호 평가 주고받기 OK');

await teacher.getByRole('tab', { name: '발표·평가' }).click();
await teacher.getByText('1모둠 · 파란눈 받은 피드백 (1)').waitFor();
await axe(teacher, 'teacher-present-tab');
await teacher.getByRole('link', { name: '모둠 발표 화면' }).click();
await teacher.getByRole('heading', { name: '누가 내 하루를 적고 있을까?' }).waitFor();
await shot(teacher, '16-present-works');
await teacher.keyboard.press('Escape');
await teacher.getByRole('heading', { name: /2학년 3반/ }).waitFor();
log('교사 발표·평가 · 모둠 발표 화면 OK');

// 교사: 개인 현황 · 선택 분포 · 하이라이트 · CSV
await teacher.getByRole('tab', { name: '개인 현황' }).click();
await teacher.getByRole('cell', { name: '완료' }).first().waitFor();
await teacher.getByRole('switch', { name: /선택 분포 학생 공개/ }).click();
await teacher.getByRole('tab', { name: '선택 분포' }).click();
await teacher.getByText('1명 · 100%').first().waitFor();
await axe(teacher, 'distribution');
await teacher.getByRole('tab', { name: '성찰·선언문' }).click();
await teacher.getByRole('button', { name: '7번 답변 하이라이트' }).click();
await teacher.getByRole('link', { name: /발표 모드 \(하이라이트 1개\)/ }).click();
await teacher.getByText('우리 반 친구').waitFor();
await teacher.keyboard.press('Escape');
await teacher.getByRole('tab', { name: '학급 관리' }).click();
for (const [label, file] of [[/학생별 CSV/, 'students.csv'], [/모둠별 CSV/, 'groups.csv']]) {
  const [dl] = await Promise.all([teacher.waitForEvent('download'), teacher.getByRole('button', { name: label }).click()]);
  await dl.saveAs(`${SHOTS}${file}`);
  if (!dl.suggestedFilename().endsWith('.csv')) errors.push('CSV 파일 이름이 이상함: ' + dl.suggestedFilename());
  log('CSV', dl.suggestedFilename());
}
const groupCsv = readFileSync(`${SHOTS}groups.csv`, 'utf8');
if (!groupCsv.includes('누가 내 하루를 적고 있을까?') || !groupCsv.includes('https://example.com/our-work')) errors.push('모둠별 CSV 내용이 빠짐');

// ───────── 번호 중복 → 거부, 이어 하기 ─────────
const s2ctx = await browser.newContext({ viewport: { width: 768, height: 1024 } });
const s2 = await s2ctx.newPage();
watch(s2, 'studentA-tablet');
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
await s2.getByRole('tab', { name: /다른 기기에서 이어 해요/ }).click();
await s2.getByLabel('학급 코드').fill(CODE);
await s2.getByLabel('내 번호').fill('7');
await s2.getByLabel('PIN (숫자 4개)').fill('0000');
await s2.getByRole('button', { name: '이어 하기' }).click();
await s2.getByText(/번호나 PIN이 맞지 않아요/).waitFor();
await s2.getByLabel('PIN (숫자 4개)').fill('2580');
await s2.getByRole('button', { name: '이어 하기' }).click();
await s2.getByText('예전 기록을 불러왔어요').waitFor();
await s2.getByText('1모둠 · 파란눈').first().waitFor();
await shot(s2, '17-tablet-resumed');
log('다른 기기 이어 하기 (모둠 유지) OK');
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

// ───────── 선언문 · 인증서 ─────────
await s2.goto(`${BASE}/play/finale`);
await s2.getByText('우리 모둠 작품').waitFor();
await s2.getByRole('button', { name: /프라이버시 보호/ }).first().click();
await s2.getByRole('button', { name: '슈타지의 감시' }).click();
await s2.getByLabel(/무엇을 배웠나요/).fill('필요 이상으로 모인 정보가 사람 사이의 믿음을 깨뜨린다는 것');
await shot(s2, '18-finale');
await axe(s2, 'finale');
await s2.getByRole('button', { name: /선언문 제출하고 인증서 받기/ }).click();
await s2.getByRole('heading', { name: 'AI 윤리 실천 인증서' }).waitFor();
await s2.getByText(/내 역할: 모둠장, 역사 탐구원/).waitFor();
await shot(s2, '19-certificate');
await axe(s2, 'certificate');
const [png] = await Promise.all([s2.waitForEvent('download'), s2.getByRole('button', { name: /이미지로 저장/ }).click()]);
await png.saveAs(`${SHOTS}certificate.png`);
log('선언문·인증서 OK');

await s2.goto(`${BASE}/play/cards`);
await s2.getByRole('heading', { name: /AI 윤리원칙 카드 도감/ }).waitFor();
await shot(s2, '20-cards');
await axe(s2, 'cards');

// ───────── 인쇄 자료 · 앱 정보 ─────────
await teacher.goto(`${BASE}/teacher/materials`);
await teacher.getByRole('heading', { name: /1차시 — 활동 안내/ }).waitFor();
await shot(teacher, '21-materials-plan1');
await axe(teacher, 'materials');
for (const [key, re, name] of [
  ['sheet3', /3차시 · 기획서와 동료 검토/, '22-materials-sheet3'],
  ['sheet6', /6차시 · 발표 평가와 실천 선언/, '23-materials-sheet6'],
  ['curriculum', /교육과정·AI 윤리원칙 연계표/, '24-materials-curriculum'],
]) {
  await teacher.getByLabel('자료').selectOption(key);
  await teacher.getByRole('heading', { name: re }).waitFor();
  await shot(teacher, name);
}
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
// 모둠·검토 문서도 지워졌는지 (에뮬레이터 관리자 조회)
const left = await (await fetch('http://127.0.0.1:8080/v1/projects/demo-cold-war-witness/databases/(default)/documents:runQuery', {
  method: 'POST',
  headers: { Authorization: 'Bearer owner', 'Content-Type': 'application/json' },
  body: JSON.stringify({ structuredQuery: { from: [{ collectionId: 'groups', allDescendants: true }, ] } }),
})).json();
const left2 = await (await fetch('http://127.0.0.1:8080/v1/projects/demo-cold-war-witness/databases/(default)/documents:runQuery', {
  method: 'POST',
  headers: { Authorization: 'Bearer owner', 'Content-Type': 'application/json' },
  body: JSON.stringify({ structuredQuery: { from: [{ collectionId: 'reviews', allDescendants: true }] } }),
})).json();
const remain = [...left, ...left2].filter((r) => r.document).length;
if (remain) errors.push(`학급 삭제 뒤 남은 모둠·검토 문서 ${remain}개`);
else log('모둠·검토 문서 파기 OK');

await browser.close();
console.log('\n접근성 위반 ' + a11y.length + '건');
for (const x of a11y) console.log(x);
const realErrors = errors.filter((e) => !e.includes('ERR_CERT_AUTHORITY_INVALID'));
if (realErrors.length) {
  console.log('\n콘솔 오류:\n' + realErrors.join('\n'));
  process.exit(1);
}
console.log('\n✅ 6차시 전체 흐름 통과');
