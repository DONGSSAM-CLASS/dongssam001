/**
 * Firestore 컬렉션 문서 타입. 규칙은 firestore.rules, 설계 근거는 docs/FIRESTORE_SCHEMA.md 참고.
 * Timestamp는 Firestore Timestamp 또는 serverTimestamp() 센티널이 들어간다.
 */
import type { Timestamp, FieldValue } from 'firebase/firestore';
import type { Subject } from './history';

export type TimestampField = Timestamp | FieldValue;
export type SchoolLevel = '중학교' | '고등학교';
export type Role = 'teacher' | 'student';

export interface TeacherUserDoc {
  role: 'teacher';
  displayName: string;
  email?: string;
  schoolLevel: SchoolLevel;
  schoolName: string;
  subjects: Subject[];
  createdAt: TimestampField;
  lastSeenAt?: TimestampField;
}

export interface StudentUserDoc {
  role: 'student';
  displayName: string;
  nickname?: string;
  classId: string;
  number: number;
  active: boolean;
  createdAt: TimestampField;
  lastSeenAt?: TimestampField;
}

export type UserDoc = TeacherUserDoc | StudentUserDoc;

export interface ClassSettings {
  /** 거리 환산 기준 — 교사 설정값 */
  walkKmPerDay: number;
  sailKmPerDay: number;
  horseKmPerDay: number;
}

export interface ClassDoc {
  teacherId: string;
  name: string;
  /** 현재 유효한 학급코드(재발급 가능) */
  code: string;
  /** 최초 학급코드. 학생 가상 이메일 접두어로 쓰이며 절대 바뀌지 않음 */
  authPrefix: string;
  schoolLevel: SchoolLevel;
  subject: Subject;
  archived: boolean;
  settings: ClassSettings;
  createdAt: TimestampField;
  codeUpdatedAt: TimestampField;
}

/** 문서 ID = 학급코드. 로그인 전 학생이 코드로 학급을 찾기 위한 공개 조회 문서 */
export interface ClassCodeDoc {
  classId: string;
  teacherId: string;
  authPrefix: string;
  active: boolean;
}

/** 문서 ID = `${classId}_${number}` */
export interface ClassMemberDoc {
  classId: string;
  number: number;
  /** 교사가 미리 등록한 자리는 null */
  uid: string | null;
  displayName: string;
  nickname?: string;
  active: boolean;
  /** 비밀번호 초기화 횟수. 가상 이메일 `${authPrefix}-${number}-${gen}@…` 의 gen과 일치 (0이면 접미 없음) */
  authGeneration: number;
  resetPending: boolean;
  joinedAt: TimestampField | null;
  lastSeenAt: TimestampField | null;
}

export type SessionStatus = 'draft' | 'open' | 'closed';
export type LayerKey = 'polities' | 'figures' | 'places' | 'routes' | 'modernBorders';

export interface CameraState {
  lat: number;
  lon: number;
  zoom: number;
}

export interface FollowState {
  enabled: boolean;
  year: number;
  camera: CameraState;
  updatedAt: TimestampField;
}

export interface WorksheetItem {
  id: string;
  kind: 'objective' | 'explore' | 'compare_table' | 'distance' | 'route' | 'essay' | 'self_check';
  prompt: string;
  /** 표·체크리스트 등 문항 유형별 부가 데이터 */
  payload?: Record<string, unknown>;
}

export interface SessionDoc {
  teacherId: string;
  classId: string;
  title: string;
  status: SessionStatus;
  yearRange: [number, number];
  /** 기본 연대(세션 시작 시 슬라이더 위치) */
  focusYear: number;
  layers: Record<LayerKey, boolean>;
  highlightPolities: string[];
  highlightFigures: string[];
  achievementStandards: string[];
  worksheet: WorksheetItem[];
  follow: FollowState;
  createdAt: TimestampField;
  updatedAt: TimestampField;
}

export interface Pin {
  id: string;
  name: string;
  lat: number;
  lon: number;
  /** 핀을 찍을 당시의 설정 연대 */
  year: number;
  memo: string;
  /** 연결된 기본 데이터 항목(선택) */
  refKind?: 'polity' | 'figure' | 'place' | 'event';
  refId?: string;
  createdAt: number;
}

export interface Route {
  id: string;
  title: string;
  description: string;
  pinIds: string[];
  totalKm: number;
  createdAt: number;
}

/** 문서 ID = `${sessionId}_${number}` — 학생 1명 = 세션당 문서 1개 */
export interface StudentWorkDoc {
  sessionId: string;
  classId: string;
  number: number;
  uid: string;
  pins: Pin[];
  routes: Route[];
  updatedAt: TimestampField;
}

export interface MissionRequirement {
  id: string;
  text: string;
  /** 자동 점검 규칙(선택): 예) 대륙별 핀 1개 이상 */
  check?: { type: 'min_pins' | 'min_routes' | 'pins_in_regions'; value: number; regions?: string[] };
}

export interface MissionDoc {
  teacherId: string;
  classId: string;
  sessionId: string;
  title: string;
  description: string;
  requirements: MissionRequirement[];
  published: boolean;
  dueAt: TimestampField | null;
  createdAt: TimestampField;
}

/** 문서 ID = `${missionId}_${number}` */
export interface SubmissionDoc {
  missionId: string;
  sessionId: string;
  classId: string;
  number: number;
  uid: string;
  answers: Record<string, string>;
  pinIds: string[];
  routeIds: string[];
  status: 'draft' | 'submitted';
  submittedAt: TimestampField | null;
  updatedAt: TimestampField;
  feedback?: string;
  score?: number;
  reviewedAt?: TimestampField;
}

export type OverrideKind = 'polity' | 'figure' | 'place';

/** 문서 ID = `${teacherId}_${kind}_${targetId}` */
export interface TeacherOverrideDoc {
  teacherId: string;
  kind: OverrideKind;
  targetId: string;
  op: 'add' | 'edit' | 'hide';
  data: Record<string, unknown>;
  updatedAt: TimestampField;
}

export interface AdminDoc {
  grantedBy: string;
  createdAt: TimestampField;
}

export type ReviewStatus = 'pending' | 'approved' | 'needs_fix';

/** 문서 ID = `${kind}_${itemId}` */
export interface DataReviewDoc {
  kind: 'polity' | 'figure' | 'place' | 'event' | 'standard';
  itemId: string;
  status: ReviewStatus;
  note: string;
  reviewerUid: string;
  updatedAt: TimestampField;
  history: { status: ReviewStatus; note: string; reviewerUid: string; at: number }[];
}
