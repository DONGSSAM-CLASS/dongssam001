// 네이버 스마트에디터 ONE 공통 유틸 — naver_login / naver_draft / probe_selectors 가 함께 쓴다.
// 셀렉터 값은 CLAUDE.md "실측 지식"과 반드시 일치시킬 것. 추측으로 바꾸지 말고 probe_selectors.js로 실측 후 수정.

const path = require('path');
const fs = require('fs');

const ROOT = path.resolve(__dirname, '..', '..');
const PROFILE_DIR = path.join(ROOT, 'naver-profile'); // 로그인 세션(쿠키)만 저장. 비밀번호 저장 금지. 외부 공유 금지.
const DRAFTS_DIR = path.join(ROOT, 'drafts');

const URLS = {
  login: 'https://nid.naver.com/nidlogin.login?mode=form&url=https%3A%2F%2Fblog.naver.com%2FGoBlogWrite.naver',
  write: 'https://blog.naver.com/GoBlogWrite.naver',
};

const VIEWPORT = { width: 1600, height: 1000 }; // 1400 이하에서는 속성 툴바가 잘려 서식 클릭이 불안정

const SEL = {
  mainFrame: 'iframe#mainFrame',
  // 제목/본문 — 본문은 반드시 .se-section-text 로 한정 (제목도 p.se-text-paragraph 구조라 범위를 넓히면 제목 오염)
  title: '.se-title-text',
  titleParagraph: '.se-title-text p.se-text-paragraph',
  bodyParagraph: '.se-section-text p.se-text-paragraph',
  component: '.se-component',
  // 진입 팝업
  draftResumeCancel: '.se-popup-button-cancel', // "작성 중인 글" → 새로 쓰기
  helpPanelClose: '.se-help-panel-close-button',
  // 툴바
  imageButton: 'button.se-image-toolbar-button',
  videoButton: 'button.se-video-toolbar-button',
  mapButton: 'button.se-map-toolbar-button',
  quoteButton: 'button.se-insert-quotation-default-toolbar-button',
  hrButton: 'button.se-insert-horizontal-line-default-toolbar-button',
  textFormatButton: 'button.se-text-format-toolbar-button',
  fontSizeButton: 'button.se-font-size-code-toolbar-button',
  // 컴포넌트
  imageComponent: '.se-component.se-image',
  quoteComponent: '.se-component.se-quotation',
  hrComponent: '.se-component.se-horizontalLine',
  videoComponent: '.se-component.se-video',
  placeComponent: '.se-component.se-placesMap',
  // 동영상 팝업
  videoPopup: '.se-popup-video-upload',
  videoAddButton: 'button.nvu_btn_append.nvu_local',
  videoTitleInput: '.se-popup-video-upload input[placeholder*="제목"]',
  videoCloseButton: 'button.nvu_btn_close',
  // 공통 팝업
  popup: '.se-popup',
  popupClose: '.se-popup-close-button',
  popupDim: '.se-popup-dim',
  // 발행 패널 / 저장
  publishToggle: 'button[class*="publish_btn"]', // 우상단 "발행" — 패널만 연다
  realPublish: 'button[data-testid="seOnePublishBtn"]', // 패널 안 진짜 발행 — 가드로 원천 차단
  tagInput: 'input#tag-input',
  saveButton: 'button[class*="save_btn"]', // save_btn__해시 → 부분 일치
};

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function timestamp() {
  const d = new Date();
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}-${p(d.getHours())}${p(d.getMinutes())}${p(d.getSeconds())}`;
}

async function launchContext({ headless = false } = {}) {
  let chromium;
  try {
    ({ chromium } = require('playwright'));
  } catch (e) {
    throw new Error('playwright 가 설치되지 않았습니다. 먼저 `npm install` 후 `npx playwright install chromium` 을 실행하세요.');
  }
  fs.mkdirSync(PROFILE_DIR, { recursive: true });
  const context = await chromium.launchPersistentContext(PROFILE_DIR, {
    headless,
    viewport: VIEWPORT,
    locale: 'ko-KR',
    args: [`--window-size=${VIEWPORT.width + 40},${VIEWPORT.height + 160}`, '--disable-save-password-bubble'],
  });
  // 모든 프레임에 문서 시작 시점부터 발행 가드를 심는다 (에디터 로드 후 installPublishGuard 로 한 번 더 확인).
  await context.addInitScript(PUBLISH_GUARD_SOURCE);
  return context;
}

// ─── 발행 차단 가드 (절대 규칙 2) ─────────────────────────────────────────────
// 캡처 단계(window, capture=true)에서 진짜 발행 버튼으로 향하는 모든 포인터/클릭 이벤트를 막는다.
// 어떤 경우에도 이 가드를 제거하거나 우회하지 말 것.
const PUBLISH_GUARD_SOURCE = `(() => {
  // 같은 함수 참조로 다시 addEventListener 하면 중복 등록되지 않으므로, 호출될 때마다 항상 (재)등록한다.
  // (document.open 등으로 리스너가 지워져도 installPublishGuard 한 번이면 복구)
  const SEL = 'button[data-testid="seOnePublishBtn"]';
  if (typeof window.__publishBlockedCount !== 'number') window.__publishBlockedCount = 0;
  if (!window.__publishGuardFns) {
    const stop = (e) => {
      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation();
      window.__publishBlockedCount += 1;
      try { console.warn('[publish-guard] 발행 버튼 클릭을 차단했습니다 (' + e.type + ')'); } catch (_) {}
    };
    window.__publishGuardFns = {
      pointer: (e) => { const t = e.target; if (t && t.closest && t.closest(SEL)) stop(e); },
      key: (e) => {
        const a = document.activeElement;
        if ((e.key === 'Enter' || e.key === ' ') && a && a.closest && a.closest(SEL)) stop(e);
      },
    };
  }
  const f = window.__publishGuardFns;
  for (const type of ['pointerdown', 'pointerup', 'mousedown', 'mouseup', 'click', 'dblclick', 'touchstart', 'touchend']) {
    window.addEventListener(type, f.pointer, true);
  }
  window.addEventListener('keydown', f.key, true);
  window.__publishGuardInstalled = true;
})();`;

async function installPublishGuard(target) {
  await target.evaluate(PUBLISH_GUARD_SOURCE);
  const ok = await target.evaluate(() => window.__publishGuardInstalled === true);
  if (!ok) throw new Error('발행 차단 가드 설치 실패 — 안전을 위해 중단합니다.');
  return ok;
}

async function assertPublishGuard(page, editor) {
  const targets = editor === page.mainFrame() ? [page.mainFrame()] : [page.mainFrame(), editor];
  for (const t of targets) {
    const ok = await t.evaluate(() => window.__publishGuardInstalled === true).catch(() => false);
    if (!ok) throw new Error('발행 차단 가드가 확인되지 않아 중단합니다 (절대 규칙 2).');
  }
}

// ─── 에디터 진입 ─────────────────────────────────────────────────────────────
async function openEditor(page, { log = console.log } = {}) {
  await page.goto(URLS.write, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForLoadState('load', { timeout: 30000 }).catch(() => {});
  if (/nid\.naver\.com/.test(page.url())) {
    throw new Error('네이버 로그인이 풀려 있습니다. 채팅에 /setup-login 을 입력해 다시 로그인하세요.');
  }
  const editor = await getEditorFrame(page);
  await editor.waitForSelector(`${SEL.title}, ${SEL.bodyParagraph}`, { timeout: 45000 });
  await installPublishGuard(page.mainFrame());
  if (editor !== page.mainFrame()) await installPublishGuard(editor);
  log('✓ 에디터 로드 + 발행 차단 가드 설치 확인');
  return editor;
}

// 에디터는 iframe#mainFrame 안에 있다. 프레임이 없으면 페이지 자체가 에디터.
async function getEditorFrame(page) {
  const handle = await page.waitForSelector(SEL.mainFrame, { timeout: 15000 }).catch(() => null);
  if (handle) {
    const frame = await handle.contentFrame();
    if (frame) {
      await frame.waitForLoadState('domcontentloaded').catch(() => {});
      return frame;
    }
  }
  return page.mainFrame();
}

async function clickIfVisible(frame, selector, timeout = 3000) {
  const loc = frame.locator(selector).first();
  try {
    await loc.waitFor({ state: 'visible', timeout });
    await loc.click();
    return true;
  } catch (_) {
    return false;
  }
}

async function dismissEntryPopups(editor, log = console.log) {
  if (await clickIfVisible(editor, SEL.draftResumeCancel, 5000)) log('✓ "작성 중인 글" 팝업 → 새로 쓰기');
  if (await clickIfVisible(editor, SEL.helpPanelClose, 2000)) log('✓ 도움말 패널 닫기');
}

module.exports = {
  ROOT,
  PROFILE_DIR,
  DRAFTS_DIR,
  URLS,
  VIEWPORT,
  SEL,
  PUBLISH_GUARD_SOURCE,
  sleep,
  timestamp,
  launchContext,
  installPublishGuard,
  assertPublishGuard,
  openEditor,
  getEditorFrame,
  clickIfVisible,
  dismissEntryPopups,
};
