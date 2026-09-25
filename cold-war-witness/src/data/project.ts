/**
 * 6차시 모둠 프로젝트 — 「디지털 인공지능 윤리 콘텐츠 창작 및 발표 수업」
 *
 *  1차시      활동 안내, 모둠 편성 및 역할 분담
 *  2~3차시    디지털 인공지능 윤리 콘텐츠 창작 기획서 작성 및 검토
 *  4~5차시    디지털 인공지능 윤리 콘텐츠 창작 (숏폼, 굿즈, 웹툰 등)
 *  6차시      발표 및 피드백
 *
 * ✏️ 교사가 문장을 고치는 곳입니다. id 는 저장 데이터·보안 규칙(firestore.rules)과 이어져 있으니 바꾸지 마세요.
 * 윤리 점검표의 basis 는 「대한민국 인공지능 윤리원칙」(2026. 8. 21.) 원문의 ‘이용자’ 역할 문장입니다.
 */
import type {
  ActivityId,
  ContentFormat,
  EthicsCheck,
  HistoryCheck,
  LessonSession,
  RubricItem,
  SessionNo,
  TeamRole,
} from '../types/content';
import { SESSION_CURRICULUM } from './curriculum';

export const PROJECT_TITLE = '디지털 인공지능 윤리 콘텐츠 창작 및 발표 수업';

/** 한 문장 소개 (활동 안내 첫 화면) */
export const PROJECT_MISSION =
  '냉전 시대의 감시·낙인·위기 속에서 사람들이 내린 선택을 탐구하고, 오늘날 AI 시대에 지켜야 할 윤리원칙을 모둠이 함께 디지털 콘텐츠로 만들어 알립니다.';

/* ───────────────────────── 차시 ───────────────────────── */

export const LESSON_SESSIONS: LessonSession[] = [
  {
    no: 1,
    block: '1차시',
    blockTitle: '활동 안내, 모둠 편성 및 역할 분담',
    title: '활동 안내 · 모둠 편성 · 역할 분담 · 사건 파일 고르기',
    activities: ['guide', 'team'],
    curriculum: SESSION_CURRICULUM[1],
    principleIds: ['accountability', 'fairness'],
  },
  {
    no: 2,
    block: '2~3차시',
    blockTitle: '디지털 인공지능 윤리 콘텐츠 창작 기획서 작성 및 검토',
    title: '사건 파일 탐구 · 기획서 쓰기',
    activities: ['explore', 'plan'],
    curriculum: SESSION_CURRICULUM[2],
    principleIds: ['privacy', 'humanCentric', 'fairness', 'accountability', 'reliability', 'safety', 'transparency'],
  },
  {
    no: 3,
    block: '2~3차시',
    blockTitle: '디지털 인공지능 윤리 콘텐츠 창작 기획서 작성 및 검토',
    title: '기획서 완성 · 윤리 점검 · 동료 검토',
    activities: ['plan', 'review'],
    curriculum: SESSION_CURRICULUM[3],
    principleIds: ['fairness', 'reliability', 'transparency'],
  },
  {
    no: 4,
    block: '4~5차시',
    blockTitle: '디지털 인공지능 윤리 콘텐츠 창작 (숏폼, 굿즈, 웹툰 등)',
    title: '창작 ① 스토리보드 · 초안 · AI 활용 기록',
    activities: ['create'],
    curriculum: SESSION_CURRICULUM[4],
    principleIds: ['humanCentric', 'transparency', 'accountability'],
  },
  {
    no: 5,
    block: '4~5차시',
    blockTitle: '디지털 인공지능 윤리 콘텐츠 창작 (숏폼, 굿즈, 웹툰 등)',
    title: '창작 ② 완성 · 최종 윤리 점검 · 제출',
    activities: ['create', 'submit'],
    curriculum: SESSION_CURRICULUM[5],
    principleIds: ['reliability', 'safety', 'privacy'],
  },
  {
    no: 6,
    block: '6차시',
    blockTitle: '발표 및 피드백',
    title: '발표 · 상호 피드백 · 나의 AI 윤리 실천 선언',
    activities: ['gallery', 'declare'],
    curriculum: SESSION_CURRICULUM[6],
    principleIds: ['fairness', 'humanCentric'],
  },
];

export function getSession(no: SessionNo): LessonSession {
  return LESSON_SESSIONS[no - 1];
}

/** 활동이 처음 열리는 차시 */
export const ACTIVITY_OPENS: Record<ActivityId, SessionNo> = {
  guide: 1,
  team: 1,
  explore: 2,
  plan: 2,
  review: 3,
  create: 4,
  submit: 5,
  gallery: 6,
  declare: 6,
};

export const ACTIVITY_LABEL: Record<ActivityId, { name: string; path: string; what: string }> = {
  guide: { name: '활동 안내', path: '/play/guide', what: '6차시 동안 무엇을 만들지 알아봐요' },
  team: { name: '우리 모둠', path: '/play/team', what: '모둠·역할·약속·사건 파일을 정해요' },
  explore: { name: '사건 파일 탐구', path: '/play/explore', what: '냉전 속 시민이 되어 선택해 봐요' },
  plan: { name: '기획서', path: '/play/plan', what: '모둠이 함께 콘텐츠 기획서를 써요' },
  review: { name: '기획서 검토', path: '/play/review', what: '다른 모둠 기획서에 피드백을 줘요' },
  create: { name: '창작 작업실', path: '/play/create', what: '스토리보드·AI 활용 기록·출처를 채워요' },
  submit: { name: '최종 점검·제출', path: '/play/create#submit', what: '윤리 점검 후 작품을 제출해요' },
  gallery: { name: '발표·피드백', path: '/play/gallery', what: '다른 모둠 작품을 보고 평가해요' },
  declare: { name: '실천 선언문', path: '/play/finale', what: '나의 AI 윤리 실천을 약속해요' },
};

/* ───────────────────────── 모둠 ───────────────────────── */

export const MAX_GROUPS = 8;
export const MAX_GROUP_MEMBERS = 6;

export const ROLES: TeamRole[] = [
  {
    id: 'leader',
    name: '모둠장 (프로젝트 매니저)',
    tasks: ['회의를 이끌고 모두의 의견을 골고루 들어요.', '할 일과 일정을 정리하고, 빠진 일이 없는지 챙겨요.'],
    principleIds: ['accountability'],
    goodFor: '친구들의 의견을 잘 모으고 계획 세우기를 좋아하는 친구',
  },
  {
    id: 'historian',
    name: '역사 탐구원',
    tasks: ['사건 파일의 사실 카드에서 근거를 찾아요.', '작품 속 역사 내용(날짜·숫자·인물)이 사실 카드와 맞는지 확인해요.'],
    principleIds: ['reliability'],
    goodFor: '꼼꼼하게 읽고 확인하기를 좋아하는 친구',
  },
  {
    id: 'ethicist',
    name: 'AI 윤리 검토관',
    tasks: ['7대 원칙 점검표로 기획서와 작품을 점검해요.', 'AI를 쓴 곳과 쓴 정도를 기록하고 표시하게 챙겨요.'],
    principleIds: ['transparency', 'privacy'],
    goodFor: '규칙과 약속을 잘 지키고, 옳고 그름을 따져 보기를 좋아하는 친구',
  },
  {
    id: 'creator',
    name: '콘텐츠 제작자',
    tasks: ['스토리보드를 그리고 작품을 만들어요.', 'AI 도구를 쓸 때 결과를 그대로 쓰지 않고 직접 고쳐요.'],
    principleIds: ['humanCentric'],
    goodFor: '그리기·영상·꾸미기를 좋아하는 친구',
  },
  {
    id: 'presenter',
    name: '발표·홍보 담당',
    tasks: ['작품 소개 글을 쓰고 발표를 준비해요.', '누구나 이해하기 쉬운 말과 자막으로 전하게 챙겨요.'],
    principleIds: ['fairness'],
    goodFor: '말하기·글쓰기를 좋아하고 앞에 나서는 것이 괜찮은 친구',
  },
];

/** 모둠 약속 도우미 (K-SEL 소통·협력) */
export const PLEDGE_STARTERS = [
  '다른 친구의 의견을 끝까지 듣고 말하기',
  '맡은 일은 약속한 차시까지 끝내기',
  '의견이 다르면 다수결 전에 이유를 먼저 나누기',
  'AI를 쓸 때는 모둠에 먼저 알리고 기록하기',
];

/* ───────────────────────── 콘텐츠 형식 ───────────────────────── */

export const FORMATS: ContentFormat[] = [
  { id: 'shortform', name: '숏폼 영상', spec: '세로 영상 60초 이내, 자막 넣기', unit: '장면', cuts: 6, tools: '휴대폰 카메라, 영상 편집 앱' },
  { id: 'webtoon', name: '웹툰·인스타툰', spec: '4~8컷', unit: '컷', cuts: 6, tools: '그림 앱, 종이에 그려 사진 찍기' },
  { id: 'cardnews', name: '카드뉴스', spec: '5~8장 (정사각형)', unit: '장', cuts: 6, tools: '디자인 앱, 발표 슬라이드' },
  { id: 'goods', name: '굿즈 디자인', spec: '스티커·키링·배지·책갈피 등 시안 1~3개', unit: '시안', cuts: 3, tools: '그림 앱, 디자인 앱' },
  { id: 'poster', name: '포스터·캠페인', spec: 'A4 또는 A3 한 장', unit: '구역', cuts: 4, tools: '디자인 앱, 종이 포스터' },
  { id: 'other', name: '기타 (직접 정하기)', spec: '선생님과 상의해 정해요', unit: '부분', cuts: 6, tools: '자유' },
];

export const MAX_CUTS = 8;

/* ───────────────────────── 기획서 항목 ───────────────────────── */

export interface PlanField {
  id: 'title' | 'audience' | 'aiCase' | 'message' | 'outline' | 'tools' | 'aiUse' | 'schedule';
  label: string;
  hint: string;
  max: number;
  /** 제출에 필요한 최소 글자 수 (0 이면 선택) */
  min: number;
  /** 주로 쓰는 역할 */
  role: TeamRole['id'];
  rows: number;
}

export const PLAN_FIELDS: PlanField[] = [
  { id: 'title', label: '콘텐츠 제목', hint: '보는 사람이 궁금해지는 짧은 제목 (예: “누가 내 하루를 적고 있을까?”)', max: 40, min: 2, role: 'leader', rows: 1 },
  { id: 'audience', label: '누구에게 보여 줄까요?', hint: '예: AI 앱을 매일 쓰는 중학생, 우리 학교 1학년', max: 60, min: 2, role: 'presenter', rows: 1 },
  {
    id: 'aiCase',
    label: '오늘날 AI에서 비슷한 문제는?',
    hint: '냉전 사건과 닮은 오늘날의 AI 문제를 적어요. 어떤 점이 닮았나요? (예: 감시 ↔ AI의 위치·검색 기록 분석)',
    max: 300,
    min: 30,
    role: 'historian',
    rows: 4,
  },
  { id: 'message', label: '핵심 메시지 (한 문장)', hint: '작품을 본 사람이 기억했으면 하는 한 문장', max: 100, min: 10, role: 'presenter', rows: 2 },
  { id: 'outline', label: '구성 (처음 - 가운데 - 끝)', hint: '처음: 냉전 장면으로 시작 → 가운데: 오늘날 AI 장면 → 끝: 원칙과 메시지', max: 500, min: 50, role: 'creator', rows: 6 },
  { id: 'tools', label: '만드는 방법과 도구', hint: '어떤 앱·재료로 만들까요?', max: 200, min: 5, role: 'creator', rows: 2 },
  {
    id: 'aiUse',
    label: '생성형 AI 활용 계획',
    hint: '어디에 어떻게 쓸지, 사람이 할 일은 무엇인지 적어요. 쓰지 않으면 “사용하지 않음”이라고 적어요.',
    max: 300,
    min: 5,
    role: 'ethicist',
    rows: 3,
  },
  { id: 'schedule', label: '역할별 할 일 (4~5차시)', hint: '예: 4차시 — 제작자: 스토리보드 / 역사 탐구원: 사실 확인', max: 300, min: 10, role: 'leader', rows: 4 },
];

/** 기획서에서 고르는 사실 카드·원칙·세부 항목 수 */
export const PLAN_LIMITS = { facts: 3, principles: 2, aspects: 3, values: 3 } as const;

/* ───────────────────────── 윤리 점검표 ───────────────────────── */

/**
 * 7대 원칙 × 2문항. 질문은 학생용으로 새로 썼고, basis 는 원문의 이용자 역할 문장(그대로)이다.
 * 기획 단계(3차시)에는 “이렇게 만들겠다”는 약속으로, 완성 단계(5차시)에는 “이렇게 만들었다”는 확인으로 쓴다.
 */
export const ETHICS_CHECKS: EthicsCheck[] = [
  {
    id: 'hc1',
    principleId: 'humanCentric',
    aspectTag: '과의존',
    question: 'AI가 만든 결과를 그대로 쓰지 않고, 우리가 직접 검토하고 고쳐서 쓰나요?',
    basis: 'AI의 편리함과 유용성에 지나치게 의존하지 않고, 그 산출물을 스스로 검토하여 이용 목적과 상황에 맞게 활용한다.',
  },
  {
    id: 'hc2',
    principleId: 'humanCentric',
    aspectTag: '주체성',
    question: '보는 사람이 스스로 생각하고 판단하게 만드나요? (겁주거나 한쪽으로 몰아가지 않기)',
    basis: 'AI를 다른 사람의 취약성을 부당하게 이용하거나 정보를 왜곡하여 판단이나 행동을 유도하는 데 활용하지 않는다.',
  },
  {
    id: 'pv1',
    principleId: 'privacy',
    aspectTag: '사생활 침해 방지',
    question: '허락받지 않은 다른 사람의 얼굴·목소리·이름·대화를 작품에 넣거나 AI에 입력하지 않나요?',
    basis: '다른 사람의 사적인 대화·사진·음성·위치정보 등을 그 사람의 프라이버시를 침해하는 방식으로 AI에 입력하거나 공유하지 않는다.',
  },
  {
    id: 'pv2',
    principleId: 'privacy',
    aspectTag: '개인정보 보호',
    question: '우리 모둠의 실명·학교·연락처 같은 개인정보가 작품이나 AI 입력에 드러나지 않나요?',
    basis: 'AI를 이용할 때 불필요한 개인정보나 민감한 정보가 입력·공유되지 않도록 살피고, 개인정보 보호를 위해 제공되는 기능과 설정을 적절히 활용한다.',
  },
  {
    id: 'fi1',
    principleId: 'fairness',
    aspectTag: '편향 방지',
    question: '특정 성별·나이·나라·집단을 놀리거나 차별하는 표현이 없나요?',
    basis: 'AI를 활용하여 특정 개인이나 집단을 부당하게 차별·배제하거나 혐오와 편견을 확산하지 않는다.',
  },
  {
    id: 'fi2',
    principleId: 'fairness',
    aspectTag: '참여',
    question: '모둠원 모두의 의견을 듣고, 작품을 볼 사람의 입장도 생각했나요?',
    basis: 'AI를 활용하는 과정에서 그 활용에 관여하거나 영향을 받는 사람의 의견을 듣고 고려한다.',
  },
  {
    id: 'ac1',
    principleId: 'accountability',
    aspectTag: '책임 명확화',
    question: '모둠원 모두 맡은 역할을 다하고, 할 일을 AI에게 떠넘기지 않나요?',
    basis: 'AI를 이용하는 과정에서 자신이 맡은 역할과 책임을 인식하고, 이를 AI에 전가하지 않는다.',
  },
  {
    id: 'ac2',
    principleId: 'accountability',
    aspectTag: '책임 명확화',
    question: '다른 사람의 그림·음악·글을 허락 없이 쓰지 않고, 쓴 자료의 출처를 밝히나요?',
    basis: 'AI를 허위정보 유포, 지식재산권 및 영업비밀 침해, 기술유출, 명예훼손, 차별과 사생활 침해, 비동의 성적 합성물 생성 등 타인의 권리를 침해하는 데 이용하지 않는다.',
  },
  {
    id: 'sf1',
    principleId: 'safety',
    aspectTag: '안전 설계·이용',
    question: '보는 사람에게 지나친 공포나 불안을 주는 장면(폭력·위협)이 없나요?',
    basis: 'AI를 본인 또는 타인의 생명·신체·정신적 건강에 위해를 주거나 재산상 피해를 일으키는 방식으로 이용하지 않는다.',
  },
  {
    id: 'sf2',
    principleId: 'safety',
    aspectTag: '사회적·체계적 위험으로부터의 안전',
    question: '진짜처럼 보이는 가짜 뉴스·가짜 영상을 만들지 않나요? (꾸민 장면은 “가상”이라고 표시)',
    basis: 'AI를 활용할 때 사회의 안전이나 사회적 의사형성에 부정적인 영향을 미칠 가능성을 살피고, 위험이 예상되거나 확인되는 경우 활용 범위를 조정하거나 필요한 조치를 취한다.',
  },
  {
    id: 'rl1',
    principleId: 'reliability',
    aspectTag: '성능 기준',
    question: 'AI가 알려 준 내용을 사실 카드나 믿을 만한 자료로 다시 확인하나요?',
    basis: 'AI의 성능과 한계를 고려하여 중요한 판단에서는 그 결과를 확인하거나 필요한 경우 다른 정보와 함께 검토한다.',
  },
  {
    id: 'rl2',
    principleId: 'reliability',
    aspectTag: '안정적 작동',
    question: 'AI 결과가 이상하거나 앞뒤가 안 맞으면 그대로 쓰지 않고 다시 확인하나요?',
    basis: 'AI의 결과나 작동 상태가 평소와 크게 다르거나 이상이 반복되는 경우 이를 그대로 신뢰하지 않고 확인하며, 필요한 경우 관련 주체에게 알린다.',
  },
  {
    id: 'tr1',
    principleId: 'transparency',
    aspectTag: '투명성',
    question: '작품에 AI를 쓴 곳과 쓴 정도를 표시하나요? (예: “배경 그림 일부 AI 생성, 모둠이 수정”)',
    basis: 'AI를 활용해 만든 결과물을 다른 사람에게 공유할 때에는 그 영향과 맥락을 고려하여 AI 활용 사실을 알린다.',
  },
  {
    id: 'tr2',
    principleId: 'transparency',
    aspectTag: '설명가능성',
    question: '왜 이렇게 만들었는지(근거와 의도)를 다른 사람에게 설명할 수 있나요?',
    basis: 'AI를 활용하여 중요한 판단이나 결정을 하는 경우 판단 기준과 위험 수준 등에 관한 정보를 확인하고 그 의미를 이해한 뒤 활용한다.',
  },
];

/** 역사 정확성 점검 — 이 앱이 콘텐츠를 만들 때 지킨 원칙을 학생 작품에도 똑같이 적용 */
export const HISTORY_CHECKS: HistoryCheck[] = [
  { id: 'hs1', question: '역사 사실(날짜·숫자·인물이 한 일)은 사실 카드에 있는 내용만 썼나요?' },
  { id: 'hs2', question: '실존 인물이 하지 않은 말을 따옴표로 지어내지 않았나요?' },
  { id: 'hs3', question: '가상 인물·가상 장면은 “가상”이라고 밝혔나요?' },
  { id: 'hs4', question: '어느 한 나라·진영을 무조건 나쁘거나 좋게만 그리지 않았나요?' },
];

export const ALL_CHECK_IDS = [...ETHICS_CHECKS.map((c) => c.id), ...HISTORY_CHECKS.map((c) => c.id)];

/* ───────────────────────── 제작 ───────────────────────── */

export const STAGES = [
  { id: 'idea', name: '아이디어' },
  { id: 'storyboard', name: '스토리보드' },
  { id: 'draft', name: '초안 만들기' },
  { id: 'revise', name: '고치기' },
  { id: 'done', name: '완성' },
] as const;
export type StageId = (typeof STAGES)[number]['id'];

/** AI 활용 기록 (투명성) */
export const AI_LOG_FIELDS = [
  { id: 'tools', label: '쓴 AI 도구 이름', hint: '예: 이미지 생성 AI, 번역 AI. 쓰지 않았으면 “없음”', max: 100 },
  { id: 'where', label: 'AI를 쓴 곳과 쓴 정도', hint: '예: 3컷 배경 그림을 AI로 만들고, 인물은 직접 그림', max: 300 },
  { id: 'human', label: '사람(우리)이 한 일', hint: '예: AI 그림에서 어색한 부분을 고치고, 대사는 모두 직접 씀', max: 300 },
  { id: 'label', label: '작품에 붙일 AI 활용 표기 문구', hint: '예: “이 작품의 배경 그림 일부는 생성형 AI로 만들고 모둠이 수정했습니다.”', max: 100 },
] as const;

/* ───────────────────────── 6차시 평가 ───────────────────────── */

export const RUBRIC: RubricItem[] = [
  {
    id: 'ethics',
    name: 'AI 윤리원칙',
    description: 'AI 윤리원칙이 작품에 잘 드러나요.',
    levels: ['원칙이 잘 보이지 않아요', '원칙이 드러나요', '원칙의 뜻까지 깊이 전해져요'],
  },
  {
    id: 'history',
    name: '역사 연결',
    description: '냉전 역사와 오늘날 AI를 근거 있게 이었어요.',
    levels: ['연결이 약해요', '근거 있게 이었어요', '사실 카드를 근거로 설득력 있게 이었어요'],
  },
  {
    id: 'creative',
    name: '창의성',
    description: '새롭고 재미있게 표현했어요.',
    levels: ['평범해요', '새로운 점이 있어요', '아주 참신해요'],
  },
  {
    id: 'delivery',
    name: '전달력',
    description: '메시지가 쉽고 분명하게 전해져요.',
    levels: ['이해하기 어려워요', '잘 전해져요', '누구나 한 번에 이해해요'],
  },
];

/** 피드백 말하기 도우미 (K-SEL [9정서03-01] — 내 말이 친구에게 주는 영향 생각하기) */
export const FEEDBACK_STARTERS = {
  praise: ['특히 좋았던 장면은', '원칙이 잘 드러난 부분은', '역사와 AI를 이은 방법이 좋았던 까닭은'],
  suggest: ['~을 더하면 더 좋을 것 같아요', '~ 부분이 조금 헷갈렸어요. 왜냐하면', '~ 원칙도 함께 보여 주면'],
};

/* ───────────────────────── 1차시 활동 안내 ───────────────────────── */

export const GUIDE_PROMISES = [
  { title: 'AI를 쓰면 꼭 표시해요', text: '작품에 AI를 쓴 곳과 쓴 정도를 밝혀요. (투명성)' },
  { title: '다른 사람의 권리를 지켜요', text: '허락받지 않은 얼굴·이름·목소리, 남의 그림·음악을 쓰지 않아요. (프라이버시 보호·책임성)' },
  { title: '사실을 확인해요', text: '역사 내용은 사실 카드로, AI가 알려 준 내용은 믿을 만한 자료로 다시 확인해요. (신뢰성)' },
  { title: '결정은 우리가 해요', text: 'AI는 돕는 도구일 뿐, 무엇을 만들지는 모둠이 함께 판단해요. (인간중심성)' },
];

export const GUIDE_ROADMAP = LESSON_SESSIONS.map((s) => ({ no: s.no, block: s.block, title: s.title }));

export const ALL_FORMAT_IDS = FORMATS.map((f) => f.id);
export const ALL_ROLE_IDS = ROLES.map((r) => r.id);
export const ALL_STAGE_IDS = STAGES.map((s) => s.id);
