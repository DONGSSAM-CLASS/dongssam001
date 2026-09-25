#!/usr/bin/env node
// 네이버 로그인 1회 — 사용자가 브라우저 창에서 직접 로그인한다 (아이디·비밀번호·패스키 모두 사용자가 입력).
// 이 스크립트는 비밀번호를 읽거나 저장하지 않는다. 로그인 세션(쿠키)만 naver-profile/ 에 남는다.
// naver-profile/ 은 로그인 세션 그 자체이므로 절대 외부 공유·커밋 금지.
//
// 사용: node scripts/naver_login.js

const { URLS, PROFILE_DIR, sleep, launchContext, getEditorFrame, SEL } = require('./lib/naver');

const TIMEOUT_MIN = 10;

async function isLoggedIn(context) {
  const cookies = await context.cookies('https://www.naver.com');
  const names = new Set(cookies.map((c) => c.name));
  return names.has('NID_AUT') && names.has('NID_SES');
}

async function main() {
  const context = await launchContext({ headless: false });
  const page = context.pages()[0] || (await context.newPage());
  try {
    if (await isLoggedIn(context)) {
      console.log('이미 로그인 세션이 있습니다. 글쓰기 화면으로 확인합니다…');
    } else {
      await page.goto(URLS.login, { waitUntil: 'domcontentloaded' });
      console.log('\n👉 열린 브라우저 창에서 네이버에 직접 로그인하세요 (패스키·2단계 인증 가능).');
      console.log('   "로그인 상태 유지"를 켜면 세션이 오래 갑니다. 브라우저의 비밀번호 저장 제안은 "저장 안 함"을 누르세요.');
      console.log(`   최대 ${TIMEOUT_MIN}분 동안 기다립니다…\n`);
      const deadline = Date.now() + TIMEOUT_MIN * 60 * 1000;
      while (!(await isLoggedIn(context))) {
        if (Date.now() > deadline) throw new Error(`${TIMEOUT_MIN}분 안에 로그인이 확인되지 않았습니다. 다시 실행해 주세요.`);
        await sleep(2000);
      }
      console.log('✓ 로그인 쿠키 확인');
    }

    await page.goto(URLS.write, { waitUntil: 'domcontentloaded', timeout: 60000 });
    if (/nid\.naver\.com/.test(page.url())) throw new Error('글쓰기 화면이 로그인 페이지로 돌아갑니다 — 다시 로그인해 주세요.');
    const editor = await getEditorFrame(page);
    await editor.waitForSelector(`${SEL.title}, ${SEL.bodyParagraph}`, { timeout: 45000 });
    console.log('✅ 로그인 완료 — 글쓰기 에디터 진입 확인. 세션 저장 위치:', PROFILE_DIR);
    console.log('   (이 창은 자동으로 닫힙니다. 아무것도 입력하거나 저장하지 않았습니다.)');
    await sleep(1500);
  } finally {
    await context.close();
  }
}

main().catch((e) => {
  console.error(`❌ ${e.message}`);
  process.exit(1);
});
