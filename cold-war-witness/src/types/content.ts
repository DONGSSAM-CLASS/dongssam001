/**
 * 수업 콘텐츠(시나리오·사실 카드·원칙·수업 자료)의 타입.
 * 실제 문장은 모두 src/data/ 에만 있다. 화면 코드는 이 타입만 보고 그린다.
 */

/** 챕터 번호. 1~3 은 역사 챕터, 'finale' 은 선언문 단계. */
export type ChapterId = 'ch1' | 'ch2' | 'ch3';

/** 7대 원칙 id (src/data/principles.ts) */
export type PrincipleId =
  | 'humanCentric' // 인간중심성
  | 'privacy' // 프라이버시 보호
  | 'fairness' // 공정성·포용성
  | 'accountability' // 책임성
  | 'safety' // 안전성
  | 'reliability' // 신뢰성
  | 'transparency'; // 투명성

/** 3대 가치 id */
export type ValueId = 'dignity' | 'commonGood' | 'sustainability';

/**
 * 한국형 사회정서교육(K-SEL) 4대 사회정서역량 id
 * (「한국형 사회정서교육 교육과정」, 한국교육환경보호원, 2025)
 */
export type KselId =
  | 'selfAwarenessManagement' // 자기인식·관리
  | 'communicationCooperation' // 소통·협력
  | 'responsibility' // 책임
  | 'mindCare'; // 마음돌봄

/** K-SEL 내용 체계의 세 영역 */
export type KselDomain = '자기' | '대인관계·공동체' | '마음건강';

/** K-SEL 중학교 성취기준 코드 */
export type KselStandardCode =
  | '[9정서01-01]'
  | '[9정서01-02]'
  | '[9정서02-01]'
  | '[9정서02-02]'
  | '[9정서03-01]'
  | '[9정서03-02]';

/** 역사과 성취기준 코드 (이 앱이 다루는 것만) */
export type HistoryStandardCode = '[9역07-01]' | '[9역07-02]';

/**
 * 교육과정 연계 정보. 문구는 모두 src/data/curriculum.ts 에 있는 원문 표현을 그대로 쓴다.
 * - history: 2022 개정 역사과 교육과정의 성취기준과 내용 요소
 * - ksel: 한국형 사회정서교육 교육과정의 역량·성취기준·내용 요소
 */
export interface CurriculumLink {
  history: {
    standards: HistoryStandardCode[];
    /** 내용 체계 '지식·이해' 내용 요소 (원문) */
    knowledge: string[];
    /** 내용 체계 '과정·기능' (원문) */
    skills: string[];
    /** 내용 체계 '가치·태도' (원문) */
    values: string[];
  };
  ksel: {
    competencies: KselId[];
    standards: KselStandardCode[];
    domains: KselDomain[];
    /** 중학교 내용 요소 (원문) — 지식·이해 / 과정·기능(인식·관리·성찰) / 가치·태도 */
    knowledge: string[];
    skills: string[];
    values: string[];
  };
}

/** 감정 체크 5종 (선택 전 "지금 이 인물의 마음은?") */
export type EmotionId = 'anxious' | 'afraid' | 'angry' | 'hesitant' | 'calm';

export interface EmotionOption {
  id: EmotionId;
  emoji: string;
  label: string;
}

/** 출처 표시. url 이 비어 있으면 화면에 기관명만 보이고, 작업 로그에 '출처 URL 확인 필요'로 남는다. */
export interface Source {
  /** 출처 기관명 (예: '독일 연방기록원 슈타지 기록보관소') */
  org: string;
  url: string;
}

/** 사실 카드 — 이 문서(명세)에 적힌 사실만 담는다. */
export interface FactCard {
  id: string;
  chapter: ChapterId;
  /** 카드 윗부분의 짧은 제목 */
  title: string;
  /** 날짜 표시 (예: '1989년 11월 9일'). 날짜가 없는 카드는 비워 둔다. */
  dateLabel?: string;
  /** 카드 본문 (1~3문장) */
  body: string;
  /** 특별 카드 종류: 맥락 균형 / 투명성 / 안전성 카드 */
  kind?: 'context' | 'transparency' | 'safety';
  source: Source;
  /**
   * true 이면 명세에 URL 이 없거나 교사 확인이 더 필요한 카드.
   * 화면에는 드러내지 않고 docs/work-log.md 의 [검증필요] 목록에 남긴다.
   */
  needsCheck?: boolean;
  /** 교사용 메모 (화면에 표시하지 않음) */
  note?: string;
}

export interface Choice {
  /** 'a' | 'b' | 'c' — 보안 규칙에서 값 검증에 쓴다. */
  id: 'a' | 'b' | 'c';
  label: string;
  /** 이 선택이 가져올 수 있는 결과 (가상 인물에게 일어날 수 있었던 일, 2~4문장) */
  result: string;
}

export interface Scene {
  /** 'ch1-s1' 형식 */
  id: string;
  /** 장면 번호 1~5 */
  no: number;
  title: string;
  /** 때와 곳 (예: '1980년대 · 동베를린') */
  when: string;
  /** 본문 3~5문장. 문장 단위 배열로 두어 교사가 한 문장씩 고치기 쉽게 한다. */
  body: string[];
  /** 선택 전에 던지는 질문 */
  question: string;
  choices: Choice[];
  /** 선택 뒤 펼쳐 보는 '실제 역사에서는?' 사실 카드 id */
  factIds: string[];
  /** 에필로그 장면이면 true */
  epilogue?: boolean;
}

export interface Character {
  name: string;
  /** 짧은 소개 (예: '동베를린 인쇄소 직원') */
  role: string;
  /** 인물 소개 1~2문장 */
  intro: string;
}

/** AI 시대 연결 질문 (성찰 쓰기) */
export interface ReflectionQuestion {
  /** 'ch1-q1' 형식 — 보안 규칙의 허용 키 목록과 맞춰야 한다. */
  id: string;
  text: string;
  /** 질문과 이어지는 원칙 (화면에 칩으로 표시) */
  principleIds: PrincipleId[];
  /** 생각을 여는 도움말 (선택) */
  hint?: string;
  /** 문장 시작 도우미 — 누르면 쓰기 칸에 붙는다 (중학생이 빈 칸 앞에서 막히지 않도록) */
  starters: string[];
}

export interface Chapter {
  id: ChapterId;
  no: 1 | 2 | 3;
  title: string;
  /** 부제 (시대·장소) */
  period: string;
  place: string;
  /** 챕터 색 테마 (index.css 의 테마 이름) */
  theme: 'berlin' | 'newyork' | 'florida';
  character: Character;
  /** 역사 배경 인트로 (문장 배열) */
  intro: string[];
  /** 인트로에서 보여 줄 사실 카드 */
  introFactIds: string[];
  scenes: Scene[];
  /** 챕터 마무리에서 보여 줄 사실 카드 (예: 위기 그 후) */
  outroFactIds: string[];
  principleIds: PrincipleId[];
  /** 교육과정 연계 (역사과 + K-SEL) */
  curriculum: CurriculumLink;
  kselFocus: {
    /** 챕터 마무리 성찰 질문으로도 쓴다. */
    question: string;
    /** 문장 시작 도우미 */
    starters: string[];
  };
  reflection: {
    questions: ReflectionQuestion[];
    /** 원칙 카드를 받기 위해 답해야 하는 최소 질문 수 */
    minAnswers: number;
    /** 답변 최소 글자 수 */
    minLength: number;
  };
  /** 챕터 마무리 성찰 문항 id ('ch1-wrap' 형식) */
  wrapupId: string;
}

/** 원칙의 세부 항목 (원문의 [주체성] [과의존] 같은 꼬리표) */
export interface PrincipleAspect {
  /** 원문 꼬리표 (예: '과의존') */
  tag: string;
  /** 원문 문장 */
  statement: string;
  /** 원문 ‘주체별 역할’ 가운데 이용자 역할 (원문) — 학생이 콘텐츠를 만들 때의 약속으로 쓴다 */
  userRole: string[];
}

export interface Principle {
  id: PrincipleId;
  name: string;
  english: string;
  icon: string;
  /** 카드 색 (hex) */
  color: string;
  /** 학생용 설명 (쉬운 말) */
  description: string;
  /** 원문 3.2절 문장 */
  official: string[];
  /** 원문 ‘설명 및 주체별 역할’의 세부 항목 */
  aspects: PrincipleAspect[];
  /** 냉전 연결 한 줄 */
  coldWarLink: string;
  chapter: ChapterId;
}

export interface CoreValue {
  id: ValueId;
  name: string;
  english: string;
  icon: string;
  /** 학생용 설명 (쉬운 말) */
  description: string;
  /** 원문 3.1절 문장 */
  official: string[];
}

export interface KselCompetency {
  id: KselId;
  name: string;
  /** 교육과정 문서의 역량 정의 (원문) */
  definition: string;
  /** 중학교 목표 (원문, <표 1-3>) */
  middleSchoolGoal: string;
  /** 학생 화면용 쉬운 풀이 */
  studentText: string;
}

export interface KselStandard {
  code: KselStandardCode;
  domain: KselDomain;
  text: string;
  /** 성취기준 해설 (원문, 있는 경우) */
  commentary?: string;
}

export interface HistoryStandard {
  code: HistoryStandardCode;
  text: string;
  commentary?: string;
}

/** 원문 인용 (문서의 어느 부분인지 함께 적는다) */
export interface CurriculumQuote {
  /** 예: '성취기준 적용 시 고려 사항 (7) 현대 세계의 전개와 과제' */
  where: string;
  text: string;
  /** 이 앱에서 어떻게 반영했는지 */
  applied: string;
}

/* ---------- 수업 자료 (과정안·활동지·교사용 가이드) ---------- */

export interface LessonStep {
  stage: '도입' | '전개' | '정리';
  minutes: number;
  /** 교수·학습 활동 (항목별) */
  teacher: string[];
  student: string[];
  /** 앱 화면과 연결되는 부분 */
  app?: string;
  /** 유의점·자료 */
  notes?: string[];
}

export interface LessonPlan {
  session: SessionNo;
  title: string;
  objectives: string[];
  curriculum: CurriculumLink;
  principleIds: PrincipleId[];
  materials: string[];
  steps: LessonStep[];
  assessment: string[];
}

export interface WorksheetSection {
  heading: string;
  instruction?: string;
  /**
   * 'emotionTable'    장면 1~5 감정·선택 기록표
   * 'questions'       질문 목록 + 쓰기 칸
   * 'lines'           쓰기 줄만
   * 'checklist'       체크 목록
   * 'selfAssessment'  자기 평가 (items 마다 ☆☆☆)
   * 'roleTable'       역할 분담표 (project.ts 의 ROLES)
   * 'planForm'        기획서 양식 (project.ts 의 PLAN_FIELDS)
   * 'ethicsChecklist' 7대 원칙 윤리 점검표 + 역사 정확성 점검 (project.ts)
   * 'storyboard'      스토리보드 칸
   * 'aiLog'           AI 활용 기록 (project.ts 의 AI_LOG_FIELDS)
   * 'rubric'          다른 모둠 평가표 (project.ts 의 RUBRIC)
   */
  type:
    | 'emotionTable'
    | 'questions'
    | 'lines'
    | 'checklist'
    | 'selfAssessment'
    | 'roleTable'
    | 'planForm'
    | 'ethicsChecklist'
    | 'storyboard'
    | 'aiLog'
    | 'rubric';
  items?: string[];
  lines?: number;
  /** 'emotionTable' 의 열 제목 (장면 열 다음에 붙는다) */
  columns?: string[];
}

export interface Worksheet {
  session: SessionNo;
  title: string;
  sections: WorksheetSection[];
}

export interface GuideSection {
  heading: string;
  paragraphs?: string[];
  bullets?: string[];
  /** 발문 예시·예상 반응 표 */
  qa?: { prompt: string; responses: string[]; tip?: string }[];
}

export interface TeacherGuide {
  title: string;
  sections: GuideSection[];
}

/* ───────────────────── 6차시 모둠 프로젝트 ───────────────────── */

/** 차시 번호 */
export type SessionNo = 1 | 2 | 3 | 4 | 5 | 6;

export interface LessonSession {
  no: SessionNo;
  /** 수업 개요의 묶음 (예: '2~3차시') */
  block: string;
  blockTitle: string;
  /** 이 차시에서 하는 일 (짧게) */
  title: string;
  /** 학생 화면에서 이 차시에 쓰는 활동 id */
  activities: ActivityId[];
  /** 교육과정 연계 */
  curriculum: CurriculumLink;
  /** 이 차시에서 특히 드러나는 AI 윤리원칙 */
  principleIds: PrincipleId[];
}

/** 학생 화면 활동 */
export type ActivityId =
  | 'guide' // 1차시 활동 안내
  | 'team' // 1차시 모둠·역할·약속·사건 고르기
  | 'explore' // 2차시 사건 파일 탐구 (챕터 시뮬레이션)
  | 'plan' // 2~3차시 기획서
  | 'review' // 3차시 기획서 동료 검토
  | 'create' // 4~5차시 창작 (스토리보드·진행·AI 활용 기록·출처)
  | 'submit' // 5차시 최종 점검·제출
  | 'gallery' // 6차시 발표·상호평가
  | 'declare'; // 6차시 개인 성찰·선언문·인증서

export type RoleId = 'leader' | 'historian' | 'ethicist' | 'creator' | 'presenter';

export interface TeamRole {
  id: RoleId;
  name: string;
  /** 하는 일 */
  tasks: string[];
  /** 이 역할이 특히 챙기는 원칙 */
  principleIds: PrincipleId[];
  /** 이런 친구에게 잘 맞아요 (강점 탐색 — K-SEL [9정서01-01]) */
  goodFor: string;
}

export type FormatId = 'shortform' | 'webtoon' | 'cardnews' | 'goods' | 'poster' | 'other';

export interface ContentFormat {
  id: FormatId;
  name: string;
  /** 권장 규격 */
  spec: string;
  /** 스토리보드 칸 이름 (예: 컷, 장면, 장) */
  unit: string;
  /** 스토리보드 권장 칸 수 */
  cuts: number;
  tools: string;
}

/** 윤리 점검 항목 — 원문의 이용자 역할에 근거 */
export interface EthicsCheck {
  id: string;
  principleId: PrincipleId;
  /** 원문 세부 항목 꼬리표 */
  aspectTag: string;
  /** 학생용 질문 */
  question: string;
  /** 근거가 되는 원문 문장 (이용자 역할) */
  basis: string;
}

/** 역사 정확성 점검 항목 (이 앱의 역사 콘텐츠 원칙) */
export interface HistoryCheck {
  id: string;
  question: string;
}

export interface RubricItem {
  id: 'ethics' | 'history' | 'creative' | 'delivery';
  name: string;
  description: string;
  /** 1~3 별의 뜻 */
  levels: [string, string, string];
}
