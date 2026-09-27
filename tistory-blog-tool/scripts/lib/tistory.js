// 티스토리 에디터 셀렉터 · 공통 동작.
// ⚠️ 셀렉터는 티스토리가 바꿀 수 있다. 실패하면 추측으로 고치지 말고 `npm run probe` 로 실제 DOM 을 떠서 고친 뒤,
//    CLAUDE.md "실측 기록"에 날짜와 함께 남긴다.
// 출처: 2026-09 공개 오픈소스(Jinxxlog/auto_tstory, kgbae99/tistory-blog-auto)가 실측한 값 — 이 저장소에서는 아직 실측 전.

const SEL = {
  writeLink: 'a.link_write[href="/manage/post"]', // 관리 화면 로그인 확인용
  title: '#post-title-inp',
  modeLayerOpen: '#editor-mode-layer-btn-open',
  modeHtml: '#editor-mode-html-text',
  htmlToggleInHtmlMode: '#html-editor-container button', // HTML 모드일 때 모드 버튼 (텍스트 "HTML…")
  codeMirror: '.cm-s-tistory-html.CodeMirror, .CodeMirror',
  codeMirrorLine: '.cm-s-tistory-html .CodeMirror-line, .CodeMirror-line',
  bodyFrame: '#editor-tistory_ifr',
  bodyRoot: '#tinymce',
  representBtn: '.mce-represent-image-btn',
  category: '#category-btn',
  tagInputs: ['#tagText', 'input[placeholder*="태그"]', 'input[name*="tag"]'],
  publishLayer: '#publish-layer-btn', // 우하단 "완료"
  visibility: { private: '#open0', public: '#open20', protected: '#open15' },
  publishBtn: '#publish-btn', // 레이어 안의 최종 버튼: "비공개 저장" / "공개 발행" / (예약 시) 텍스트 실측 필요
  reserveDateBtn: 'button.btn_reserve',
  reserveHour: 'input[name="dateHour"]',
  reserveMinute: 'input[name="dateMinute"]',
  articleBody: '.tt_article_useless_p_margin, .contents_style, #article-view, .entry-content, .article_view',
};

// 에디터가 띄우는 확인창 — 아는 것만 처리하고 나머지는 거절 + 기록
const DIALOG = {
  modeChange: /작성 모드를 변경하시겠습니까/,
  autosave: /저장된 글이 있습니다/,
};

function normBlog(url) {
  const u = new URL(String(url).trim());
  return u.origin;
}

module.exports = { SEL, DIALOG, normBlog };
