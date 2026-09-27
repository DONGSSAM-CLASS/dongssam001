// Playwright 브라우저 실행 공통 — 썸네일(헤드리스)·티스토리 업로드(로그인 세션 유지) 둘 다 여기서.
const path = require('path');
const { chromium } = require('playwright');
const { ROOT, loadConfig } = require('./core');

const PROFILE_DIR = path.join(ROOT, '.auth', 'tistory-profile'); // 로그인 세션 — 절대 커밋·공유 금지

function launchOptions(extra = {}) {
  const b = (loadConfig().browser || {});
  const opt = { ...extra };
  const exe = process.env.CHROMIUM_PATH || b.executablePath;
  if (exe) opt.executablePath = exe;
  else if (b.channel) opt.channel = b.channel; // "chrome" = 설치된 크롬 사용 (카카오 로그인이 자동화 브라우저를 막을 때)
  return opt;
}

async function launchHeadless() {
  return chromium.launch(launchOptions({ headless: true }));
}

async function launchProfile({ headless } = {}) {
  const b = loadConfig().browser || {};
  return chromium.launchPersistentContext(
    PROFILE_DIR,
    launchOptions({
      headless: headless ?? !!b.headless,
      viewport: { width: 1600, height: 1000 },
      locale: 'ko-KR',
      acceptDownloads: false,
    }),
  );
}

module.exports = { launchHeadless, launchProfile, PROFILE_DIR };
