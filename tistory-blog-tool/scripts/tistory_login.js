#!/usr/bin/env node
// 티스토리 로그인 1회 — 뜨는 브라우저 창에서 사용자가 직접 로그인한다 (비밀번호를 저장·입력하지 않음).
// 세션은 .auth/tistory-profile/ 에 남는다 — 절대 커밋·공유 금지.
const { loadConfig, isUnset } = require('./lib/core');
const { launchProfile } = require('./lib/browser');
const { SEL, normBlog } = require('./lib/tistory');

(async () => {
  const config = loadConfig();
  if (isUnset(config.blogUrl)) throw new Error('config/blog.json 의 blogUrl 을 먼저 채우세요 (/setup-blog).');
  const blog = normBlog(config.blogUrl);
  const context = await launchProfile({ headless: false });
  const page = context.pages()[0] || (await context.newPage());
  await page.goto(`${blog}/manage`, { waitUntil: 'domcontentloaded' });
  console.log('브라우저 창에서 카카오 계정으로 직접 로그인하세요. (최대 5분 대기)');
  const until = Date.now() + 5 * 60000;
  let ok = false;
  while (Date.now() < until) {
    try {
      if (new URL(page.url()).origin === blog && (await page.locator(SEL.writeLink).count())) {
        ok = true;
        break;
      }
      if (new URL(page.url()).origin !== blog && /tistory\.com\/?$|\/manage/.test(page.url())) await page.goto(`${blog}/manage`).catch(() => {});
    } catch {}
    await new Promise((r) => setTimeout(r, 2000));
  }
  await context.close();
  console.log(ok ? '✅ 로그인 확인 — 이제 업로드할 수 있어요.' : '❌ 5분 안에 관리 화면을 확인하지 못했습니다. 다시 실행하세요.');
  process.exit(ok ? 0 : 1);
})().catch((e) => {
  console.error(`❌ ${e.message}`);
  process.exit(1);
});
