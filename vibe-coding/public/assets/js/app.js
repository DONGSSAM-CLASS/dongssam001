/* =============================================================================
 * 바로 써먹는 바이브코딩 첫 걸음 [기초편]
 * - 서버 없음 / 수집 없음. 모든 상태는 localStorage에만 저장합니다.
 * ========================================================================== */
(function () {
  'use strict';

  var LS = {
    tool: 'vc.tool',
    template: 'vc.template',
    steps: 'vc.steps',
    finish: 'vc.finish',
    builder: 'vc.builder'
  };
  var TOTAL_STEPS = 7;

  function $(sel, root) { return (root || document).querySelector(sel); }
  function $$(sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }

  function store(key, value) {
    try { localStorage.setItem(key, value); } catch (e) { /* 시크릿 모드 등 */ }
  }
  function load(key) {
    try { return localStorage.getItem(key); } catch (e) { return null; }
  }

  /* ---------------------------------------------------------------------------
   * 1. 도구별 데이터
   *  설치/실행/로그인 방식은 각 도구의 공식 문서를 확인해 기입했습니다.
   *  - Codex        : https://github.com/openai/codex  (npm i -g @openai/codex → codex)
   *  - Claude Code  : https://code.claude.com/docs/en/setup
   *                   (npm i -g @anthropic-ai/claude-code → claude, Node.js 22 이상)
   * ------------------------------------------------------------------------ */
  var TOOLS = {
    codex: {
      name: 'Codex',
      install: 'npm install -g @openai/codex',
      run: 'codex',
      docs: 'https://github.com/openai/codex',
      installNote: 'macOS에서 Homebrew를 쓰신다면 ' +
        '「brew install --cask codex」 로 설치하셔도 됩니다. 둘 중 하나만 하시면 됩니다.',
      loginUrl: 'ChatGPT 계정 로그인 화면',
      loginAccount: 'ChatGPT 계정으로 로그인 (유료 플랜 계정이어야 합니다)'
    },
    claude: {
      name: 'Claude Code',
      install: 'npm install -g @anthropic-ai/claude-code',
      run: 'claude',
      docs: 'https://code.claude.com/docs/en/setup',
      installNote: 'Node.js 22 이상이 필요합니다. 1단계에서 LTS로 설치하셨다면 그대로 두셔도 됩니다. ' +
        'macOS를 쓰신다면 「brew install --cask claude-code」 로 설치하셔도 됩니다.',
      loginUrl: 'Claude 계정 로그인 화면',
      loginAccount: 'Claude 계정으로 로그인 (Pro 또는 Max 플랜 계정이어야 합니다)'
    }
  };

  var currentTool = null;

  function applyTool(key, save) {
    var known = Object.prototype.hasOwnProperty.call(TOOLS, key);
    currentTool = known ? key : null;
    var t = TOOLS[known ? key : 'codex'];

    if (known && save) { store(LS.tool, key); }

    $$('[data-vc-cmd]').forEach(function (el) {
      var which = el.getAttribute('data-vc-cmd');
      el.textContent = which === 'install' ? t.install : t.run;
    });
    $$('[data-vc-toolname]').forEach(function (el) { el.textContent = t.name; });
    $$('[data-vc-text]').forEach(function (el) {
      var k = el.getAttribute('data-vc-text');
      if (t[k]) { el.textContent = t[k]; }
    });
    $$('[data-vc-link="docs"]').forEach(function (el) {
      el.href = t.docs;
      el.textContent = t.name + ' 공식 문서 열기';
    });
    $$('[data-vc-if-no-tool]').forEach(function (el) {
      el.classList.toggle('hidden', known);
    });
    $$('[data-tool-pick]').forEach(function (btn) {
      btn.setAttribute('aria-pressed', String(btn.getAttribute('data-tool-pick') === key));
    });

    var status = $('#vcToolStatus');
    if (status) {
      status.textContent = known
        ? '선택하신 도구: ' + t.name + '. 아래 모든 단계의 명령어가 ' + t.name + ' 기준으로 바뀌었습니다.'
        : '아직 도구를 고르지 않으셨습니다. 위에서 하나를 선택해 주세요.';
    }
    buildPrompt();
  }

  $$('[data-tool-pick]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      applyTool(btn.getAttribute('data-tool-pick'), true);
    });
  });

  /* ---------------------------------------------------------------------------
   * 2. 프롬프트 빌더
   * ------------------------------------------------------------------------ */
  var TEMPLATES = {
    quiz: {
      label: '단원 퀴즈 게임',
      features: [
        '객관식 문제를 한 문제씩 보여 주고, 답을 고르면 정답 여부와 짧은 해설을 즉시 보여 줍니다.',
        '문제는 10문항으로 하고, 풀 때마다 순서를 섞습니다.',
        '마지막에 점수와 칭호(예: 90점 이상 "○○ 박사")를 보여 줍니다.',
        '"다시 풀기" 버튼으로 처음부터 다시 시작할 수 있게 합니다.',
        '틀린 문제만 모아 다시 보는 화면을 넣습니다.'
      ]
    },
    tools: {
      label: '수업 도구(랜덤 뽑기·모둠 편성·타이머)',
      features: [
        '한 화면 위쪽에 "랜덤 뽑기 / 모둠 편성 / 타이머" 세 개의 탭을 둡니다.',
        '랜덤 뽑기: 번호 1번부터 학생 수까지 중에서 한 명을 크게 뽑아 보여 주고, 이미 뽑힌 번호는 다시 안 나오게 합니다.',
        '모둠 편성: 원하는 모둠 수를 입력하면 번호를 골고루 나눠 모둠 목록을 보여 줍니다.',
        '타이머: 분 단위로 시간을 정하고 시작·멈춤·초기화를 할 수 있으며, 끝나면 화면 색이 바뀝니다.',
        '교실 뒷자리에서도 보이도록 결과 숫자를 아주 크게 표시합니다.'
      ]
    },
    cards: {
      label: '학습 카드',
      features: [
        '개념 카드를 한 장씩 보여 주고, 카드를 누르면 뒷면(뜻과 설명)이 나오게 합니다.',
        '카드는 20장으로 하고, "다음 / 이전" 버튼으로 넘길 수 있게 합니다.',
        '각 카드에 "외웠어요 / 더 볼래요" 버튼을 두고, "더 볼래요"만 모아 다시 보는 기능을 넣습니다.',
        '전체 중 몇 장을 외웠는지 진행률을 위쪽에 표시합니다.',
        '카드 순서를 섞는 버튼을 넣습니다.'
      ]
    }
  };

  function val(id, fallback) {
    var el = document.getElementById(id);
    if (!el) { return fallback; }
    var v = String(el.value || '').trim();
    return v || fallback;
  }

  function buildPrompt() {
    var out = $('#vcPromptOut');
    if (!out) { return; }

    var level = val('vcbLevel', '중학교');
    var subject = val('vcbSubject', '(과목)');
    var topic = val('vcbTopic', '(단원/주제)');
    var count = val('vcbCount', '25');
    var minutes = val('vcbMinutes', '45');
    var tplKey = val('vcbTemplate', 'quiz');
    var tpl = TEMPLATES[tplKey] || TEMPLATES.quiz;

    var lines = [];
    lines.push('[역할]');
    lines.push('당신은 학교 수업용 웹앱을 만드는 웹 개발자입니다. 코딩을 전혀 모르는 교사와 함께 일합니다.');
    lines.push('');
    lines.push('[대상과 목적]');
    lines.push('· 사용자: ' + level + ' 학생 ' + count + '명');
    lines.push('· 과목: ' + subject + ' / 단원·주제: ' + topic);
    lines.push('· 사용 상황: ' + minutes + '분 수업 중에 학생이 자기 휴대폰이나 태블릿으로 사용합니다.');
    lines.push('· 목적: 학생이 「' + topic + '」 내용을 스스로 익히고 확인하게 하는 것입니다.');
    lines.push('');
    lines.push('[필수 기능]');
    tpl.features.forEach(function (f, i) { lines.push((i + 1) + '. ' + f); });
    lines.push('');
    lines.push('[지켜야 할 조건]');
    lines.push('1. 사실 정확성: 「' + topic + '」의 내용·연도·인명을 정확하게 씁니다. 확실하지 않은 내용은 지어내지 말고 빈칸으로 두고 저에게 알려 주세요.');
    lines.push('2. 개인정보 미수집: 이름·학번·사진·연락처를 입력받거나 저장하지 않습니다. 로그인 기능도 넣지 않습니다.');
    lines.push('3. 모바일 대응: 휴대폰 세로 화면(가로 375px)에서 글자가 잘리거나 버튼이 화면 밖으로 나가지 않아야 합니다.');
    lines.push('4. 쉬운 한국어: 화면에 나오는 모든 문구는 ' + level + ' 학생이 바로 이해할 수 있는 쉬운 한국어로 씁니다.');
    lines.push('5. 글자 크기: 교실 뒷자리와 프로젝터에서도 보이도록 본문을 충분히 크게 합니다.');
    lines.push('');
    lines.push('[결과물 형식]');
    lines.push('1. index.html 파일 하나로만 만들어 주세요. (HTML·CSS·JavaScript를 한 파일에 넣습니다.)');
    lines.push('2. 외부 로그인, 회원가입, 서버, 데이터베이스는 쓰지 않습니다.');
    lines.push('3. 인터넷 연결 없이 파일을 더블클릭해도 화면이 열리게 만들어 주세요.');
    lines.push('4. 다 만든 뒤에는 무엇을 어떻게 만들었는지 두세 줄로 쉽게 설명해 주세요.');

    out.textContent = lines.join('\n');

    try {
      store(LS.builder, JSON.stringify({
        level: level, subject: subject, topic: topic,
        count: count, minutes: minutes, template: tplKey
      }));
    } catch (e) { /* noop */ }
  }

  ['vcbLevel', 'vcbSubject', 'vcbTopic', 'vcbCount', 'vcbMinutes', 'vcbTemplate'].forEach(function (id) {
    var el = document.getElementById(id);
    if (el) { el.addEventListener('input', buildPrompt); el.addEventListener('change', buildPrompt); }
  });

  function applyTemplate(key, save) {
    if (!TEMPLATES[key]) { return; }
    var sel = $('#vcbTemplate');
    if (sel) { sel.value = key; }
    $$('[data-template-pick]').forEach(function (b) {
      b.setAttribute('aria-pressed', String(b.getAttribute('data-template-pick') === key));
    });
    if (save) { store(LS.template, key); }
    buildPrompt();
  }

  $$('[data-template-pick]').forEach(function (btn) {
    btn.addEventListener('click', function () { applyTemplate(btn.getAttribute('data-template-pick'), true); });
  });
  var tplSelect = $('#vcbTemplate');
  if (tplSelect) {
    tplSelect.addEventListener('change', function () { applyTemplate(tplSelect.value, true); });
  }

  /* ---------------------------------------------------------------------------
   * 3. 수정 프롬프트 8개
   * ------------------------------------------------------------------------ */
  var FIX_PROMPTS = [
    { icon: 'type', title: '글씨가 작을 때', text: '글씨가 작아. 본문 글자 크기만 키워줘. 다른 건 바꾸지 마.' },
    { icon: 'smartphone', title: '휴대폰에서 깨질 때', text: '휴대폰에서 버튼이 잘려. 모바일 화면 기준으로 레이아웃만 고쳐줘. 기능은 그대로 둬.' },
    { icon: 'list-plus', title: '분량을 늘릴 때', text: '문제를 10개로 늘려줘. 나머지 기능과 디자인은 그대로 둬.' },
    { icon: 'undo-2', title: '되돌릴 때', text: '방금 수정 전으로 되돌려줘.' },
    { icon: 'bug', title: '에러가 났을 때', text: '에러 메시지 그대로 붙여넣을게. 원인과 해결책을 알려주고 고쳐줘.\n\n(여기에 빨간 글씨를 그대로 붙여넣으세요)' },
    { icon: 'palette', title: '색만 바꿀 때', text: '전체 색을 파스텔 톤으로 바꿔줘. 글자 크기와 배치는 건드리지 마.' },
    { icon: 'projector', title: '프로젝터용으로 키울 때', text: '교실 프로젝터로 띄울 거야. 제목과 결과 숫자만 훨씬 크게 키워줘. 나머지는 그대로 둬.' },
    { icon: 'message-circle-question', title: '설명을 듣고 싶을 때', text: '지금 이 파일이 어떤 구조인지, 내가 나중에 어디를 고치면 되는지 쉬운 말로 설명해줘. 코드는 바꾸지 마.' }
  ];

  (function renderFixPrompts() {
    var wrap = $('#vcFixPrompts');
    if (!wrap) { return; }
    FIX_PROMPTS.forEach(function (p, i) {
      var id = 'fixp-' + i;
      var card = document.createElement('div');
      card.className = 'vc-card p-4';
      card.innerHTML =
        '<div class="flex items-center gap-2">' +
          '<i data-lucide="' + p.icon + '" class="w-4 h-4 text-primary" aria-hidden="true"></i>' +
          '<span class="font-extrabold text-[15px]"></span>' +
          '<button type="button" class="vc-copy btn btn-xs rounded-lg ml-auto gap-1" ' +
            'data-copy-target="' + id + '" aria-label="수정 프롬프트 복사">' +
            '<i data-lucide="copy" class="w-3 h-3" aria-hidden="true"></i><span>복사</span></button>' +
        '</div>' +
        '<p class="mt-2 p-3 rounded-xl bg-base-200 text-[15px] whitespace-pre-line" id="' + id + '"></p>';
      card.querySelector('span.font-extrabold').textContent = p.title;
      card.querySelector('#' + id).textContent = p.text;
      wrap.appendChild(card);
    });
  }());

  /* ---------------------------------------------------------------------------
   * 4. 바이브코딩 어휘 20선
   *    (출처: 에듀테크 교사 연구회 연수강연팀 부팀장 박창현 선생님 · 울산 고현중)
   * ------------------------------------------------------------------------ */
  var VOCAB = [
    ['프로토타입', '수업 전에 만들어 보는 시범 활동지 초안'],
    ['배포', '인쇄해서 교실에 나눠주는 일'],
    ['호스팅', '학교 게시판에 자료를 붙여 두는 자리를 빌리는 일'],
    ['프롬프트', 'AI에게 건네는 수업 지시문'],
    ['리팩터링', '내용은 그대로 두고 학습지 구성을 더 깔끔하게 다듬는 일'],
    ['디버깅', '틀린 문항을 찾아 고치는 검토 작업'],
    ['에러 로그', '어디서 왜 틀렸는지 적힌 오답 노트'],
    ['반응형', '칠판·태블릿·휴대폰 어디에 띄워도 알맞게 보이는 것'],
    ['컴포넌트', '여러 수업에서 돌려 쓰는 활동 카드 한 장'],
    ['UI·UX', '학습지의 생김새(UI)와 학생이 쓰면서 느끼는 편안함(UX)'],
    ['프론트엔드', '학생이 실제로 보는 화면'],
    ['백엔드', '교무실에서 처리되는 보이지 않는 일 처리'],
    ['데이터베이스', '학생 기록을 모아 두는 학급 명부 캐비닛'],
    ['인증', '출입증을 확인하는 일'],
    ['API', '옆 반 선생님께 자료를 요청하는 정해진 양식'],
    ['환경변수', '금고에 넣어 두고 수업 자료에는 적지 않는 비밀번호'],
    ['커밋', '오늘까지 작업한 상태를 날짜 찍어 저장하는 일'],
    ['롤백', '수정 전 예전 학습지로 되돌리는 일'],
    ['캐시', '어제 복사해 둔 유인물이 남아 새 걸로 안 바뀌는 상태'],
    ['로컬', '아직 내 책상 서랍 안에만 있는 상태']
  ];

  (function renderVocab() {
    var wrap = $('#vcVocab');
    if (!wrap) { return; }
    VOCAB.forEach(function (v, i) {
      var item = document.createElement('div');
      item.className = 'p-3 rounded-xl bg-base-100 border border-base-300';
      item.innerHTML =
        '<p class="font-bold text-[15px]"><span class="text-primary">' + (i + 1) + '.</span> <b></b></p>' +
        '<p class="text-sm text-base-content/75 mt-0.5"></p>';
      item.querySelector('b').textContent = v[0];
      item.querySelector('p.text-sm').textContent = v[1];
      wrap.appendChild(item);
    });
  }());

  /* ---------------------------------------------------------------------------
   * 5. 갤러리
   *    ※ 제목·설명은 제작자가 제공한 내용입니다.
   * ------------------------------------------------------------------------ */
  var GALLERY = [
    {
      title: '중·고등학생을 위한 세계사 사료 탐구 교실',
      url: 'https://worldhistorysources-dongssam.netlify.app/',
      desc: '공개 원문 사료를 원문·해석·출처와 함께 읽고 스스로 질문을 만드는 사료 탐구 도구입니다.',
      tags: ['중·고등', '세계사']
    },
    {
      title: '아고라의 딜레마',
      url: 'https://agora-dilemma-class-20260907.web.app/',
      desc: '펠로폰네소스 전쟁 상황에서 시민이 되어 결정을 내리고 그 결과를 성찰하는 가상 의사결정 수업 웹앱입니다.',
      tags: ['중·고등', '세계사']
    },
    {
      title: '독도네컷',
      url: 'https://dokdo-necut.web.app/',
      desc: '독도의 날 체험부스용입니다. 독도를 지킨 인물과 함께 인생네컷을 찍어 나만의 독도 굿즈를 만듭니다. 사진은 기기에서만 처리됩니다.',
      tags: ['전 학년', '계기교육']
    },
    {
      title: '히스토리 글로브',
      url: 'https://history-globe-psroy.web.app/',
      desc: '3D 지구본을 돌려 같은 시대 각 대륙의 나라와 인물을 한눈에 비교하는 세계사 탐색 도구입니다.',
      tags: ['중·고등', '세계사']
    },
    {
      title: '교과서 단원별 수능 기출 탐색기',
      url: 'https://suneung-textbook.web.app/',
      desc: '교과서 단원을 클릭하면 10개년 수능 출제 주제와 기출 문항으로 연결되는 학습 도구입니다.',
      tags: ['고등', '한국사·사회']
    },
    {
      title: '광복군 미션',
      url: 'https://gwangbok-game-20260911.web.app/',
      desc: '한국광복군 창설일 기념 역사 추리 시뮬레이션입니다. 단서 수집·인물 심문·암호 해독으로 15~20분 플레이합니다.',
      tags: ['중·고등', '한국사']
    },
    {
      title: "Let's KOREA TIME (고려 시간여행)",
      url: 'https://lets-korea-time-2026.web.app/',
      desc: '고려 시대를 배경으로 한 중학생용 역사 방탈출 추리 웹앱입니다.',
      tags: ['중학교', '한국사']
    }
  ];

  (function renderGallery() {
    var wrap = $('#vcGallery');
    if (!wrap) { return; }
    GALLERY.forEach(function (app) {
      var card = document.createElement('article');
      card.className = 'vc-card p-5 flex flex-col';
      card.innerHTML =
        '<h4 class="font-extrabold text-[17px] leading-snug"></h4>' +
        '<p class="mt-2 text-sm text-base-content/75 flex-1"></p>' +
        '<p class="mt-3 flex flex-wrap gap-1" data-tags></p>' +
        '<div class="mt-4 flex flex-wrap gap-2 vc-no-print">' +
          '<a class="btn btn-primary btn-sm rounded-xl gap-1" target="_blank" rel="noopener noreferrer" data-open>' +
            '<i data-lucide="external-link" class="w-3.5 h-3.5" aria-hidden="true"></i>바로 열기</a>' +
          '<button type="button" class="btn btn-outline btn-sm rounded-xl gap-1" data-qr>' +
            '<i data-lucide="qr-code" class="w-3.5 h-3.5" aria-hidden="true"></i>QR 띄우기</button>' +
        '</div>';
      card.querySelector('h4').textContent = app.title;
      card.querySelector('p.mt-2').textContent = app.desc;
      var tagBox = card.querySelector('[data-tags]');
      app.tags.forEach(function (t) {
        var b = document.createElement('span');
        b.className = 'badge badge-sm badge-ghost font-semibold';
        b.textContent = t;
        tagBox.appendChild(b);
      });
      var open = card.querySelector('[data-open]');
      open.href = app.url;
      open.setAttribute('aria-label', app.title + ' 바로 열기');
      var qr = card.querySelector('[data-qr]');
      qr.setAttribute('data-qr-url', app.url);
      qr.setAttribute('data-qr-title', app.title);
      qr.setAttribute('aria-label', app.title + ' QR 띄우기');
      wrap.appendChild(card);
    });
  }());

  /* ---------------------------------------------------------------------------
   * 6. 복사 버튼
   * ------------------------------------------------------------------------ */
  function copyText(text) {
    if (navigator.clipboard && window.isSecureContext) {
      return navigator.clipboard.writeText(text);
    }
    return new Promise(function (resolve, reject) {
      var ta = document.createElement('textarea');
      ta.value = text;
      ta.setAttribute('readonly', '');
      ta.style.position = 'fixed';
      ta.style.top = '-1000px';
      document.body.appendChild(ta);
      ta.select();
      var ok = false;
      try { ok = document.execCommand('copy'); } catch (e) { ok = false; }
      document.body.removeChild(ta);
      ok ? resolve() : reject(new Error('copy failed'));
    });
  }

  function flash(btn, message) {
    var label = btn.querySelector('span');
    var original = label ? label.textContent : '';
    btn.setAttribute('data-copied', 'true');
    if (label) { label.textContent = message; }
    setTimeout(function () {
      btn.removeAttribute('data-copied');
      if (label) { label.textContent = original; }
    }, 1600);
  }

  document.addEventListener('click', function (ev) {
    var btn = ev.target.closest ? ev.target.closest('.vc-copy') : null;
    if (!btn) { return; }
    var text = btn.getAttribute('data-copy-text');
    if (!text) {
      var target = document.getElementById(btn.getAttribute('data-copy-target') || '');
      if (!target) { return; }
      text = ('value' in target && target.value !== undefined && target.tagName !== 'DIV')
        ? target.value : target.textContent;
    }
    text = String(text || '').trim();
    if (!text) { flash(btn, '내용이 없습니다'); return; }
    copyText(text).then(function () {
      flash(btn, '복사되었습니다');
    }).catch(function () {
      flash(btn, '직접 선택해 주세요');
    });
  });

  /* ---------------------------------------------------------------------------
   * 7. 진행률 / 진도
   * ------------------------------------------------------------------------ */
  function readSteps() {
    var raw = load(LS.steps);
    var done = {};
    if (raw) {
      raw.split(',').forEach(function (n) { if (n) { done[n] = true; } });
    }
    return done;
  }

  function updateProgressBadge() {
    var done = $$('.vc-step-check').filter(function (c) { return c.checked; }).length;
    var badge = $('#vcProgressBadge');
    if (badge) { badge.textContent = '내 진도 ' + done + '/' + TOTAL_STEPS + '단계'; }
    store(LS.steps, $$('.vc-step-check')
      .filter(function (c) { return c.checked; })
      .map(function (c) { return c.getAttribute('data-step-check'); })
      .join(','));
  }

  $$('.vc-step-check').forEach(function (chk) {
    chk.addEventListener('change', function () {
      var card = chk.closest('.vc-step');
      if (card) { card.setAttribute('data-done', String(chk.checked)); }
      updateProgressBadge();
    });
  });

  (function restoreSteps() {
    var done = readSteps();
    $$('.vc-step-check').forEach(function (chk) {
      var n = chk.getAttribute('data-step-check');
      if (done[n]) {
        chk.checked = true;
        var card = chk.closest('.vc-step');
        if (card) { card.setAttribute('data-done', 'true'); }
      }
    });
    updateProgressBadge();
  }());

  var resetBtn = $('#vcResetProgress');
  if (resetBtn) {
    resetBtn.addEventListener('click', function () {
      if (!window.confirm('체크해 둔 진도를 모두 지울까요?')) { return; }
      $$('.vc-step-check').forEach(function (c) {
        c.checked = false;
        var card = c.closest('.vc-step');
        if (card) { card.setAttribute('data-done', 'false'); }
      });
      $$('.vc-finish-check').forEach(function (c) { c.checked = false; });
      store(LS.finish, '');
      updateProgressBadge();
      updateFinish();
    });
  }

  var printBtn = $('#vcPrintBtn');
  if (printBtn) { printBtn.addEventListener('click', function () { window.print(); }); }

  /* 스크롤 진행률 바 */
  var progressFill = $('#vcScrollProgress');
  var ticking = false;
  function onScroll() {
    if (ticking || !progressFill) { return; }
    ticking = true;
    window.requestAnimationFrame(function () {
      var h = document.documentElement.scrollHeight - window.innerHeight;
      var ratio = h > 0 ? (window.scrollY / h) : 0;
      progressFill.style.width = Math.min(100, Math.max(0, ratio * 100)).toFixed(2) + '%';
      ticking = false;
    });
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll);
  onScroll();

  /* ---------------------------------------------------------------------------
   * 8. 완주 체크리스트
   * ------------------------------------------------------------------------ */
  function updateFinish() {
    var boxes = $$('.vc-finish-check');
    var all = boxes.length > 0 && boxes.every(function (c) { return c.checked; });
    var congrats = $('#vcCongrats');
    if (congrats) { congrats.classList.toggle('hidden', !all); }
    store(LS.finish, boxes.map(function (c, i) { return c.checked ? i : ''; })
      .filter(function (v) { return v !== ''; }).join(','));
  }

  $$('.vc-finish-check').forEach(function (chk) { chk.addEventListener('change', updateFinish); });

  (function restoreFinish() {
    var raw = load(LS.finish);
    if (!raw) { return; }
    var set = {};
    raw.split(',').forEach(function (n) { if (n !== '') { set[n] = true; } });
    $$('.vc-finish-check').forEach(function (c, i) { if (set[i]) { c.checked = true; } });
    updateFinish();
  }());

  /* ---------------------------------------------------------------------------
   * 9. QR — 클라이언트에서만 생성합니다(외부 API 호출 없음)
   * ------------------------------------------------------------------------ */
  function qrAvailable() { return typeof window.QRCode === 'function'; }

  function drawQr(container, text, size) {
    container.innerHTML = '';
    if (!text) { return false; }
    if (!qrAvailable()) {
      var warn = document.createElement('p');
      warn.className = 'text-sm text-error';
      warn.textContent = 'QR 생성 기능을 불러오지 못했습니다. 인터넷 연결을 확인하시고 페이지를 새로고침해 주세요.';
      container.appendChild(warn);
      return false;
    }
    try {
      new window.QRCode(container, {
        text: text,
        width: size,
        height: size,
        colorDark: '#3b3042',
        colorLight: '#ffffff',
        correctLevel: window.QRCode.CorrectLevel.M
      });
      return true;
    } catch (e) {
      container.innerHTML = '<p class="text-sm text-error">QR을 만들지 못했습니다. 주소를 다시 확인해 주세요.</p>';
      return false;
    }
  }

  function normalizeUrl(raw) {
    var v = String(raw || '').trim();
    if (!v) { return ''; }
    if (!/^https?:\/\//i.test(v)) { v = 'https://' + v; }
    return v;
  }

  var qrInput = $('#vcQrInput');
  var qrBox = $('#vcQrBox');
  var qrCaption = $('#vcQrCaption');

  function refreshQrWidget() {
    if (!qrBox) { return; }
    var url = normalizeUrl(qrInput ? qrInput.value : '');
    if (!url) {
      qrBox.innerHTML = '';
      if (qrCaption) { qrCaption.textContent = '주소를 입력하면 QR이 여기에 나타납니다.'; }
      return;
    }
    var ok = drawQr(qrBox, url, 260);
    if (qrCaption) { qrCaption.textContent = ok ? url : '주소를 다시 확인해 주세요.'; }
  }

  if (qrInput) {
    qrInput.addEventListener('input', refreshQrWidget);
    qrInput.addEventListener('change', refreshQrWidget);
  }

  /* 전면 QR 모달 */
  var qrModal = $('#vcQrModal');
  function openQrModal(url, title) {
    if (!qrModal) { return; }
    var t = $('#vcQrModalTitle');
    var u = $('#vcQrModalUrl');
    if (t) { t.textContent = title || '내 웹앱'; }
    if (u) { u.textContent = url; }
    drawQr($('#vcQrModalBox'), url, 720);
    if (typeof qrModal.showModal === 'function') { qrModal.showModal(); }
    else { qrModal.setAttribute('open', ''); }
  }

  document.addEventListener('click', function (ev) {
    var btn = ev.target.closest ? ev.target.closest('[data-qr-url]') : null;
    if (!btn) { return; }
    openQrModal(btn.getAttribute('data-qr-url'), btn.getAttribute('data-qr-title'));
  });

  var qrFull = $('#vcQrFullscreen');
  if (qrFull) {
    qrFull.addEventListener('click', function () {
      var url = normalizeUrl(qrInput ? qrInput.value : '');
      if (!url) { window.alert('먼저 6단계에서 받은 웹앱 주소를 입력해 주세요.'); return; }
      openQrModal(url, '오늘 만든 내 웹앱');
    });
  }

  var qrSave = $('#vcQrSave');
  if (qrSave) {
    qrSave.addEventListener('click', function () {
      var url = normalizeUrl(qrInput ? qrInput.value : '');
      if (!url) { window.alert('먼저 6단계에서 받은 웹앱 주소를 입력해 주세요.'); return; }
      var canvas = qrBox ? qrBox.querySelector('canvas') : null;
      if (!canvas) { window.alert('QR이 아직 만들어지지 않았습니다. 잠시 뒤 다시 눌러 주세요.'); return; }
      try {
        var a = document.createElement('a');
        a.href = canvas.toDataURL('image/png');
        a.download = 'my-webapp-qr.png';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      } catch (e) {
        window.alert('저장하지 못했습니다. QR 이미지를 마우스 오른쪽 버튼으로 눌러 저장해 주세요.');
      }
    });
  }

  /* ---------------------------------------------------------------------------
   * 10. 문의 메일 도우미 (전송 없음 · 전부 브라우저 안에서 처리)
   * ------------------------------------------------------------------------ */
  var MAIL_TO = 'dongssam94@gmail.com';

  function mailSubject() {
    var org = val('vcmOrg', '');
    var topic = val('vcmTopic', '연수·강의');
    return '[강의 문의] ' + (org ? org + ' · ' : '') + topic;
  }

  function buildMail() {
    var out = $('#vcMailOut');
    if (!out) { return; }
    var org = val('vcmOrg', '(소속)');
    var people = val('vcmPeople', '(대상 인원)');
    var when = val('vcmWhen', '(희망 일시)');
    var topic = val('vcmTopic', '(주제)');
    var body = val('vcmBody', '(요청 내용)');
    var name = val('vcmName', '(성함)');

    var lines = [
      '동쌤(김동은) 선생님께',
      '',
      '안녕하세요. ' + org + '의 ' + name + '입니다.',
      '선생님의 에듀테크·바이브코딩 연수 자료를 보고 연락드립니다.',
      '',
      '아래와 같이 강의를 요청드리고자 합니다.',
      '',
      '· 소속: ' + org,
      '· 대상 인원: ' + people,
      '· 희망 일시: ' + when,
      '· 주제: ' + topic,
      '',
      '[요청 내용]',
      body,
      '',
      '가능 여부와 진행 조건을 회신해 주시면 일정에 맞추어 준비하겠습니다.',
      '바쁘신 중에 시간 내어 읽어 주셔서 감사합니다.',
      '',
      name + ' 드림'
    ];
    out.textContent = lines.join('\n');
  }

  ['vcmOrg', 'vcmPeople', 'vcmWhen', 'vcmTopic', 'vcmBody', 'vcmName'].forEach(function (id) {
    var el = document.getElementById(id);
    if (el) { el.addEventListener('input', buildMail); }
  });

  var mailSend = $('#vcMailSend');
  if (mailSend) {
    mailSend.addEventListener('click', function () {
      var out = $('#vcMailOut');
      var body = out ? out.textContent : '';
      window.location.href = 'mailto:' + MAIL_TO +
        '?subject=' + encodeURIComponent(mailSubject()) +
        '&body=' + encodeURIComponent(body);
    });
  }

  /* ---------------------------------------------------------------------------
   * 11. 초기화
   * ------------------------------------------------------------------------ */
  (function restoreBuilder() {
    var raw = load(LS.builder);
    if (!raw) { return; }
    try {
      var d = JSON.parse(raw);
      var map = {
        vcbLevel: d.level, vcbSubject: d.subject, vcbTopic: d.topic,
        vcbCount: d.count, vcbMinutes: d.minutes
      };
      Object.keys(map).forEach(function (id) {
        var el = document.getElementById(id);
        if (el && map[id]) { el.value = map[id]; }
      });
    } catch (e) { /* 저장값이 깨졌으면 기본값 사용 */ }
  }());

  applyTool(load(LS.tool) || '', false);
  applyTemplate(load(LS.template) || 'quiz', false);
  buildPrompt();
  buildMail();
  refreshQrWidget();

  if (window.lucide && typeof window.lucide.createIcons === 'function') {
    window.lucide.createIcons();
  }
}());
