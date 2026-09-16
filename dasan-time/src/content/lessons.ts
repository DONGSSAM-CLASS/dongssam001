/**
 * 학생용 문구를 모두 이 파일에 모아 둔다.
 * 선생님이 나중에 문구만 고치고 싶을 때, 화면 코드를 건드리지 않고 여기만 고치면 된다.
 */
import type { GlossaryKey } from './glossary';

/* ------------------------------------------------------------------ */
/* 활동 ID                                                              */
/* ------------------------------------------------------------------ */

export const ACTIVITY_IDS = [
  'pre',
  's1_a1',
  's1_a2',
  's1_a3',
  's1_reflect',
  's2_a4_1',
  's2_a4_2',
  's2_a4_3',
  's2_reflect',
  's3_a5',
  's3_a6',
  's3_self',
  'home_w1',
  'home_w2',
  'home_w3',
  'home_w4',
  'post',
] as const;

export type ActivityId = (typeof ACTIVITY_IDS)[number];

export type SessionKey = 'pre' | 's1' | 's2' | 's3' | 'home' | 'post';

/** 활동이 어느 차시에 속하는지 */
export const ACTIVITY_SESSION: Record<ActivityId, SessionKey> = {
  pre: 'pre',
  s1_a1: 's1',
  s1_a2: 's1',
  s1_a3: 's1',
  s1_reflect: 's1',
  s2_a4_1: 's2',
  s2_a4_2: 's2',
  s2_a4_3: 's2',
  s2_reflect: 's2',
  s3_a5: 's3',
  s3_a6: 's3',
  s3_self: 's3',
  home_w1: 'home',
  home_w2: 'home',
  home_w3: 'home',
  home_w4: 'home',
  post: 'post',
};

export const ACTIVITY_LABEL: Record<ActivityId, string> = {
  pre: '사전 마음 점검',
  s1_a1: '1차시 활동1 · 나의 스마트폰 성적표',
  s1_a2: '1차시 활동2 · 와이파이 없는 시골 방에서 3일',
  s1_a3: '1차시 활동3 · 1801 강진, 정약용의 첫 겨울',
  s1_reflect: '1차시 성찰일지',
  s2_a4_1: '2차시 활동4-1 · 숏폼의 뇌 vs 다산의 뇌',
  s2_a4_2: '2차시 활동4-2 · 초서 실습',
  s2_a4_3: '2차시 활동4-3 · 시간의 주도성 설명하기',
  s2_reflect: '2차시 성찰일지',
  s3_a5: '3차시 활동5 · 나만의 다산초당 출입증',
  s3_a6: '3차시 활동6 · 갤러리 워크와 동료 평가',
  s3_self: '3차시 자기 평가와 성찰일지',
  home_w1: '4주 실천 · 1주차',
  home_w2: '4주 실천 · 2주차',
  home_w3: '4주 실천 · 3주차',
  home_w4: '4주 실천 · 4주차',
  post: '사후 마음 점검',
};

/** 모둠이 함께 쓰는 활동 (한 장을 모둠원이 같이 고친다) */
export const GROUP_ACTIVITIES: ActivityId[] = ['s1_a3', 's2_a4_1'];

/* ------------------------------------------------------------------ */
/* 앱 이름                                                              */
/* ------------------------------------------------------------------ */

export const APP = {
  name: '다산의 시간',
  subtitle: '스크롤은 멈추고 GO! 몰입은 배우고 GO!',
  tagline: '정약용의 시간에서 배워, 내 시간을 내가 정해요.',
};

/* ------------------------------------------------------------------ */
/* 차시 정보                                                            */
/* ------------------------------------------------------------------ */

export interface SessionMeta {
  key: SessionKey;
  order: number;
  title: string;
  /** 학생에게 보여 주는 차시 목표 */
  goal: string;
  /** 교사 화면에만 표시하는 관련 역량 (사회정서학습 연계) */
  competency: string;
  /** 차시 대표 색 (daisyUI 색 이름) */
  color: 'primary' | 'secondary' | 'accent' | 'success' | 'info';
  activities: ActivityId[];
}

export const SESSIONS: SessionMeta[] = [
  {
    key: 'pre',
    order: 0,
    title: '사전 마음 점검',
    goal: '수업을 시작하기 전에, 지금 내 스마트폰 습관을 솔직하게 적어 봐요.',
    competency: '자기인식',
    color: 'info',
    activities: ['pre'],
  },
  {
    key: 's1',
    order: 1,
    title: '1차시 · 단절의 두 얼굴',
    goal: '내 스마트폰 습관을 살펴보고, 유배지에 막 도착한 정약용의 마음을 상상해 봐요.',
    competency: '자기인식, 마음 돌봄',
    color: 'primary',
    activities: ['s1_a1', 's1_a2', 's1_a3', 's1_reflect'],
  },
  {
    key: 's2',
    order: 2,
    title: '2차시 · 알고리즘의 노예 vs 초서의 주인',
    goal:
      '숏폼을 볼 때의 뇌와 다산처럼 공부할 때의 뇌를 비교해서, ‘시간의 주도성’이 무엇인지 내 말로 설명해 봐요.',
    competency: '자기관리, 소통·협력',
    color: 'secondary',
    activities: ['s2_a4_1', 's2_a4_2', 's2_a4_3', 's2_reflect'],
  },
  {
    key: 's3',
    order: 3,
    title: '3차시 · 나만의 다산초당 출입증',
    goal: '내가 지킬 수 있는 스마트폰 규칙을 정해서, 출입증 카드로 만들고 친구들과 나눠요.',
    competency: '책임, 소통·협력',
    color: 'accent',
    activities: ['s3_a5', 's3_a6', 's3_self'],
  },
  {
    key: 'home',
    order: 4,
    title: '4주 실천 · 나만의 다산초당',
    goal: '교실에서 정한 규칙을 집에서 4주 동안 지켜 보고, 매주 솔직하게 기록해요.',
    competency: '자기관리, 책임',
    color: 'success',
    activities: ['home_w1', 'home_w2', 'home_w3', 'home_w4'],
  },
  {
    key: 'post',
    order: 5,
    title: '사후 마음 점검',
    goal: '4주를 마치고, 내 스마트폰 습관이 어떻게 달라졌는지 다시 적어 봐요.',
    competency: '자기인식, 성찰',
    color: 'info',
    activities: ['post'],
  },
];

export const SESSION_BY_KEY: Record<SessionKey, SessionMeta> = SESSIONS.reduce(
  (acc, s) => ({ ...acc, [s.key]: s }),
  {} as Record<SessionKey, SessionMeta>,
);

/* ------------------------------------------------------------------ */
/* 평가 기준 (6-3) — 학생에게도 미리 공개                                */
/* ------------------------------------------------------------------ */

export interface RubricItem {
  id: 'evidence' | 'concept' | 'feasible';
  /** 교사용 정식 기준 이름 */
  formal: string;
  /** 학생용 쉬운 말 */
  easy: string;
  sessions: string;
  method: string;
}

export const RUBRIC: RubricItem[] = [
  {
    id: 'evidence',
    formal: '사료 해석의 근거 명확성',
    easy: '사료에서 근거를 찾아 말했나요?',
    sessions: '1차시',
    method: '관찰 평가, 사료 학습지',
  },
  {
    id: 'concept',
    formal: '주도성 개념 설명의 정확성',
    easy: '‘시간의 주도성’을 내 말로 설명했나요?',
    sessions: '2차시',
    method: '모둠 탐구표, 서답형',
  },
  {
    id: 'feasible',
    formal: '산출물의 실행 가능성',
    easy: '내가 정한 규칙을 실제로 지킬 수 있나요?',
    sessions: '3차시 · 4주 실천',
    method: '산출물 평가, 자기·동료 평가',
  },
];

/** 차시별로 오늘 안내할 평가 기준 */
export const SESSION_RUBRIC: Record<SessionKey, RubricItem['id'][]> = {
  pre: [],
  s1: ['evidence'],
  s2: ['concept'],
  s3: ['feasible'],
  home: ['feasible'],
  post: [],
};

/* ------------------------------------------------------------------ */
/* 1차시                                                                */
/* ------------------------------------------------------------------ */

/** 활동 1 — 스크린 타임 찾아가는 방법 (그림 없이 3단계 텍스트) */
export const SCREEN_TIME_GUIDE = [
  {
    device: '아이폰 (iPhone)',
    steps: [
      '‘설정’ 앱을 열어요.',
      '아래로 내려 ‘스크린 타임’을 눌러요.',
      '‘모든 활동 보기’에서 지난주 하루 평균 시간을 확인해요.',
    ],
  },
  {
    device: '안드로이드 (갤럭시 등)',
    steps: [
      '‘설정’ 앱을 열어요.',
      '‘디지털 웰빙 및 자녀 보호 기능’을 눌러요.',
      '주간 그래프에서 하루 평균 시간을 확인해요.',
    ],
  },
];

/** 앱 종류 칩 */
export const APP_KINDS = [
  '숏폼 영상',
  '메신저',
  '게임',
  'SNS',
  '웹툰',
  '공부',
  '기타',
] as const;
export type AppKind = (typeof APP_KINDS)[number];

/** 활동 2 — 감정 낱말 칩 */
export const EMOTION_WORDS = [
  '불안해요',
  '심심해요',
  '답답해요',
  '궁금해요',
  '편안해요',
  '자유로워요',
  '외로워요',
  '초조해요',
  '지루해요',
  '설레요',
  '서운해요',
  '홀가분해요',
  '멍해요',
  '화나요',
  '조용해요',
  '느긋해요',
  '어색해요',
  '허전해요',
  '신나요',
  '두려워요',
  '차분해요',
  '갑갑해요',
  '뿌듯해요',
  '막막해요',
] as const;

/** 활동 3 — 스토리텔링 카드 4장 */
export const STORY_CARDS: { title: string; body: string; icon: string }[] = [
  {
    title: '1801년, 뜻밖의 길',
    body:
      '1801년, 정약용이 천주교와 관련된 사건(신유박해)에 휘말려 멀리 전라도 강진으로 유배를 가게 돼요.',
    icon: 'ScrollText',
  },
  {
    title: '반겨 주는 사람이 없던 강진',
    body:
      '강진에 도착한 정약용을 반겨 주는 사람은 거의 없었어요. 주막집의 작은 방 하나에서 지내게 되었어요.',
    icon: 'House',
  },
  {
    title: '방에 이름을 붙이다',
    body: '정약용은 그 방에 ‘사의재(四宜齋)’라는 이름을 붙였어요.',
    icon: 'PenLine',
  },
  {
    title: '이 시간을 어떻게 보낼까',
    body: '가족과도, 친구와도 떨어진 시간. 정약용은 이 시간을 어떻게 보냈을까요?',
    icon: 'Clock',
  },
];

/** 활동 3 — 쉽게 풀어 쓴 사료 카드 */
export const SAUIJAE_SOURCE = {
  title: '쉽게 풀어 쓴 사료 · 「사의재기」',
  intro:
    '강진에 온 정약용은 머무는 방에 ‘사의재’라는 이름을 붙였어요. ‘네 가지를 마땅히 해야 할 방’이라는 뜻이에요.',
  pledges: [
    { label: '생각', text: '생각은 맑게 한다.' },
    { label: '용모', text: '용모(몸가짐)는 단정하게 한다.' },
    { label: '말', text: '말은 적게 한다.' },
    { label: '행동', text: '행동은 무겁게(신중하게) 한다.' },
  ],
  note: '이 글은 학생이 읽기 쉽게 풀어 쓴 글이에요. 사료의 원문 그대로가 아니에요.',
  citation: '출처: 정약용, 「사의재기」, 『여유당전서』 (학생 눈높이에 맞게 쉽게 풀어 씀)',
};

/** 활동 3 — 생각 여는 질문 3문항 */
export const S1_A3_QUESTIONS = [
  {
    id: 'q1',
    label: '정약용이 방 이름에 담은 네 가지 다짐은 무엇인가요?',
    help: '위 사료 카드를 다시 보고, 네 가지를 찾아 적어요.',
    example: '생각은 맑게, 몸가짐은 단정하게, 말은 적게, 행동은 신중하게 하겠다는 다짐이에요.',
    minLength: 10,
  },
  {
    id: 'q2',
    label: '정약용은 왜 이런 다짐을 방 이름으로 붙였을까요?',
    help: '방 이름은 매일 보게 되지요. 그 점을 생각하며 내 생각을 적어요.',
    example:
      '나는 방 이름을 매일 보게 되니까, 마음이 흔들릴 때마다 다짐을 떠올리려고 그랬다고 생각해요.',
    minLength: 10,
  },
  {
    id: 'q3',
    label: '혼자 고립된 시간을 견디려면, 정약용의 방법 중 무엇을 따라 해 보고 싶나요?',
    help: '네 가지 다짐 중 하나를 고르고, 내 생활에서 어떻게 할지 적어요.',
    example: '나는 ‘말은 적게 한다’를 따라 하고 싶어요. 화가 날 때 바로 말하지 않고 한 번 참아 볼래요.',
    minLength: 10,
  },
];

/** 활동 3 — 모둠 보드 안내 */
export const S1_A3_GROUP = {
  title: '모둠 탐구 · 고립된 시간을 견디는 방법',
  guide:
    '정약용을 칭찬하는 말보다, 내가 따라 해 볼 수 있는 방법을 적어요. 모둠 친구들과 함께 채워요.',
  placeholder: '예) 자기 전 10분은 알림을 끄고 오늘 있었던 일을 한 줄로 적어 본다.',
};

/* ------------------------------------------------------------------ */
/* 2차시                                                                */
/* ------------------------------------------------------------------ */

/** 도입 — 쉬운 설명 카드 3장 (과장·공포 조장 표현 없이) */
export const S2_INTRO_CARDS = [
  {
    title: '끝이 없는 화면',
    body: '아래로 내려도 새 영상이 계속 나와요. 끝이 정해져 있지 않아요.',
    icon: 'Infinity',
  },
  {
    title: '앱이 골라 줘요',
    body: '다음 영상을 내가 고르지 않아요. 앱이 계산해서 골라 줘요.',
    icon: 'Shuffle',
  },
  {
    title: '시작과 끝이 내 것이 아니에요',
    body: '언제 그만둘지 내가 정하지 않으면, 스스로 멈추기 어려운 구조예요.',
    icon: 'CirclePause',
  },
];

/** 활동 4-1 — 비교표 행 */
export const S2_COMPARE_ROWS = [
  {
    id: 'how',
    label: '보는 방식',
    hintShort: '한 편을 얼마나 오래 보나요? 몇 편을 이어 보나요?',
    hintDasan: '한 가지를 얼마나 오래 들여다보나요?',
  },
  {
    id: 'who',
    label: '선택의 주체 (누가 고르나요?)',
    hintShort: '다음 영상은 누가 고르나요?',
    hintDasan: '무엇을 옮겨 적을지는 누가 고르나요?',
  },
  {
    id: 'result',
    label: '남는 결과',
    hintShort: '영상을 다 보고 나면 무엇이 기억에 남나요?',
    hintDasan: '공부를 마치고 나면 무엇이 남나요?',
  },
] as const;

export const S2_COMPARE_COLS = [
  { id: 'shortform', label: '숏폼을 볼 때' },
  { id: 'dasan', label: '다산처럼 공부할 때' },
] as const;

/** 활동 4-2 — 초서 실습 */
export const CHOSEO_INTRO = {
  title: '초서(鈔書)란 무엇일까요?',
  body:
    '초서는 책을 읽다가 중요한 부분을 골라 옮겨 적고, 내 생각을 덧붙이는 공부법이에요. 정약용이 두 아들에게 편지로 권한 방법이에요.',
  pasteBlockedMessage: '직접 써 보는 것이 초서예요! 눈으로 읽고 손으로 옮겨 적어 봐요.',
};

/** 활동 4-3 — 서답형 */
export const S2_A4_3 = {
  question: '‘시간의 주도성’이란 무엇일까요? 숏폼과 초서를 예로 들어 설명해 보세요.',
  help: '아래 시작 문장을 눌러서 첫 문장을 채우고, 그다음을 내 말로 이어 써요.',
  starters: [
    '시간의 주도성이란 ',
    '예를 들어 숏폼을 볼 때는 ',
    '초서를 할 때는 ',
    '그래서 나는 ',
  ],
  example:
    '시간의 주도성이란 내 시간을 내가 정하는 힘이에요. 예를 들어 숏폼을 볼 때는 앱이 다음 영상을 골라 주지만, 초서를 할 때는 내가 옮겨 적을 부분을 직접 골라요.',
  minLength: 30,
};

/* ------------------------------------------------------------------ */
/* 3차시                                                                */
/* ------------------------------------------------------------------ */

export const PASS_FIELDS = [
  {
    id: 'app',
    label: '유배 보낼 앱',
    help: '1차시 성적표에서 가장 오래 쓴 앱을 떠올려 봐요.',
    example: '숏폼 영상 앱',
    minLength: 2,
  },
  {
    id: 'time',
    label: '다산초당 운영 시간',
    help: '“매일 저녁 8시~9시”처럼 시간대로 적어요.',
    example: '매일 저녁 8시~9시',
    minLength: 4,
  },
  {
    id: 'alt',
    label: '대안 활동',
    help: '그 시간에 대신 할 일을 적어요. 예: 책 10쪽 읽고 한 줄 적기',
    example: '책 10쪽 읽고 한 줄 적기',
    minLength: 4,
  },
  {
    id: 'pledge',
    label: '나의 주도성 다짐',
    help: '“나는 ~할 때 스마트폰을 스스로 멈춘다.”처럼 적어요.',
    example: '나는 저녁 8시 알림이 울리면 스마트폰을 스스로 멈춘다.',
    minLength: 8,
  },
] as const;

export type PassFieldId = (typeof PASS_FIELDS)[number]['id'];

export const PASS_RULE_HINT =
  '‘무조건 참기’는 규칙이 아니에요. 언제, 무엇을, 대신 무엇을 할지 정해 봐요.';

/** 출입증 카드 색 5가지 (cupcake 테마와 어울리는 파스텔) */
export const PASS_COLORS = [
  { id: 'pink', label: '벚꽃 분홍', bg: '#fbe3ef', border: '#f2b8d4', ink: '#7a2f55' },
  { id: 'mint', label: '새순 민트', bg: '#dff3ec', border: '#a8ddcb', ink: '#1f5f4d' },
  { id: 'butter', label: '버터 노랑', bg: '#fdf2d3', border: '#f3dc9a', ink: '#6d5313' },
  { id: 'sky', label: '맑은 하늘', bg: '#e1eefb', border: '#aecdee', ink: '#1f4a75' },
  { id: 'lilac', label: '라일락 보라', bg: '#ece4f8', border: '#c9b6ec', ink: '#4c356f' },
] as const;

export type PassColorId = (typeof PASS_COLORS)[number]['id'];

export const PASS_STICKERS = ['🌿', '🪷', '📚', '🕯️', '🍵', '🌙', '✏️', '🏡'] as const;

/** 외부 꾸미기 도구 링크 */
export const DECO_LINKS = [
  { label: '미리캔버스로 꾸미기', url: 'https://www.miricanvas.com/' },
  { label: '캔바로 꾸미기', url: 'https://www.canva.com/' },
];

export const DECO_HINT = '저장한 PNG를 불러와 꾸며 보세요.';

/** 활동 6 — 동료 평가 */
export const PEER_VOTE = {
  title: '갤러리 워크 · 동료 평가',
  guide: '실천 가능성이 높은 다짐을 정확히 2개 골라 주세요. 내 카드는 고를 수 없어요.',
  reasonLabel: '이 카드를 고른 이유를 한 줄로 적어 주세요.',
  reasonExample: '시간이 정확하게 정해져 있어서 진짜 지킬 수 있을 것 같아요.',
  aliasPrefix: '초당 친구',
};

/** 3차시 자기 평가 3문항 (별 1~3개) */
export const SELF_EVAL_ITEMS = [
  { id: 'evidence', label: '사료에서 근거를 찾았나요?' },
  { id: 'concept', label: '시간의 주도성을 설명할 수 있나요?' },
  { id: 'feasible', label: '내 규칙을 실제로 지킬 수 있을까요?' },
] as const;

/* ------------------------------------------------------------------ */
/* 성찰일지                                                             */
/* ------------------------------------------------------------------ */

export const MOOD_EMOJIS = [
  { id: 1, emoji: '😞', label: '많이 힘들었어요' },
  { id: 2, emoji: '🙁', label: '조금 힘들었어요' },
  { id: 3, emoji: '😐', label: '보통이에요' },
  { id: 4, emoji: '🙂', label: '괜찮았어요' },
  { id: 5, emoji: '😄', label: '아주 좋았어요' },
] as const;

export const REFLECT_FIELDS: Record<'s1' | 's2', { id: string; label: string; example: string }[]> = {
  s1: [
    {
      id: 'learned',
      label: '오늘 새롭게 알게 된 것',
      example: '정약용이 방 이름에 다짐을 담았다는 것을 처음 알았어요.',
    },
    { id: 'feeling', label: '오늘 내 마음', example: '내 사용 시간을 보고 조금 놀랐어요.' },
    {
      id: 'curious',
      label: '다음 시간에 궁금한 것',
      example: '정약용은 유배지에서 책을 어떻게 썼는지 궁금해요.',
    },
  ],
  s2: [
    {
      id: 'owner',
      label: "오늘 내가 '주인'이었던 순간",
      example: '초서를 할 때 어느 문장을 옮길지 내가 골랐어요.',
    },
    {
      id: 'dragged',
      label: "오늘 '끌려다닌' 순간",
      example: '쉬는 시간에 영상을 보다가 종이 치는 줄도 몰랐어요.',
    },
    { id: 'oneline', label: '오늘 수업 한 줄 느낌', example: '시간을 내가 정한다는 말이 와닿았어요.' },
  ],
};

export const S3_REFLECT_FIELDS = [
  {
    id: 'memorable',
    label: '3차시 동안 가장 기억에 남는 것',
    example: '사의재의 네 가지 다짐이 가장 기억에 남아요.',
  },
  {
    id: 'message',
    label: '앞으로 4주 동안의 나에게 한마디',
    example: '하루쯤 못 지켜도 괜찮아. 다음 날 다시 시작하면 돼.',
  },
];

/* ------------------------------------------------------------------ */
/* 4주 가정 실천                                                        */
/* ------------------------------------------------------------------ */

export const WEEKDAYS = ['월', '화', '수', '목', '금', '토', '일'] as const;

export const HOME_OBSTACLES = ['친구 연락', '심심함', '알림', '숙제 핑계', '기타'] as const;

export const HOME_TEXT = {
  encourage: '지키지 못한 날도 기록하는 것 자체가 멋진 실천이에요.',
  ruleEditLabel: '규칙을 바꾸고 싶다면 여기에 적어요.',
  ruleEditHelp: '바꾼 규칙은 출입증 카드에 ‘수정됨’ 표시와 함께 반영돼요.',
  praiseLabel: '이번 주 나에게 한 줄 칭찬',
  praiseExample: '세 번이나 스스로 멈춘 내가 대단해!',
  guardianLabel: '보호자 응원 한 줄 (안 적어도 괜찮아요)',
  guardianHelp: '집에서 보호자께 보여 드리고 응원 한 줄을 받아 적어 보세요.',
  badgeTitle: '다산초당 4주 완주 배지',
  badgeBody: '4주 동안 솔직하게 기록했어요. 정말 잘했어요!',
};

/* ------------------------------------------------------------------ */
/* 사전·사후 마음 점검                                                   */
/* ------------------------------------------------------------------ */

export interface SurveyQuestion {
  id: string;
  label: string;
  options: string[];
  /** 사후 점검에만 나오는 문항 */
  postOnly?: boolean;
}

export const SURVEY_QUESTIONS: SurveyQuestion[] = [
  {
    id: 'q1_hours',
    label: '하루 평균 스마트폰 사용 시간은 어느 정도인가요?',
    options: ['2시간 미만', '2~4시간', '4~6시간', '6시간 이상'],
  },
  {
    id: 'q2_kind',
    label: '가장 오래 쓰는 앱 종류는 무엇인가요?',
    options: [...APP_KINDS],
  },
  {
    id: 'q3_fail',
    label: '스마트폰 사용을 줄이려다 실패한 적이 있다.',
    options: ['전혀 그렇지 않다', '그렇지 않다', '그렇다', '매우 그렇다'],
  },
  {
    id: 'q4_anxious',
    label: '스마트폰이 없으면 불안하다.',
    options: ['전혀 그렇지 않다', '그렇지 않다', '그렇다', '매우 그렇다'],
  },
  {
    id: 'q5_control',
    label: '나는 스마트폰 사용 시간을 스스로 정할 수 있다고 느낀다.',
    options: ['전혀 그렇지 않다', '그렇지 않다', '그렇다', '매우 그렇다'],
  },
  {
    id: 'q6_help',
    label: '스마트폰 사용 습관을 바꾸는 데 수업이 도움이 되었다.',
    options: ['전혀 그렇지 않다', '그렇지 않다', '그렇다', '매우 그렇다'],
    postOnly: true,
  },
];

export function surveyQuestions(kind: 'pre' | 'post'): SurveyQuestion[] {
  return SURVEY_QUESTIONS.filter((q) => (kind === 'post' ? true : !q.postOnly));
}

/* ------------------------------------------------------------------ */
/* 문장 시작 도우미 (공통)                                               */
/* ------------------------------------------------------------------ */

export const SENTENCE_STARTERS = [
  '나는 ~라고 생각해요. 왜냐하면 ',
  '사료에서 ~라고 했기 때문에 ',
  '예를 들면 ',
  '내 생활에서는 ',
  '앞으로 나는 ',
];

/* ------------------------------------------------------------------ */
/* 공통 안내 문구                                                        */
/* ------------------------------------------------------------------ */

export const UI_TEXT = {
  saving: '저장하고 있어요…',
  saved: '저장했어요 ✓',
  saveFailed: '저장하지 못했어요. 잠시 뒤 다시 해 볼까요?',
  loading: '잠깐만 기다려 주세요',
  privateNotice: '이 내용은 나와 선생님만 볼 수 있어요.',
  submit: '제출하기',
  submitted: '제출했어요',
  resubmit: '다시 제출하기',
  editLocked: '선생님이 수정을 잠갔어요. 궁금한 점은 선생님께 말씀드려요.',
  locked: '아직 열리지 않았어요. 선생님이 열어 주시면 들어갈 수 있어요.',
  requiredHint: '별표(*)가 붙은 칸을 모두 채우면 제출할 수 있어요.',
  example: '예시 보기',
  exampleNotice: '예시는 그대로 옮겨 적지 말고, 내 이야기로 바꿔 써 봐요.',
  readAloud: '소리로 듣기',
  readAloudStop: '그만 듣기',
  trialBanner: '체험 중이에요. 적은 내용은 이 기기에만 잠깐 남아요.',
  trialClear: '체험 기록 지우기',
  columnHelp: '이렇게 써 볼까요?',
  columnMine: '내가 쓴 내용',
  columnItem: '항목',
  rubricTitle: '오늘 이렇게 평가해요',
  emptyDefault: '아직 적은 내용이 없어요.',
  statsCaution:
    '비교 집단이 없는 학급 단위 결과라서, 변화의 원인을 수업 하나로만 단정하기는 어려워요.',
  passwordHelp: '선생님께 말씀드리면, 선생님이 새로 가입할 수 있게 도와주실 거예요.',
};

/** 낱말 풀이가 필요한 문구인지 표시할 때 쓰는 목록 */
export const SESSION_TERMS: Record<SessionKey, GlossaryKey[]> = {
  pre: [],
  s1: ['포모', '유배', '사료', '사의재', '신유박해'],
  s2: ['알고리즘', '숏폼', '무한 스크롤', '초서', '주도성'],
  s3: ['다산초당', '주도성', '동료 평가'],
  home: ['성찰'],
  post: [],
};
