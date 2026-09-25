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

export interface Principle {
  id: PrincipleId;
  name: string;
  icon: string;
  /** 카드 색 (hex) */
  color: string;
  /** 학생용 설명 */
  description: string;
  /** 냉전 연결 한 줄 */
  coldWarLink: string;
  chapter: ChapterId;
}

export interface CoreValue {
  id: ValueId;
  name: string;
  icon: string;
  description: string;
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
  session: 1 | 2 | 3;
  chapter: ChapterId;
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
   * 'emotionTable'  장면 1~5 감정·선택 기록표 (장면 제목은 scenarios.ts 에서 가져옴)
   * 'appReflection' 앱의 AI 시대 연결 질문 (scenarios.ts 에서 가져옴 — 문장을 두 번 쓰지 않기 위해)
   * 'questions'     질문 목록 + 쓰기 칸
   * 'lines'         쓰기 줄만
   * 'checklist'     체크 목록
   * 'selfAssessment' 자기 평가 (items 마다 ☆☆☆ 세 단계 표시)
   */
  type: 'emotionTable' | 'appReflection' | 'questions' | 'lines' | 'checklist' | 'selfAssessment';
  items?: string[];
  lines?: number;
  /** 'emotionTable' 의 열 제목 (장면 열 다음에 붙는다) */
  columns?: string[];
}

export interface Worksheet {
  session: 1 | 2 | 3;
  chapter: ChapterId;
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
