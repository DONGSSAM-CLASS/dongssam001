// ---------------------------------------------------------------------------
// app.js — 시작 화면, 학생/교사 로그인, 결과 리포트, 전체 흐름 연결
// ---------------------------------------------------------------------------
import * as FB from './firebase.js';
import * as S from './store.js';
import * as U from './ui.js';
import { h } from './ui.js';
import * as Play from './play.js';
import * as Teacher from './teacher.js';
import { CHAPTERS } from './data/chapters.js';
import { STANDARDS, CURRICULUM_NOTICE } from './data/standards.js';

const TITLE_MAIN = '『Let’s KOREA TIME』';
const TITLE_SUB = '중학생을 위한 고려로의 시간여행';

let mode = 'local';

// ── 부팅 ───────────────────────────────────────────────────────────────
(async function boot() {
  mode = await FB.initFirebase();
  Play.setFinishHandler(showResult);
  Teacher.setHomeHandler(() => { S.setStudent(null); title(); });

  const bootEl = U.$('#boot');
  if (bootEl) bootEl.remove();

  if (FB.isCloud()) {
    FB.onAuth(async (user) => {
      if (!user) {
        // 로그인 전에도 이 브라우저에 저장된 진행이 있으면 이어서 할 수 있게 한다
        S.setStudent(null);
        await S.restore();
        title();
        return;
      }
      try {
        const st = await FB.getStudent(user.uid);
        if (st) {
          S.setStudent(st);
          await S.restore();
          title(true);
          return;
        }
        const t = await FB.getTeacher(user.uid);
        if (t) { await Teacher.open(user); return; }
      } catch (err) {
        console.warn('[KOREA TIME] 프로필 확인 실패', err);
      }
      title();
    });
  } else {
    // 체험 모드 — 브라우저에 저장된 진행을 먼저 불러온다
    await S.restore();
    title();
  }

  window.addEventListener('beforeunload', () => { S.pauseClock(); S.flush(); });
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) { S.pauseClock(); S.flush(); }
    else if (U.$('#hud') && !U.$('#hud').hidden) S.startClock();
  });
})();

// ── 시작 화면 ──────────────────────────────────────────────────────────
function title(signedIn) {
  S.pauseClock();
  U.unmountHUD();
  U.showScene('gate');

  const canResume = (signedIn && S.save.chapterIndex + S.save.beatIndex > 0) || (!signedIn && S.hasSave());

  U.render(h('section', { class: 'panel title-panel' },
    h('div', { class: 'title-mark', text: '시간여행 역사 추리' }),
    h('h1', { class: 'game-title' },
      h('span', { class: 'gt-main', text: TITLE_MAIN }),
      h('span', { class: 'gt-sub', text: TITLE_SUB })),
    h('p', { class: 'title-lead', text:
      '918년의 개경에서 1392년의 벽란도까지. 여섯 개의 시대를 지나 ' +
      '열쇠 조각을 모으고, 닫힌 시간의 문을 열어 돌아오세요.' }),

    h('div', { class: 'title-facts' },
      fact('플레이 시간', '15~20분'),
      fact('미션', '6개 · 시대순'),
      fact('수준', '중학생용 · 고등학생용'),
      fact('사료', '34편 · 원문과 출처 제공')
    ),

    S.student ? h('div', { class: 'who-now' },
      h('span', { text: `${S.student.className || ''} ${S.student.number}번 ` }),
      h('b', { text: S.student.nickname }),
      h('span', { class: 'tier-pill', text: S.isHigh() ? '고등학생용' : '중학생용' })
    ) : null,

    h('div', { class: 'title-actions' },
      canResume
        ? U.button('이어서 하기 →', () => { Play.resume(); }, 'primary big')
        : null,
      S.student
        ? U.button(canResume ? '처음부터 다시' : '모험 시작하기 →',
            () => tierPick(), canResume ? 'ghost' : 'primary big')
        : U.button('학생으로 시작하기 →', () => studentAuth(), 'primary big'),
      S.student
        ? U.button('로그아웃', async () => {
            S.pauseClock(); await S.flush(); await FB.signOutNow();
            S.setStudent(null); S.clearLocal(); S.reset(); title();
          }, 'ghost')
        : U.button('선생님으로 들어가기', () => teacherAuth(), 'ghost')
    ),

    mode === 'local' ? h('p', { class: 'notice small' },
      h('b', { text: '체험 모드 · ' }),
      '지금은 학급 연결 없이 혼자 해 보는 상태예요. 진행 상황은 이 브라우저에만 저장됩니다. ' +
      '선생님이 학급 코드를 알려 주셨다면, 아래 [설정 안내]를 참고해 주세요.') : null,

    h('div', { class: 'title-links' },
      h('button', { class: 'linkish', type: 'button', onclick: aboutCurriculum, text: '이 게임과 교육과정' }),
      h('button', { class: 'linkish', type: 'button', onclick: aboutSources, text: '사료와 출처' }),
      mode === 'local'
        ? h('button', { class: 'linkish', type: 'button', onclick: setupHelp, text: '설정 안내' })
        : h('button', { class: 'linkish', type: 'button', onclick: () => teacherAuth(), text: '선생님 방' })
    ),

    h('footer', { class: 'maker' }, '만든이 · 동쌤(김동은 선생님)')
  ), { announce: '시작 화면' });
}

function fact(k, v) {
  return h('div', { class: 'fact' }, h('span', { class: 'fact-k', text: k }), h('b', { class: 'fact-v', text: v }));
}

// ── 수준 고르기 ────────────────────────────────────────────────────────
function tierPick() {
  U.showScene('gate');
  const pick = (t) => {
    S.reset(t);
    if (S.student) S.student.tier = t;
    S.startClock();
    U.mountHUD();
    Play.resume();
  };
  U.render(h('section', { class: 'panel tier-panel' },
    h('h1', { class: 'page-title', text: '어느 수준으로 할까요?' }),
    h('p', { class: 'muted', text: '내용과 사료는 똑같아요. 설명의 친절함과 문제 수만 달라집니다.' }),
    h('div', { class: 'tier-grid' },
      h('button', { class: 'tier-card', type: 'button', onclick: () => pick('ms') },
        h('span', { class: 'tier-name', text: '중학생용' }),
        h('ul', {},
          h('li', { text: '힌트가 처음부터 열려 있어요' }),
          h('li', { text: '어려운 말은 모두 풀이해 줘요' }),
          h('li', { text: '문제 19개 · 15분쯤' })),
        h('span', { class: 'tier-go', text: '이걸로 시작 →' })),
      h('button', { class: 'tier-card', type: 'button', onclick: () => pick('hs') },
        h('span', { class: 'tier-name', text: '고등학생용' }),
        h('ul', {},
          h('li', { text: '힌트는 두 번 틀려야 열려요' }),
          h('li', { text: '장마다 심화 문제가 하나 더' }),
          h('li', { text: '문제 25개 · 20분쯤' })),
        h('span', { class: 'tier-go', text: '이걸로 시작 →' }))
    ),
    h('div', { class: 'row-end' }, U.button('← 뒤로', () => title(!!S.student), 'ghost'))
  ), { announce: '수준 고르기' });
}

// ── 학생 로그인 / 가입 ─────────────────────────────────────────────────
function studentAuth(tab) {
  U.showScene('palace');
  const mode0 = tab || 'in';
  const cloud = FB.isCloud();

  const codeIn = h('input', { class: 'text-input', id: 'code', placeholder: '예) ABC123',
    maxlength: '8', autocapitalize: 'characters', autocomplete: 'off', 'aria-label': '학급 코드' });
  const numIn = h('input', { class: 'text-input', id: 'num', type: 'number', min: '1', max: '60',
    placeholder: '예) 7', inputmode: 'numeric', 'aria-label': '출석 번호' });
  const pwIn = h('input', { class: 'text-input', id: 'pw', type: 'password',
    placeholder: '6자 이상', autocomplete: 'current-password', 'aria-label': '비밀번호' });
  const nickIn = h('input', { class: 'text-input', id: 'nick', maxlength: '12',
    placeholder: '예) 개경탐정', 'aria-label': '별명' });

  const submit = async () => {
    const code = codeIn.value, number = Number(numIn.value), pw = pwIn.value;
    if (!code || !number || !pw) { U.toast('빈 칸을 모두 채워 주세요.', 'warn'); return; }
    if (pw.length < 6) { U.toast('비밀번호는 6자 이상으로 정해 주세요.', 'warn'); return; }
    try {
      U.toast('연결하는 중이에요…', '');
      if (mode0 === 'up') {
        await FB.studentSignUp({ code, number, nickname: nickIn.value, password: pw,
          tier: S.save.tier });
      } else {
        await FB.studentSignIn({ code, number, password: pw });
      }
      // onAuth 가 이어서 화면을 바꾼다
    } catch (err) { U.toast(FB.friendlyError(err), 'bad'); }
  };

  U.render(h('section', { class: 'panel auth' },
    h('h1', { class: 'page-title', text: '학생으로 들어가기' }),

    cloud ? null : h('div', { class: 'notice' },
      h('b', { text: '지금은 체험 모드예요. ' }),
      '학급 계정 없이 바로 해 볼 수 있어요. 진행 상황은 이 브라우저에만 저장됩니다.'),

    cloud ? h('div', { class: 'tabs', role: 'tablist' },
      h('button', { class: `tab ${mode0 === 'in' ? 'on' : ''}`, type: 'button', role: 'tab',
        'aria-selected': String(mode0 === 'in'), onclick: () => studentAuth('in'), text: '이어서 하기' }),
      h('button', { class: `tab ${mode0 === 'up' ? 'on' : ''}`, type: 'button', role: 'tab',
        'aria-selected': String(mode0 === 'up'), onclick: () => studentAuth('up'), text: '처음 시작하기' })
    ) : null,

    cloud ? h('div', { class: 'form' },
      h('label', { class: 'lab', for: 'code', text: '학급 코드 (선생님이 알려 주신 6자리)' }), codeIn,
      h('label', { class: 'lab', for: 'num', text: '출석 번호' }), numIn,
      mode0 === 'up' ? h('label', { class: 'lab', for: 'nick', text: '별명 (실제 이름 말고 별명을 써요)' }) : null,
      mode0 === 'up' ? nickIn : null,
      h('label', { class: 'lab', for: 'pw', text: '비밀번호 (6자 이상 · 잊지 않을 것으로)' }), pwIn,
      mode0 === 'up' ? h('p', { class: 'muted small', text:
        '이메일이나 이름은 받지 않아요. 학급 코드와 번호로만 구분합니다. ' +
        '비밀번호를 잊으면 선생님께 말씀드리면 다시 정할 수 있어요.' }) : null,
      U.button(mode0 === 'up' ? '가입하고 시작하기 →' : '들어가기 →', submit, 'primary big')
    ) : h('div', { class: 'row-gap' },
      U.button('체험 모드로 바로 시작 →', () => tierPick(), 'primary big')),

    h('div', { class: 'row-end' }, U.button('← 처음 화면', () => title(), 'ghost'))
  ), { focus: '#code', announce: '학생으로 들어가기' });
}

// ── 교사 로그인 / 가입 ─────────────────────────────────────────────────
function teacherAuth(tab) {
  U.showScene('yuan');
  const mode0 = tab || 'in';
  if (!FB.isCloud()) {
    U.render(h('section', { class: 'panel auth' },
      h('h1', { class: 'page-title', text: '선생님 방' }),
      h('div', { class: 'notice' },
        h('b', { text: 'Firebase 설정이 아직 없어요. ' }),
        '학급 개설과 대시보드는 Firebase 를 연결해야 씁니다.'),
      setupNode(),
      h('div', { class: 'row-end' }, U.button('← 처음 화면', () => title(), 'ghost'))
    ));
    return;
  }

  const emailIn = h('input', { class: 'text-input', id: 'temail', type: 'email',
    placeholder: 'teacher@school.kr', autocomplete: 'email', 'aria-label': '이메일' });
  const pwIn = h('input', { class: 'text-input', id: 'tpw', type: 'password',
    placeholder: '6자 이상', autocomplete: 'current-password', 'aria-label': '비밀번호' });
  const nameIn = h('input', { class: 'text-input', id: 'tname', maxlength: '20',
    placeholder: '예) 김동은', 'aria-label': '선생님 성함' });

  const submit = async () => {
    const email = emailIn.value.trim(), pw = pwIn.value;
    if (!email || !pw) { U.toast('빈 칸을 채워 주세요.', 'warn'); return; }
    try {
      if (mode0 === 'up') await FB.teacherSignUp(email, pw, nameIn.value);
      else await FB.teacherSignIn(email, pw);
    } catch (err) { U.toast(FB.friendlyError(err), 'bad'); }
  };

  U.render(h('section', { class: 'panel auth' },
    h('h1', { class: 'page-title', text: '선생님으로 들어가기' }),
    h('div', { class: 'tabs', role: 'tablist' },
      h('button', { class: `tab ${mode0 === 'in' ? 'on' : ''}`, type: 'button', role: 'tab',
        'aria-selected': String(mode0 === 'in'), onclick: () => teacherAuth('in'), text: '로그인' }),
      h('button', { class: `tab ${mode0 === 'up' ? 'on' : ''}`, type: 'button', role: 'tab',
        'aria-selected': String(mode0 === 'up'), onclick: () => teacherAuth('up'), text: '가입하기' })
    ),
    h('div', { class: 'form' },
      mode0 === 'up' ? h('label', { class: 'lab', for: 'tname', text: '성함' }) : null,
      mode0 === 'up' ? nameIn : null,
      h('label', { class: 'lab', for: 'temail', text: '이메일' }), emailIn,
      h('label', { class: 'lab', for: 'tpw', text: '비밀번호' }), pwIn,
      U.button(mode0 === 'up' ? '가입하기 →' : '로그인 →', submit, 'primary big'),
      mode0 === 'in' ? h('button', { class: 'linkish', type: 'button', text: '비밀번호를 잊으셨나요?',
        onclick: async () => {
          const email = emailIn.value.trim();
          if (!email) { U.toast('먼저 이메일을 적어 주세요.', 'warn'); return; }
          try { await FB.sendTeacherReset(email); U.toast('재설정 메일을 보냈어요.', 'good'); }
          catch (err) { U.toast(FB.friendlyError(err), 'bad'); }
        } }) : null
    ),
    h('div', { class: 'row-end' }, U.button('← 처음 화면', () => title(), 'ghost'))
  ), { focus: '#temail', announce: '선생님으로 들어가기' });
}

// ── 결과 리포트 ────────────────────────────────────────────────────────
function showResult() {
  S.pauseClock();
  S.save.finishedAt = S.save.finishedAt || Date.now();
  S.markDirty(true);
  U.unmountHUD();
  U.showScene('port');

  const total = S.totalPuzzles(S.save.tier);
  const solved = S.solvedCount();
  const firstTry = Object.keys(S.save.solved).filter((k) => !(S.save.wrong[k] > 0)).length;
  const hints = Object.keys(S.save.hintsUsed).length;

  U.render(h('section', { class: 'panel result' },
    h('div', { class: 'result-crown', text: '🗝' }),
    h('h1', { class: 'page-title', text: '고려 474년, 여행을 마쳤습니다' }),
    S.student ? h('p', { class: 'muted', text:
      `${S.student.className || ''} ${S.student.number}번 ${S.student.nickname}` }) : null,

    h('div', { class: 'result-stats' },
      fact('걸린 시간', S.formatTime(S.elapsed())),
      fact('푼 자물쇠', `${solved} / ${total}`),
      fact('한 번에 푼 문제', `${firstTry}개`),
      fact('쓴 힌트', `${hints}개`)
    ),

    h('h2', { class: 'card-title', text: '내가 모은 기록' }),
    h('ul', { class: 'record-list' }, ...S.save.records.map((r) =>
      h('li', {}, h('b', { text: `${r.chapter}장 · ` }), r.record))),

    h('h2', { class: 'card-title', text: '내가 만난 성취기준' }),
    h('ul', { class: 'std-list' }, ...Object.values(STANDARDS).map((st) => {
      const chs = CHAPTERS.filter((c) => c.standard === st.code);
      return h('li', {},
        h('b', { text: `[${st.code}] ` }), st.text,
        h('span', { class: 'std-where', text: ` — ${chs.map((c) => `${c.no}장`).join(', ')}` }));
    })),
    h('p', { class: 'notice small' }, h('b', { text: '※ ' }), CURRICULUM_NOTICE.body),

    h('h2', { class: 'card-title', text: '한 걸음 더 생각해 보기' }),
    h('ul', { class: 'think-list' },
      h('li', { text: '서희는 무기 없이 땅을 얻었어요. 상대가 진짜 원하는 것을 알면 무엇이 달라질까요?' }),
      h('li', { text: '몽골과의 40년, 실제로 싸운 사람은 누구였나요? 기록에 남는 이름과 남지 않는 이름을 생각해 보세요.' }),
      h('li', { text: '만적은 왜 “때가 오면 누구나 할 수 있다”고 했을까요? 그 근거는 감정이었을까요, 사실이었을까요?' }),
      h('li', { text: '『삼국사기』와 『삼국유사』는 왜 달랐을까요? 지금 우리가 쓰는 역사도 언젠가 그렇게 읽힐까요?' })
    ),

    h('div', { class: 'row-gap center' },
      U.button('처음 화면으로', () => title(!!S.student), 'ghost'),
      U.button('다시 도전하기', () => tierPick(), 'primary')
    ),
    h('footer', { class: 'maker' }, '만든이 · 동쌤(김동은 선생님)')
  ), { announce: '학습 결과' });
}

// ── 안내 모달 ──────────────────────────────────────────────────────────
function aboutCurriculum() {
  U.modal('이 게임과 교육과정', h('div', {},
    h('p', { class: 'notice' }, h('b', { text: CURRICULUM_NOTICE.headline })),
    h('p', { text: CURRICULUM_NOTICE.body }),
    h('p', { class: 'muted small', text: CURRICULUM_NOTICE.source }),
    h('hr'),
    h('h3', { text: '연계 성취기준' }),
    h('ul', {}, ...Object.values(STANDARDS).map((s) =>
      h('li', {}, h('b', { text: `[${s.code}] ` }), s.text))),
    h('hr'),
    h('h3', { text: '미션 순서 (시대순)' }),
    h('ol', {}, ...CHAPTERS.map((c) =>
      h('li', {}, h('b', { text: c.title }), ` — ${c.era} · [${c.standard}]`)))
  ));
}

function aboutSources() {
  U.modal('사료와 출처', h('div', {},
    h('p', { text:
      '게임에 나오는 인물의 말은 대부분 실제 기록에 근거합니다. 대사 바로 아래에 ' +
      '원문 · 쉬운 풀이 · APA 양식 출처를 함께 실었습니다.' }),
    h('h3', { text: '주로 인용한 원전' }),
    h('ul', {},
      h('li', {}, h('b', { text: '『고려사』 (1451) ' }), '— 정인지·김종서 등이 편찬한 기전체 역사서. 세가·열전.'),
      h('li', {}, h('b', { text: '『고려사절요』 (1452) ' }), '— 편년체로 정리한 고려 역사. 훈요 10조, 노비안검법.'),
      h('li', {}, h('b', { text: '『삼국사기』 (1145) ' }), '— 김부식. 설계두 열전.'),
      h('li', {}, h('b', { text: '『삼국유사』 (1281년경) ' }), '— 일연. 고조선(단군) 조.'),
      h('li', {}, h('b', { text: '『동국이상국집』 (1241) ' }), '— 이규보. 벽란도 시, 대장각판군신기고문.'),
      h('li', {}, h('b', { text: '『악장가사』 ' }), '— 고려 가요 「쌍화점」 수록.'),
      h('li', {}, h('b', { text: '『권수정혜결사문』 (1190) ' }), '— 지눌.'),
      h('li', {}, h('b', { text: '『직지』 (1377) ' }), '— 흥덕사 간기. 프랑스 국립도서관 소장.')
    ),
    h('h3', { text: '그림에 대하여' }),
    h('p', { class: 'muted small', text:
      '고려 시대의 사진은 존재하지 않습니다. 실사처럼 보이는 이미지를 만들어 붙이는 대신, ' +
      '실제 유적·유물의 형태(만월대 축대, 팔작지붕과 배흘림기둥, 강화 해안, 벽란도의 돛 등)에 ' +
      '근거해 영화 장면처럼 연출한 그림을 직접 그려 넣었습니다.' })
  ));
}

function setupNode() {
  return h('div', { class: 'setup' },
    h('p', { text: 'Firebase 를 연결하면 학급 개설·학생 계정·대시보드를 쓸 수 있어요.' }),
    h('ol', { class: 'steps' },
      h('li', { text: 'Firebase 콘솔에서 프로젝트를 만들고 Authentication(이메일/비밀번호)과 Cloud Firestore 를 켭니다.' }),
      h('li', { text: '웹 앱을 추가해 설정값(apiKey 등)을 복사합니다.' }),
      h('li', {}, '이 폴더의 ', h('code', { text: 'js/firebase-config.js' }), ' 파일에 붙여 넣습니다.'),
      h('li', {}, h('code', { text: 'firebase deploy' }), ' 로 올리면 끝입니다.')
    ),
    h('p', { class: 'muted small', text: '자세한 순서는 함께 들어 있는 README.md 에 적어 두었습니다.' })
  );
}

function setupHelp() { U.modal('설정 안내', setupNode()); }
