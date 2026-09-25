/**
 * Firestore 문서 타입. 구조 설명은 docs/data-model.md 에 있다.
 * 필드를 바꾸면 firestore.rules 의 검증 함수도 함께 바꿔야 한다.
 */
import type { Timestamp } from 'firebase/firestore';
import type { ChapterId, EmotionId, FormatId, PrincipleId, RoleId, SessionNo, ValueId } from './content';
import type { PlanField, StageId } from '../data/project';

/** 챕터 안에서 학생이 어디까지 왔는지 (장면 단위 자동 저장) */
export type ChapterStep = 'intro' | 's1' | 's2' | 's3' | 's4' | 's5' | 'reflect' | 'wrapup' | 'done';

export type ChoiceId = 'a' | 'b' | 'c';

/** 문서 id 를 함께 들고 다니는 학생 기록 */
export interface StudentRecord extends StudentDoc {
  id: string;
}

export interface ClassRecord extends ClassDoc {
  id: string;
}

/** classes/{classId} — 교사가 만든 학급 */
export interface ClassDoc {
  name: string; // 1~30자
  code: string; // 6자리 학급 코드
  teacherUid: string;
  /** 지금 차시 (1~6). 학생 화면은 이 차시까지의 활동을 연다 */
  session: SessionNo;
  /** 모둠 수 (0~8). groups/g1 ~ g{groupCount} 가 쓰인다 */
  groupCount: number;
  /** 학생 화면에 학급 선택 분포를 보여 줄지 */
  showDistribution: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

/** classCodes/{code} — 학급 코드 → 학급 id 조회용 (한 건씩 get 만 허용, 목록 조회 금지) */
export interface ClassCodeDoc {
  classId: string;
  className: string;
  teacherUid: string;
  createdAt: Timestamp;
}

/** classes/{classId}/members/{uid} — 이 익명 계정이 어느 학생 기록을 쓰는지 (학급 문서 읽기 권한 확인용) */
export interface MemberDoc {
  studentId: string;
  number: number;
  joinedAt: Timestamp;
}

/** classes/{classId}/seats/{number} — 번호 자리. 같은 번호로 두 명이 들어오지 못하게 한다. (교사만 읽음) */
export interface SeatDoc {
  studentId: string;
}

/** 선언문 */
export interface Declaration {
  /** "나는 AI를 사용할 때 ___을(를) 지키겠습니다." (1~30자) */
  keep: string;
  /** 고른 원칙 (선택) */
  principleId: PrincipleId | null;
  /** "냉전 시대의 ___에서" (1~40자) */
  era: string;
  /** "___을(를) 배웠기 때문입니다." (1~80자) */
  lesson: string;
  /** 자유 서술 (0~300자) */
  free: string;
  submittedAt: Timestamp;
}

/**
 * classes/{classId}/students/{studentId} — 학생 한 명의 모든 기록.
 * 문서 id = SHA-256(앱 salt : classId : number : PIN) 16진수 64자. (PIN 을 알아야 주소를 알 수 있다)
 * uid 는 지금 이 기록을 쓰는 익명 계정. 기기가 바뀌면 PIN 으로 문서 주소를 다시 계산해 uid 를 옮긴다.
 */
export interface StudentDoc {
  uid: string;
  number: number; // 1~99
  nickname: string; // 1~10자
  /** 모둠 번호 (0 = 아직 모둠 없음, 1~8) */
  groupNo: number;
  progress: Partial<Record<ChapterId, ChapterStep>>;
  /** 장면 id('ch1-s1') → 선택 */
  choices: Record<string, ChoiceId>;
  /** 장면 id → 감정 */
  emotions: Record<string, EmotionId>;
  /** 성찰 문항 id('ch1-q1', 'ch1-wrap') → 답변 (최대 500자) */
  answers: Record<string, string>;
  /** 획득한 원칙 카드 */
  cards: PrincipleId[];
  declaration: Declaration | null;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

/**
 * classes/{classId}/public/stats — 학급 선택 분포 (숫자만, 개인 정보 없음).
 * 교사 대시보드가 계산해서 써 넣고, showDistribution 이 켜져 있을 때만 학생이 읽는다.
 */
export interface StatsDoc {
  /** 장면 id → { a: 3, b: 10, c: 2 } */
  choices: Record<string, Partial<Record<ChoiceId, number>>>;
  updatedAt: Timestamp;
}

/** classes/{classId}/teacherOnly/highlights — 교사가 고른 우수 답변 (학생은 읽을 수 없음) */
export interface HighlightsDoc {
  /** '번호:문항id' → true (예: '7:ch1-q1', '7:declaration') */
  items: Record<string, true>;
  updatedAt: Timestamp;
}

/* ───────────────────── 6차시 모둠 프로젝트 ───────────────────── */

/** 모둠 명단 한 칸 (키 = 학생 번호 문자열) */
export interface GroupMember {
  nickname: string;
  roles: RoleId[];
}

/** 기획서 (2~3차시) */
export type PlanText = Record<PlanField['id'], string>;
export interface GroupPlan extends PlanText {
  format: FormatId | null;
  /** format 이 other 일 때 (0~20자) */
  formatOther: string;
  /** 근거 사실 카드 (최대 3) */
  factIds: string[];
  /** 중심 원칙 (최대 2) */
  principleIds: PrincipleId[];
  /** 원칙의 세부 항목 태그 (최대 3) */
  aspectTags: string[];
  /** 3대 가치 (최대 3) */
  valueIds: ValueId[];
}

export type PlanStatus = 'draft' | 'submitted' | 'approved' | 'revise';

export interface AiLog {
  tools: string;
  where: string;
  human: string;
  label: string;
}

export interface Submission {
  /** https 로 시작하는 작품 링크 */
  url: string;
  intro: string;
  note: string;
  submittedAt: Timestamp;
}

export type CutId = 'c1' | 'c2' | 'c3' | 'c4' | 'c5' | 'c6' | 'c7' | 'c8';

/** classes/{classId}/groups/g{no} — 모둠 하나의 공동 기록 */
export interface GroupDoc {
  no: number;
  name: string; // 0~12자
  caseId: ChapterId | null;
  pledge: string; // 0~200자
  members: Record<string, GroupMember>;
  plan: GroupPlan;
  /** 기획 단계 윤리·역사 점검 (3차시) */
  planChecks: Record<string, boolean>;
  /** 완성 단계 최종 점검 (5차시) */
  finalChecks: Record<string, boolean>;
  planStatus: PlanStatus;
  /** 교사 의견 (0~300자) */
  teacherComment: string;
  storyboard: Partial<Record<CutId, string>>;
  stage: StageId;
  aiLog: AiLog;
  /** 출처 (0~500자) */
  sources: string;
  submission: Submission | null;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface GroupRecord extends GroupDoc {
  id: string;
}

/** classes/{classId}/reviews/plan_g{from}_g{to} — 기획서 동료 검토 (3차시) */
export interface PlanReviewDoc {
  kind: 'plan';
  fromGroup: number;
  toGroup: number;
  praise: string; // 0~200
  suggest: string; // 0~200
  ethics: string; // 0~200
  authorNumber: number;
  updatedAt: Timestamp;
}

export type RubricScores = Record<'ethics' | 'history' | 'creative' | 'delivery', 1 | 2 | 3>;

/** classes/{classId}/reviews/final_g{to}_n{number} — 발표 평가 (6차시) */
export interface FinalReviewDoc {
  kind: 'final';
  toGroup: number;
  scores: RubricScores;
  praise: string; // 0~150
  suggest: string; // 0~150
  authorNumber: number;
  updatedAt: Timestamp;
}

export type ReviewDoc = PlanReviewDoc | FinalReviewDoc;
export type ReviewRecord = ReviewDoc & { id: string };
