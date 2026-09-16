import type { ActivityId, PassColorId, SessionKey } from '../content/lessons';

export type Role = 'teacher' | 'student';

export type SessionState = 'locked' | 'open' | 'closed';

export interface TeacherProfile {
  uid: string;
  school: string;
  name: string;
  subject: string;
  email: string;
  createdAt: number;
}

export interface StudentProfile {
  uid: string;
  name: string;
  number: number;
  loginId: string;
  group: number | null;
  joinedAt: number;
  active: boolean;
}

export interface ClassDoc {
  id: string;
  teacherUid: string;
  name: string;
  code: string;
  school: string;
  teacherName: string;
  sessions: Record<SessionKey, SessionState>;
  editLocked: boolean;
  commonTime: { start: string; end: string } | null;
  voteClosed: boolean;
  /** 도입 화면에 보여 줄 통계 카드. 비어 있으면 카드를 숨긴다. */
  statNote: { text: string; source: string; period: string } | null;
  createdAt: number;
}

export type SubmissionStatus = 'draft' | 'submitted';

export interface Submission {
  id: string;
  ownerUid: string;
  activityId: ActivityId;
  data: Record<string, unknown>;
  status: SubmissionStatus;
  updatedAt: number;
  /** 교사가 쓰고 학생이 읽는 칭찬 한 줄 */
  praise?: string;
}

/** 교사 전용. 학생은 읽을 수 없도록 별도 컬렉션에 저장한다. */
export interface Evaluation {
  id: string;
  ownerUid: string;
  activityId: ActivityId;
  grade: '상' | '중' | '하' | '';
  memo: string;
  updatedAt: number;
}

export interface EmotionEntry {
  id: string;
  word: string;
  createdAt: number;
  hidden: boolean;
}

export interface GroupBoard {
  id: string;
  activityId: ActivityId;
  group: number;
  /** 활동 4-1 비교표처럼 칸이 정해진 경우 */
  cells: Record<string, string>;
  /** 활동 3 붙임쪽지처럼 자유롭게 늘어나는 경우 */
  notes: { id: string; text: string; author: string }[];
  lastEditor: string;
  updatedAt: number;
}

export interface PassCardData {
  app: string;
  time: string;
  alt: string;
  pledge: string;
  color: PassColorId;
  sticker: string;
  /** 4주 실천 중 규칙을 바꾸면 true */
  revised?: boolean;
  revisedNote?: string;
}

export interface GalleryItem {
  id: string;
  alias: string;
  card: PassCardData;
  visible: boolean;
  updatedAt: number;
}

export interface VoteDoc {
  id: string;
  picks: string[];
  reason: string;
  updatedAt: number;
}

/** 화면 코드가 쓰는 데이터 통로. 체험 모드와 실제 모드가 같은 모양을 쓴다. */
export interface DataApi {
  readonly mode: 'firestore' | 'local';
  /** 지금 사용자 uid (체험 모드는 'trial') */
  readonly uid: string;

  getClass(): Promise<ClassDoc>;
  watchClass(cb: (doc: ClassDoc) => void): () => void;

  getSubmission(activityId: ActivityId, ownerUid?: string): Promise<Submission | null>;
  listMySubmissions(): Promise<Submission[]>;
  saveSubmission(
    activityId: ActivityId,
    data: Record<string, unknown>,
    status: SubmissionStatus,
  ): Promise<void>;
  watchMySubmissions(cb: (items: Submission[]) => void): () => void;

  addEmotions(words: string[]): Promise<void>;
  watchEmotions(cb: (items: EmotionEntry[]) => void): () => void;

  watchGroupBoard(activityId: ActivityId, group: number, cb: (b: GroupBoard) => void): () => void;
  saveGroupBoard(
    activityId: ActivityId,
    group: number,
    patch: Partial<Pick<GroupBoard, 'cells' | 'notes'>>,
    editorName: string,
  ): Promise<void>;

  watchGallery(cb: (items: GalleryItem[]) => void): () => void;
  saveGalleryItem(card: PassCardData, visible: boolean, alias: string): Promise<void>;

  getMyVote(): Promise<VoteDoc | null>;
  saveVote(picks: string[], reason: string): Promise<void>;
}
