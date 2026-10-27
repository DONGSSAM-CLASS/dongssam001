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
   *  - Codex        : https://developers.openai.com/codex/cli  (npm i -g @openai/codex → codex)
   *  - Claude Code  : https://code.claude.com/docs/en/setup
   *                   (npm i -g @anthropic-ai/claude-code → claude, Node.js 22 이상)
   * ------------------------------------------------------------------------ */
  var TOOLS = {
    codex: {
      name: 'Codex',
      install: 'npm install -g @openai/codex',
      run: 'codex',
      docs: 'https://developers.openai.com/codex/cli',
      installNote: 'macOS에서 Homebrew를 쓰신다면 ' +
        '「brew install --cask codex」 로 설치하셔도 됩니다. 둘 중 하나만 하시면 됩니다.',
      loginUrl: 'ChatGPT 계정 로그인 화면',
      loginAccount: 'ChatGPT 계정으로 로그인'
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
    var activeKey = known ? key : 'codex';
    var t = TOOLS[activeKey];

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
    $$('[data-vc-only]').forEach(function (el) {
      el.classList.toggle('hidden', el.getAttribute('data-vc-only') !== activeKey);
    });
    $$('[data-vc-step2-outcome]').forEach(function (el) {
      el.textContent = activeKey === 'codex'
        ? 'ChatGPT 데스크톱 앱에서 Codex를 열고, 바탕화면에 새 폴더를 만들지 않아도 새 작업을 시작할 수 있습니다.'
        : '터미널에서 Claude Code를 실행하고, 실습 폴더를 맡길 준비가 됩니다.';
    });
    $$('[data-vc-step2-title]').forEach(function (el) {
      el.textContent = activeKey === 'codex'
        ? 'Codex 열고 작업 시작하기'
        : 'Claude Code 설치하고 로그인하기';
    });
    $$('[data-vc-cli-title]').forEach(function (el) {
      el.textContent = activeKey === 'codex'
        ? '선택 사항 · Node.js와 터미널로 Codex CLI 사용하기'
        : 'Node.js와 터미널로 Claude Code 시작하기';
    });
    $$('[data-vc-cli-intro]').forEach(function (el) {
      el.textContent = activeKey === 'codex'
        ? '강사가 터미널 방식으로 하라고 했을 때만 펼쳐서 따라 하세요.'
        : 'Claude Code는 아래 터미널 설치 방법으로 시작합니다.';
    });
    $$('[data-tool-pick]').forEach(function (btn) {
      btn.setAttribute('aria-pressed', String(btn.getAttribute('data-tool-pick') === key));
    });

    var status = $('#vcToolStatus');
    if (status) {
      status.textContent = known
        ? '선택하신 도구: ' + t.name + '. 아래 안내가 ' + t.name + ' 기준으로 준비되었습니다.'
        : '아직 도구를 고르지 않으셨습니다. 위에서 하나를 선택해 주세요.';
    }
    buildPrompt();
  }

  $$('[data-tool-pick]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      applyTool(btn.getAttribute('data-tool-pick'), true);
    });
  });

  /* 모바일 메뉴 — 항목을 고르면 접힙니다. */
  var mobileMenu = $('#vcMobileMenu');
  if (mobileMenu) {
    $$('#vcMobileMenuList a').forEach(function (link) {
      link.addEventListener('click', function () { mobileMenu.removeAttribute('open'); });
    });
  }

  /* ---------------------------------------------------------------------------
   * 2. 프롬프트 빌더
   * ------------------------------------------------------------------------ */
  var TEMPLATES = {
    quiz: {
      label: '단원 퀴즈 게임',
      purpose: '수업 말미에 학생이 단원 핵심 내용을 스스로 풀고, 즉시 해설과 점수를 확인하게 하는 것입니다.',
      features: [
        '객관식 문제를 한 문제씩 보여 주고, 답을 고르면 정답 여부와 짧은 해설을 즉시 보여 줍니다.',
        '문제는 10문항으로 하고, 풀 때마다 순서를 섞습니다.',
        '마지막에 점수와 칭호(예: 90점 이상 "○○ 박사")를 보여 줍니다.',
        '"다시 풀기" 버튼으로 처음부터 다시 시작할 수 있게 합니다.',
        '틀린 문제만 모아 다시 보는 화면을 넣습니다.'
      ]
    },
    tools: {
      label: '랜덤 뽑기·모둠 편성·타이머',
      purpose: '발표자 선정, 모둠 편성, 활동 시간 관리를 한 화면에서 빠르게 처리하는 것입니다.',
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
      purpose: '학생이 핵심 개념과 뜻을 카드로 반복해서 익히고, 아직 모르는 내용만 다시 연습하게 하는 것입니다.',
      features: [
        '개념 카드를 한 장씩 보여 주고, 카드를 누르면 뒷면(뜻과 설명)이 나오게 합니다.',
        '카드는 20장으로 하고, "다음 / 이전" 버튼으로 넘길 수 있게 합니다.',
        '각 카드에 "외웠어요 / 더 볼래요" 버튼을 두고, "더 볼래요"만 모아 다시 보는 기능을 넣습니다.',
        '전체 중 몇 장을 외웠는지 진행률을 위쪽에 표시합니다.',
        '카드 순서를 섞는 버튼을 넣습니다.'
      ]
    },
    scoreboard: {
      label: '모둠 점수판',
      purpose: '교사가 수업 중 모둠별 참여 점수를 빠르게 기록하고 프로젝터로 현재 점수를 보여 주는 것입니다.',
      features: [
        '1모둠부터 6모둠까지 큰 점수 카드를 한 화면에 표시합니다.',
        '각 모둠에 +1, +5, -1 버튼을 두고 누르면 점수가 바로 바뀌게 합니다.',
        '모둠 이름은 실명 없이 사용자가 직접 바꿀 수 있게 합니다.',
        '점수가 가장 높은 모둠을 색과 왕관 표시로 강조하고, 공동 1등도 모두 표시합니다.',
        '전체 초기화 버튼은 한 번 더 확인한 뒤 작동하고, 현재 점수는 같은 기기의 브라우저에 자동 저장합니다.'
      ]
    },
    checklist: {
      label: '활동 절차 체크판',
      purpose: '실험·실습·프로젝트 수업에서 학생이 해야 할 순서와 안전 수칙을 빠뜨리지 않게 하는 것입니다.',
      features: [
        '준비 / 활동 / 정리의 세 구역으로 나누고 각 구역에 체크 항목을 4개씩 넣습니다.',
        '항목을 누르면 완료 표시와 취소선이 생기고 전체 진행률 막대가 올라가게 합니다.',
        '안전과 관련된 항목은 경고색과 방패 아이콘으로 눈에 띄게 표시합니다.',
        '모든 항목을 마치면 "활동 완료" 메시지와 정리 확인 질문을 보여 줍니다.',
        '다른 모둠이 다시 쓸 수 있도록 확인 절차가 있는 초기화 버튼을 넣습니다.'
      ]
    },
    bingo: {
      label: '개념 빙고',
      purpose: '단원 도입이나 정리 시간에 핵심 낱말을 재미있게 확인하며 학생 참여를 높이는 것입니다.',
      features: [
        '단원 핵심 낱말 25개로 5×5 빙고판을 만들고 시작할 때마다 위치를 섞습니다.',
        '칸을 누르면 선택 표시가 생기고 다시 누르면 취소할 수 있게 합니다.',
        '가로·세로·대각선의 완성 줄 수를 자동으로 계산해 화면 위에 표시합니다.',
        '3줄 빙고가 되면 축하 화면을 보여 주고 다시 시작 버튼을 제공합니다.',
        '교사용으로 낱말을 하나씩 무작위 추첨하는 작은 진행자 화면도 넣습니다.'
      ]
    },
    discussion: {
      label: '토의 질문 뽑기',
      purpose: '학생이 다양한 질문으로 생각을 말하고, 정해진 시간 안에 모둠 토의를 진행하게 하는 것입니다.',
      features: [
        '단원에 맞는 사실 확인 질문, 이유 설명 질문, 생활 연결 질문을 각각 5개씩 준비합니다.',
        '질문 뽑기 버튼을 누르면 아직 나오지 않은 질문 중 하나를 크게 보여 줍니다.',
        '30초 생각 타이머와 2분 토의 타이머를 한 화면에 넣습니다.',
        '학생이 핵심 생각을 세 줄까지 적을 수 있는 메모 칸을 제공합니다.',
        '모든 질문을 다 쓰면 질문 목록을 초기화할 수 있게 합니다.'
      ]
    },
    debate: {
      label: '찬반 토론 정리표',
      purpose: '학생이 토론 전에 주장과 근거를 구조화하고 발표할 짧은 원고를 완성하게 하는 것입니다.',
      features: [
        '찬성 또는 반대 입장을 큰 버튼으로 먼저 고르게 합니다.',
        '나의 주장, 근거 2개, 근거의 출처, 예상 반론, 재반박을 차례로 입력하게 합니다.',
        '입력 예시와 문장 시작 도움말을 각 칸 아래에 짧게 보여 줍니다.',
        '입력한 내용을 1분 발표용 원고 형식으로 자동 정리해 줍니다.',
        '완성된 원고를 복사하는 버튼과 전체 지우기 버튼을 넣습니다.'
      ]
    },
    matching: {
      label: '짝 맞추기 게임',
      purpose: '학생이 서로 관련된 두 정보를 연결하며 단원 핵심 개념을 반복해서 익히는 것입니다.',
      features: [
        '용어와 뜻처럼 서로 짝이 되는 카드 8쌍을 준비해 모두 뒤집어 놓습니다.',
        '카드 두 장을 누르면 내용을 보여 주고, 짝이 맞으면 열린 상태로 남깁니다.',
        '짝이 틀리면 1초 뒤 다시 뒤집고 짧은 힌트를 보여 줍니다.',
        '시도 횟수, 맞춘 쌍 수, 걸린 시간을 화면 위에 표시합니다.',
        '모든 짝을 맞추면 결과와 다시 하기 버튼을 보여 주며 카드 순서를 다시 섞습니다.'
      ]
    },
    sequence: {
      label: '순서 배열 활동',
      purpose: '학생이 사건, 과정, 문장을 올바른 순서로 배열하며 흐름과 인과관계를 이해하게 하는 것입니다.',
      features: [
        '단원에 맞는 순서 카드 6~8개를 섞어서 세로 목록으로 보여 줍니다.',
        '마우스 드래그와 휴대폰의 위·아래 이동 버튼을 모두 지원합니다.',
        '정답 확인 버튼을 누르면 맞는 위치는 초록색, 틀린 위치는 주황색으로 표시합니다.',
        '첫 시도에는 틀린 카드의 정답을 바로 공개하지 않고 한 문장 힌트만 보여 줍니다.',
        '정답을 모두 맞히면 전체 흐름을 세 문장으로 요약해 보여 줍니다.'
      ]
    },
    ox: {
      label: 'OX 스피드 퀴즈',
      purpose: '수업 중간이나 마무리에 학생의 오개념을 빠르게 확인하고 바로잡는 것입니다.',
      features: [
        'O 또는 X로 답할 수 있는 문장을 한 문제씩 크게 보여 줍니다.',
        '화면 아래에 교실 뒤에서도 보이는 큰 O 버튼과 X 버튼을 배치합니다.',
        '답을 고르면 정답 여부와 함께 왜 그런지 두 문장 이내로 설명합니다.',
        '10문항을 마치면 정답 수와 틀린 개념 목록을 보여 줍니다.',
        '틀린 문제만 다시 풀기와 처음부터 다시 풀기 버튼을 제공합니다.'
      ]
    },
    exit: {
      label: '수업 마침표',
      purpose: '수업이 끝나기 전 학생이 오늘 배운 내용과 남은 질문을 짧게 정리하게 하는 것입니다.',
      features: [
        '"오늘 새로 알게 된 것", "아직 어려운 것", "다음 시간에 묻고 싶은 것" 세 칸을 보여 줍니다.',
        '이해 정도를 1~5개의 신호등 또는 별 버튼으로 고르게 합니다.',
        '빈칸이 있으면 무엇을 더 적어야 하는지 친절하게 알려 줍니다.',
        '완료 버튼을 누르면 입력 내용을 한 장의 제출용 요약 카드로 정리합니다.',
        '개인정보를 입력받지 않고, 요약 카드를 복사하거나 화면으로 교사에게 보여 줄 수 있게 합니다.'
      ]
    },
    rubric: {
      label: '자기평가 루브릭',
      purpose: '학생이 수행 결과를 기준별로 돌아보고 다음에 개선할 한 가지 목표를 정하게 하는 것입니다.',
      features: [
        '내용 이해, 과정 참여, 결과 표현, 협력의 네 가지 평가 기준을 보여 줍니다.',
        '각 기준마다 1단계부터 4단계까지의 구체적인 행동 설명을 제시하고 하나를 고르게 합니다.',
        '선택한 단계에 따라 잘한 점과 다음 도전 문장을 자동으로 추천합니다.',
        '학생이 직접 쓰는 "내가 가장 잘한 것"과 "다음에 바꿀 것" 입력 칸을 넣습니다.',
        '마지막에 선택 결과와 성찰 문장을 한 장의 자기평가서로 정리하고 복사 버튼을 제공합니다.'
      ]
    }
  };

  var DESIGNS = {
    cupcake: {
      label: '귀엽고 화사하게',
      lines: [
        'Tailwind CSS로 화면의 간격과 크기를 깔끔하게 정리합니다.',
        'Lucide 아이콘을 버튼과 제목에 사용해 글을 읽기 전에도 기능을 알아볼 수 있게 합니다.',
        'DaisyUI의 "cupcake" 테마를 적용하고, 둥근 카드와 분홍·하늘색 포인트로 귀엽고 화사하게 만듭니다.',
        '한글이 또렷하게 보이도록 Pretendard 글꼴을 사용합니다.'
      ]
    },
    clean: {
      label: '깔끔한 교과서처럼',
      lines: [
        'Tailwind CSS로 넉넉한 여백과 가지런한 정렬을 사용합니다.',
        'Lucide 아이콘은 꼭 필요한 버튼에만 사용해 뜻을 빠르게 알아보게 합니다.',
        'DaisyUI의 "light" 테마를 적용하고, 흰 배경에 파란색 포인트를 사용해 교과서처럼 깔끔하게 만듭니다.',
        '한글이 또렷하게 보이도록 Pretendard 글꼴을 사용합니다.'
      ]
    },
    projector: {
      label: '교실 뒤에서도 크게',
      lines: [
        'Tailwind CSS로 제목, 버튼, 결과 숫자를 크게 만들고 요소 사이 간격을 넓게 둡니다.',
        'Lucide 아이콘을 글자와 함께 사용해 멀리서도 버튼의 뜻을 알아보게 합니다.',
        'DaisyUI의 "bumblebee" 테마를 적용하고, 검정·노랑의 높은 대비로 프로젝터에서도 선명하게 만듭니다.',
        'Pretendard 글꼴의 굵은 글씨를 사용하고 본문은 18px보다 작아지지 않게 합니다.'
      ]
    },
    nature: {
      label: '편안한 자연 느낌',
      lines: [
        'Tailwind CSS로 복잡하지 않은 카드형 화면과 편안한 여백을 만듭니다.',
        'Lucide 아이콘 중 잎, 체크, 화살표처럼 단순한 선 그림을 사용합니다.',
        'DaisyUI의 "garden" 테마를 적용하고, 초록색과 부드러운 배경색으로 편안하게 만듭니다.',
        '한글이 오래 보아도 편하도록 Pretendard 글꼴을 사용합니다.'
      ]
    },
    game: {
      label: '게임처럼 신나게',
      lines: [
        'Tailwind CSS로 점수, 진행률, 연속 성공 표시가 눈에 띄게 배치되도록 만듭니다.',
        'Lucide 아이콘을 점수·힌트·다시 하기 버튼에 사용해 게임 규칙을 쉽게 알게 합니다.',
        'DaisyUI의 "retro" 테마를 적용하고, 선명한 색과 굵은 테두리로 게임처럼 신나게 만듭니다.',
        'Pretendard 글꼴을 사용하며 숫자와 결과 문구는 특히 크고 굵게 표시합니다.'
      ]
    },
    calm: {
      label: '차분하고 전문적으로',
      lines: [
        'Tailwind CSS로 정보를 일정한 칸과 표 안에 정돈하고 장식을 줄입니다.',
        'Lucide 아이콘은 메뉴와 상태 표시처럼 의미가 분명한 곳에만 사용합니다.',
        'DaisyUI의 "corporate" 테마를 적용하고, 남색·회색 중심으로 차분하고 전문적으로 만듭니다.',
        '한글이 단정하고 읽기 쉽도록 Pretendard 글꼴을 사용합니다.'
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
    var valid = true;
    ['vcbCount', 'vcbMinutes'].forEach(function (id) {
      var el = document.getElementById(id);
      var n = Number(el.value);
      var ok = el.value.trim() !== '' && Number.isInteger(n) && n >= Number(el.min) && n <= Number(el.max);
      el.setAttribute('aria-invalid', String(!ok));
      valid = valid && ok;
    });
    var copy = document.querySelector('[data-copy-target="vcPromptOut"]');
    if (copy) copy.disabled = !valid;
    if (!valid) { out.textContent = '입력값을 확인해 주세요. 학생 수는 1~40명, 수업 시간은 5~90분 범위의 정수로 입력합니다.'; return; }
    var count = val('vcbCount', '25');
    var minutes = val('vcbMinutes', '45');
    var tplKey = val('vcbTemplate', 'quiz');
    var tpl = TEMPLATES[tplKey] || TEMPLATES.quiz;
    var designKey = val('vcbDesign', 'cupcake');
    var design = DESIGNS[designKey] || DESIGNS.cupcake;

    var lines = [];
    lines.push('[역할]');
    lines.push('당신은 학교 수업용 웹앱을 만드는 웹 개발자입니다. 코딩을 전혀 모르는 교사와 함께 일합니다.');
    lines.push('');
    lines.push('[대상과 목적]');
    lines.push('· 사용자: ' + level + ' 학생 ' + count + '명');
    lines.push('· 과목: ' + subject + ' / 단원·주제: ' + topic);
    lines.push('· 사용 상황: ' + minutes + '분 수업 중에 학생이 자기 휴대폰이나 태블릿으로 사용합니다.');
    lines.push('· 선택한 프로그램: ' + tpl.label);
    lines.push('· 목적: ' + (tpl.purpose || ('학생이 「' + topic + '」 내용을 스스로 익히고 확인하게 하는 것입니다.')));
    lines.push('');
    lines.push('[필수 기능]');
    tpl.features.forEach(function (f, i) { lines.push((i + 1) + '. ' + f); });
    lines.push('');
    lines.push('[디자인]');
    lines.push('· 선택한 느낌: ' + design.label);
    design.lines.forEach(function (line, i) { lines.push((i + 1) + '. ' + line); });
    lines.push('5. 외부 디자인 라이브러리가 늦게 불러와져도 핵심 기능과 글은 사용할 수 있도록 기본 CSS를 함께 넣습니다.');
    lines.push('');
    lines.push('[지켜야 할 조건]');
    lines.push('1. 사실 정확성: 「' + topic + '」의 내용·연도·인명을 정확하게 씁니다. 확실하지 않은 내용은 지어내지 말고 빈칸으로 두고 저에게 알려 주세요.');
    lines.push('2. 개인정보 미수집: 이름·학번·사진·연락처를 입력받거나 저장하지 않습니다. 로그인 기능도 넣지 않습니다.');
    lines.push('3. 모바일 대응: 휴대폰 세로 화면(가로 375px)에서 글자가 잘리거나 버튼이 화면 밖으로 나가지 않아야 합니다.');
    lines.push('4. 쉬운 한국어: 화면에 나오는 모든 문구는 ' + level + ' 학생이 바로 이해할 수 있는 쉬운 한국어로 씁니다.');
    lines.push('5. 글자 크기: 본문은 18px 이상, 버튼은 높이 44px 이상으로 만듭니다.');

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
        count: count, minutes: minutes, template: tplKey, design: designKey
      }));
    } catch (e) { /* noop */ }
  }

  ['vcbLevel', 'vcbSubject', 'vcbTopic', 'vcbCount', 'vcbMinutes', 'vcbTemplate', 'vcbDesign'].forEach(function (id) {
    var el = document.getElementById(id);
    if (el) { el.addEventListener('input', buildPrompt); el.addEventListener('change', buildPrompt); }
  });

  function applyTemplate(key, save) {
    if (!Object.prototype.hasOwnProperty.call(TEMPLATES, key)) { return; }
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

  function applyDesign(key) {
    if (!Object.prototype.hasOwnProperty.call(DESIGNS, key)) { return; }
    var sel = $('#vcbDesign');
    if (sel) { sel.value = key; }
    $$('[data-design-pick]').forEach(function (b) {
      b.setAttribute('aria-pressed', String(b.getAttribute('data-design-pick') === key));
    });
    buildPrompt();
  }

  $$('[data-design-pick]').forEach(function (btn) {
    btn.addEventListener('click', function () { applyDesign(btn.getAttribute('data-design-pick')); });
  });
  var designSelect = $('#vcbDesign');
  if (designSelect) {
    designSelect.addEventListener('change', function () { applyDesign(designSelect.value); });
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
   *    ※ 제목은 2026-09-14 각 배포 페이지의 <title>을 직접 확인했습니다.
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
      title: '독도네컷 · 독도의 날 인생네컷',
      url: 'https://dokdo-necut.web.app/',
      desc: '독도의 날 체험부스용입니다. 독도를 지킨 인물과 함께 인생네컷을 찍어 나만의 독도 굿즈를 만듭니다. 사진은 기기에서만 처리됩니다.',
      tags: ['전 학년', '계기교육']
    },
    {
      title: 'History Globe · 히스토리 글로브',
      url: 'https://history-globe-psroy.web.app/',
      desc: '3D 지구본을 돌려 같은 시대 각 대륙의 나라와 인물을 한눈에 비교하는 세계사 탐색 도구입니다.',
      tags: ['중·고등', '세계사']
    },
    {
      title: '역사 수능 기출 탐색',
      url: 'https://suneung-textbook.web.app/',
      desc: '교과서 단원을 클릭하면 10개년 수능 출제 주제와 기출 문항으로 연결되는 학습 도구입니다.',
      tags: ['고등', '한국사·사회']
    },
    {
      title: '아직 오지 않은 광복 · 한국광복군 역사 추리 게임',
      url: 'https://gwangbok-game-20260911.web.app/',
      desc: '한국광복군 창설일 기념 역사 추리 시뮬레이션입니다. 단서 수집·인물 심문·암호 해독으로 15~20분 플레이합니다.',
      tags: ['중·고등', '한국사']
    },
    {
      title: "『Let's KOREA TIME』 : 중학생을 위한 고려로의 시간여행",
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
      return navigator.clipboard.writeText(text).catch(function(){ return legacyCopy(text); });
    }
    return legacyCopy(text);
  }
  function legacyCopy(text) {
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
    if (!btn.dataset.originalLabel) btn.dataset.originalLabel = label ? label.textContent : '';
    var original = btn.dataset.originalLabel;
    clearTimeout(btn._flashTimer);
    var status = $('#vcActionStatus');
    if (status) status.textContent = message;
    btn.setAttribute('data-copied', 'true');
    if (label) { label.textContent = message; }
    btn._flashTimer = setTimeout(function () {
      btn.removeAttribute('data-copied');
      if (label) { label.textContent = original; }
      if (status && status.textContent === message) status.textContent = '';
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
    if (btn.getAttribute('data-copy-target') === 'vcQrInput') text = normalizeUrl(text);
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
      syncFinishFromSteps();
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

  function syncFinishFromSteps() {
    var steps = $$('.vc-step-check');
    $$('.vc-finish-check').forEach(function(c,i){ c.checked = steps[i].checked; });
    updateFinish();
  }
  $$('.vc-finish-check').forEach(function (chk, i) { chk.addEventListener('change', function () {
    var step = $$('.vc-step-check')[i];
    step.checked = chk.checked;
    step.closest('.vc-step').setAttribute('data-done', String(chk.checked));
    updateProgressBadge(); updateFinish();
  }); });

  (function restoreFinish() {
    var raw = load(LS.finish);
    if (!raw) { return; }
    var set = {};
    raw.split(',').forEach(function (n) { if (n !== '') { set[n] = true; } });
    $$('.vc-finish-check').forEach(function (c, i) { if (set[i]) { c.checked = true; } });
    updateFinish();
  }());

  syncFinishFromSteps();

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
    if (!v || /\s/.test(v)) return '';
    if (!/^https?:\/\//i.test(v)) {
      if (/^[a-z][a-z0-9+.-]*:/i.test(v)) return '';
      v = 'https://' + v;
    }
    try {
      var u = new URL(v);
      if (!['http:', 'https:'].includes(u.protocol) || u.username || u.password || !u.hostname.includes('.') || u.hostname === 'localhost' || u.hostname.endsWith('.localhost') || u.hostname.startsWith('127.') || u.hostname.endsWith('.')) return '';
      return u.href;
    } catch (e) { return ''; }
  }

  var qrInput = $('#vcQrInput');
  var qrBox = $('#vcQrBox');
  var qrCaption = $('#vcQrCaption');

  function refreshQrWidget() {
    if (!qrBox) { return; }
    var url = normalizeUrl(qrInput ? qrInput.value : '');
    var raw = qrInput ? qrInput.value.trim() : '';
    if (qrInput) qrInput.setAttribute('aria-invalid', String(!!raw && !url));
    ['vcQrFullscreen', 'vcQrSave'].forEach(function(id){ var b = document.getElementById(id); if(b) b.disabled = !url; });
    var copy = document.querySelector('[data-copy-target="vcQrInput"]');
    if(copy) copy.disabled = !url;
    if (!url) {
      qrBox.innerHTML = '';
      if (qrCaption) { qrCaption.textContent = raw ? '웹앱 주소를 확인해 주세요. 예: https://my-app.web.app (공백 없이 입력)' : '주소를 입력하면 QR이 여기에 나타납니다.'; }
      return;
    }
    var ok = drawQr(qrBox, url, 260);
    if (!ok) {
      ['vcQrFullscreen', 'vcQrSave'].forEach(function(id){ var button=document.getElementById(id); if(button) button.disabled=true; });
    }
    if (qrCaption) { qrCaption.textContent = ok ? url : '주소를 다시 확인해 주세요.'; }
  }

  if (qrInput) {
    qrInput.addEventListener('input', refreshQrWidget);
    qrInput.addEventListener('change', refreshQrWidget);
  }

  /* 전면 QR 모달 */
  var qrModal = $('#vcQrModal');
  function openQrModal(url, title) {
    if (!qrModal || !normalizeUrl(url)) { return; }
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
        var padded = document.createElement('canvas');
        padded.width = canvas.width + 64; padded.height = canvas.height + 64;
        var ctx = padded.getContext('2d');
        ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, padded.width, padded.height);
        ctx.drawImage(canvas, 32, 32);
        a.href = padded.toDataURL('image/png');
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
      if (!d || typeof d !== 'object' || Array.isArray(d)) return;
      if (d.level === '초등학교 2학년' && d.subject === '수학' && d.topic === '두 자리 수의 덧셈' && String(d.count) === '25' && ['40','45'].includes(String(d.minutes))) {
        d.level='중학교'; d.subject='역사'; d.topic='고려의 대외 관계'; d.minutes='45';
      }
      var map = {
        vcbLevel: d.level, vcbSubject: d.subject, vcbTopic: d.topic,
        vcbCount: d.count, vcbMinutes: d.minutes, vcbDesign: d.design
      };
      Object.keys(map).forEach(function (id) {
        var el = document.getElementById(id);
        if (el && map[id] != null) {
          if (el.tagName === 'SELECT' && !Array.from(el.options).some(function(o){ return o.value === map[id]; })) return;
          el.value = map[id];
        }
      });
    } catch (e) { /* 저장값이 깨졌으면 기본값 사용 */ }
  }());

  applyTool(load(LS.tool) || 'codex', false);
  applyDesign(val('vcbDesign', 'cupcake'));
  var savedTemplate = load(LS.template);
  applyTemplate(Object.prototype.hasOwnProperty.call(TEMPLATES, savedTemplate) ? savedTemplate : 'quiz', false);
  buildPrompt();
  buildMail();
  refreshQrWidget();

  if (window.lucide && typeof window.lucide.createIcons === 'function') {
    window.lucide.createIcons();
  }
}());
