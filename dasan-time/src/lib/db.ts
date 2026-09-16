/**
 * Firestore 데이터 통로. localDb.ts 와 같은 인터페이스(DataApi)를 쓴다.
 * 교사 전용 읽기 함수는 아래쪽에 따로 모아 두었다.
 */
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  writeBatch,
} from 'firebase/firestore';
import { db } from './firebase';
import { clampField, DEFAULT_SESSIONS, emptyGroupBoard, MAX_FIELD_LENGTH } from './defaults';
import { generateClassCode } from './code';
import type {
  ClassDoc,
  DataApi,
  EmotionEntry,
  Evaluation,
  GalleryItem,
  GroupBoard,
  PassCardData,
  StudentProfile,
  Submission,
  SubmissionStatus,
  TeacherProfile,
  VoteDoc,
} from './types';
import type { ActivityId, SessionKey } from '../content/lessons';
import type { SessionState } from './types';

/* ------------------------------------------------------------------ */
/* 경로 도우미                                                          */
/* ------------------------------------------------------------------ */

const classPath = (classId: string) => doc(db(), 'classes', classId);
const studentsPath = (classId: string) => collection(db(), 'classes', classId, 'students');
const submissionsPath = (classId: string) => collection(db(), 'classes', classId, 'submissions');
const evalsPath = (classId: string) => collection(db(), 'classes', classId, 'evals');
const emotionsPath = (classId: string) => collection(db(), 'classes', classId, 'emotions');
const boardsPath = (classId: string) => collection(db(), 'classes', classId, 'groupBoards');
const galleryPath = (classId: string) => collection(db(), 'classes', classId, 'gallery');
const votesPath = (classId: string) => collection(db(), 'classes', classId, 'votes');

function toMillis(value: unknown): number {
  if (value && typeof value === 'object' && 'toMillis' in value) {
    return (value as { toMillis(): number }).toMillis();
  }
  return typeof value === 'number' ? value : 0;
}

/** 저장 직전에 한 칸 500자 제한을 건다. 보안 규칙에서도 같은 값을 확인한다. */
function sanitizeData(data: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(data)) {
    if (typeof value === 'string') out[key] = clampField(value);
    else if (Array.isArray(value)) {
      out[key] = value.map((v) => (typeof v === 'string' ? clampField(v) : v));
    } else if (value && typeof value === 'object') {
      out[key] = sanitizeData(value as Record<string, unknown>);
    } else if (value !== undefined) {
      out[key] = value;
    }
  }
  return out;
}

/* ------------------------------------------------------------------ */
/* 문서 변환                                                            */
/* ------------------------------------------------------------------ */

function asClassDoc(id: string, raw: Record<string, unknown>): ClassDoc {
  return {
    id,
    teacherUid: String(raw.teacherUid ?? ''),
    name: String(raw.name ?? ''),
    code: String(raw.code ?? ''),
    school: String(raw.school ?? ''),
    teacherName: String(raw.teacherName ?? ''),
    sessions: { ...DEFAULT_SESSIONS, ...(raw.sessions as Record<SessionKey, SessionState>) },
    editLocked: Boolean(raw.editLocked),
    commonTime: (raw.commonTime as ClassDoc['commonTime']) ?? null,
    voteClosed: Boolean(raw.voteClosed),
    statNote: (raw.statNote as ClassDoc['statNote']) ?? null,
    createdAt: toMillis(raw.createdAt),
  };
}

function asSubmission(id: string, raw: Record<string, unknown>): Submission {
  return {
    id,
    ownerUid: String(raw.ownerUid ?? ''),
    activityId: raw.activityId as ActivityId,
    data: (raw.data as Record<string, unknown>) ?? {},
    status: (raw.status as SubmissionStatus) ?? 'draft',
    updatedAt: toMillis(raw.updatedAt),
    praise: typeof raw.praise === 'string' ? raw.praise : undefined,
  };
}

function asGroupBoard(id: string, raw: Record<string, unknown>): GroupBoard {
  return {
    id,
    activityId: raw.activityId as ActivityId,
    group: Number(raw.group ?? 0),
    cells: (raw.cells as Record<string, string>) ?? {},
    notes: (raw.notes as GroupBoard['notes']) ?? [],
    lastEditor: String(raw.lastEditor ?? ''),
    updatedAt: toMillis(raw.updatedAt),
  };
}

function asGalleryItem(id: string, raw: Record<string, unknown>): GalleryItem {
  return {
    id,
    alias: String(raw.alias ?? ''),
    card: (raw.card as PassCardData) ?? ({} as PassCardData),
    visible: raw.visible !== false,
    updatedAt: toMillis(raw.updatedAt),
  };
}

/* ------------------------------------------------------------------ */
/* 학생용 DataApi                                                       */
/* ------------------------------------------------------------------ */

export function createFirestoreDb(classId: string, uid: string): DataApi {
  return {
    mode: 'firestore',
    uid,

    async getClass() {
      const snap = await getDoc(classPath(classId));
      if (!snap.exists()) throw new Error('학급을 찾지 못했어요.');
      return asClassDoc(snap.id, snap.data());
    },
    watchClass(cb) {
      return onSnapshot(classPath(classId), (snap) => {
        if (snap.exists()) cb(asClassDoc(snap.id, snap.data()));
      });
    },

    async getSubmission(activityId, ownerUid) {
      const owner = ownerUid ?? uid;
      const snap = await getDoc(doc(submissionsPath(classId), `${owner}_${activityId}`));
      return snap.exists() ? asSubmission(snap.id, snap.data()) : null;
    },

    async listMySubmissions() {
      const snap = await getDocs(query(submissionsPath(classId), where('ownerUid', '==', uid)));
      return snap.docs.map((d) => asSubmission(d.id, d.data()));
    },

    async saveSubmission(activityId, data, status) {
      await setDoc(
        doc(submissionsPath(classId), `${uid}_${activityId}`),
        {
          ownerUid: uid,
          activityId,
          data: sanitizeData(data),
          status,
          updatedAt: serverTimestamp(),
        },
        { merge: true },
      );
    },

    watchMySubmissions(cb) {
      return onSnapshot(query(submissionsPath(classId), where('ownerUid', '==', uid)), (snap) => {
        cb(snap.docs.map((d) => asSubmission(d.id, d.data())));
      });
    },

    async addEmotions(words) {
      // 누가 골랐는지 저장하지 않는다. 학급 감정 지도는 이름 없이 모으는 화면이다.
      await Promise.all(
        words
          .filter((w) => w.trim())
          .map((word) =>
            addDoc(emotionsPath(classId), {
              word: clampField(word.trim()),
              createdAt: serverTimestamp(),
              hidden: false,
            }),
          ),
      );
    },

    watchEmotions(cb) {
      return onSnapshot(query(emotionsPath(classId), limit(500)), (snap) => {
        const items: EmotionEntry[] = snap.docs.map((d) => ({
          id: d.id,
          word: String(d.data().word ?? ''),
          createdAt: toMillis(d.data().createdAt),
          hidden: Boolean(d.data().hidden),
        }));
        cb(items);
      });
    },

    watchGroupBoard(activityId, groupNo, cb) {
      const id = `${activityId}_${groupNo}`;
      return onSnapshot(doc(boardsPath(classId), id), (snap) => {
        cb(snap.exists() ? asGroupBoard(snap.id, snap.data()) : emptyGroupBoard(activityId, groupNo));
      });
    },

    async saveGroupBoard(activityId, groupNo, patch, editorName) {
      const payload: Record<string, unknown> = {
        activityId,
        group: groupNo,
        lastEditor: clampField(editorName),
        updatedAt: serverTimestamp(),
      };
      if (patch.cells) payload.cells = sanitizeData(patch.cells);
      if (patch.notes) {
        payload.notes = patch.notes.slice(0, 40).map((n) => ({
          id: n.id,
          text: clampField(n.text),
          author: clampField(n.author),
        }));
      }
      await setDoc(doc(boardsPath(classId), `${activityId}_${groupNo}`), payload, { merge: true });
    },

    watchGallery(cb) {
      return onSnapshot(query(galleryPath(classId), where('visible', '==', true)), (snap) => {
        cb(snap.docs.map((d) => asGalleryItem(d.id, d.data())));
      });
    },

    async saveGalleryItem(card, visible, alias) {
      await setDoc(
        doc(galleryPath(classId), uid),
        {
          alias: clampField(alias),
          card: sanitizeData(card as unknown as Record<string, unknown>),
          visible,
          updatedAt: serverTimestamp(),
        },
        { merge: true },
      );
    },

    async getMyVote() {
      const snap = await getDoc(doc(votesPath(classId), uid));
      if (!snap.exists()) return null;
      const raw = snap.data();
      return {
        id: snap.id,
        picks: (raw.picks as string[]) ?? [],
        reason: String(raw.reason ?? ''),
        updatedAt: toMillis(raw.updatedAt),
      } satisfies VoteDoc;
    },

    async saveVote(picks, reason) {
      await setDoc(doc(votesPath(classId), uid), {
        picks: picks.slice(0, 2),
        reason: clampField(reason),
        updatedAt: serverTimestamp(),
      });
    },
  };
}

/* ------------------------------------------------------------------ */
/* 교사 전용                                                            */
/* ------------------------------------------------------------------ */

export async function createTeacherProfile(profile: Omit<TeacherProfile, 'createdAt'>) {
  const batch = writeBatch(db());
  batch.set(doc(db(), 'users', profile.uid), {
    role: 'teacher',
    displayName: profile.name,
    createdAt: serverTimestamp(),
  });
  batch.set(doc(db(), 'teachers', profile.uid), {
    school: profile.school,
    name: profile.name,
    subject: profile.subject,
    email: profile.email,
    createdAt: serverTimestamp(),
  });
  await batch.commit();
}

export async function getTeacherProfile(uid: string): Promise<TeacherProfile | null> {
  const snap = await getDoc(doc(db(), 'teachers', uid));
  if (!snap.exists()) return null;
  const raw = snap.data();
  return {
    uid,
    school: String(raw.school ?? ''),
    name: String(raw.name ?? ''),
    subject: String(raw.subject ?? ''),
    email: String(raw.email ?? ''),
    createdAt: toMillis(raw.createdAt),
  };
}

export async function getUserRole(uid: string): Promise<'teacher' | 'student' | null> {
  const snap = await getDoc(doc(db(), 'users', uid));
  if (!snap.exists()) return null;
  const role = snap.data().role;
  return role === 'teacher' || role === 'student' ? role : null;
}

/**
 * 중복되지 않는 학급 코드를 찾을 때까지 다시 뽑는다.
 *
 * 학급 이름과 교사 이름을 이 문서에 함께 적어 둔다.
 * 학생은 가입하기 전(= 로그인 전)에 "○○ 선생님의 3학년 2반이 맞나요?" 화면을 봐야 하는데,
 * 그때는 classes/{id} 문서를 읽을 권한이 없기 때문이다.
 */
async function reserveClassCode(
  classId: string,
  teacherUid: string,
  className: string,
  teacherName: string,
): Promise<string> {
  for (let attempt = 0; attempt < 12; attempt += 1) {
    const code = generateClassCode();
    const ref = doc(db(), 'classCodes', code);
    const existing = await getDoc(ref);
    if (existing.exists()) continue;
    await setDoc(ref, { classId, teacherUid, className, teacherName, joinOpen: true });
    return code;
  }
  throw new Error('학급 코드를 만들지 못했어요. 잠시 뒤 다시 해 주세요.');
}

export async function createClass(
  teacher: TeacherProfile,
  className: string,
): Promise<ClassDoc> {
  const ref = doc(collection(db(), 'classes'));
  const code = await reserveClassCode(ref.id, teacher.uid, className, teacher.name);
  const payload = {
    teacherUid: teacher.uid,
    name: className,
    code,
    school: teacher.school,
    teacherName: teacher.name,
    sessions: DEFAULT_SESSIONS,
    editLocked: false,
    commonTime: null,
    voteClosed: false,
    statNote: null,
    createdAt: serverTimestamp(),
  };
  await setDoc(ref, payload);
  return asClassDoc(ref.id, payload);
}

export async function listTeacherClasses(teacherUid: string): Promise<ClassDoc[]> {
  const snap = await getDocs(
    query(collection(db(), 'classes'), where('teacherUid', '==', teacherUid)),
  );
  return snap.docs
    .map((d) => asClassDoc(d.id, d.data()))
    .sort((a, b) => a.createdAt - b.createdAt);
}

export function watchTeacherClasses(teacherUid: string, cb: (items: ClassDoc[]) => void) {
  return onSnapshot(
    query(collection(db(), 'classes'), where('teacherUid', '==', teacherUid)),
    (snap) => cb(snap.docs.map((d) => asClassDoc(d.id, d.data())).sort((a, b) => a.createdAt - b.createdAt)),
  );
}

export function watchClassDoc(classId: string, cb: (doc: ClassDoc) => void) {
  return onSnapshot(classPath(classId), (snap) => {
    if (snap.exists()) cb(asClassDoc(snap.id, snap.data()));
  });
}

export async function updateClass(classId: string, patch: Record<string, unknown>) {
  await updateDoc(classPath(classId), patch);
}

export async function setSessionState(classId: string, key: SessionKey, state: SessionState) {
  await updateDoc(classPath(classId), { [`sessions.${key}`]: state });
}

/** 학급 코드 재발급. 이전 코드는 지워서 더 이상 쓸 수 없게 한다. */
export async function reissueClassCode(cls: ClassDoc): Promise<string> {
  const next = await reserveClassCode(cls.id, cls.teacherUid, cls.name, cls.teacherName);
  if (cls.code) {
    await deleteDoc(doc(db(), 'classCodes', cls.code)).catch(() => {
      // 이미 지워졌으면 그냥 넘어간다.
    });
  }
  await updateDoc(classPath(cls.id), { code: next });
  return next;
}

export async function setJoinOpen(code: string, joinOpen: boolean) {
  await updateDoc(doc(db(), 'classCodes', code), { joinOpen });
}

export interface ClassCodeEntry {
  classId: string;
  teacherUid: string;
  className: string;
  teacherName: string;
  joinOpen: boolean;
}

export async function lookupClassCode(code: string): Promise<ClassCodeEntry | null> {
  const snap = await getDoc(doc(db(), 'classCodes', code));
  if (!snap.exists()) return null;
  const raw = snap.data();
  return {
    classId: String(raw.classId ?? ''),
    teacherUid: String(raw.teacherUid ?? ''),
    className: String(raw.className ?? ''),
    teacherName: String(raw.teacherName ?? ''),
    joinOpen: raw.joinOpen !== false,
  };
}

export async function getClassById(classId: string): Promise<ClassDoc | null> {
  const snap = await getDoc(classPath(classId));
  return snap.exists() ? asClassDoc(snap.id, snap.data()) : null;
}

/* --- 학생 명단 --- */

function asStudent(id: string, raw: Record<string, unknown>): StudentProfile {
  return {
    uid: id,
    name: String(raw.name ?? ''),
    number: Number(raw.number ?? 0),
    loginId: String(raw.loginId ?? ''),
    group: raw.group === null || raw.group === undefined ? null : Number(raw.group),
    joinedAt: toMillis(raw.joinedAt),
    active: raw.active !== false,
  };
}

export async function createStudentProfile(
  classId: string,
  student: Omit<StudentProfile, 'joinedAt'>,
) {
  const batch = writeBatch(db());
  batch.set(doc(db(), 'users', student.uid), {
    role: 'student',
    displayName: student.name,
    classId,
    createdAt: serverTimestamp(),
  });
  batch.set(doc(studentsPath(classId), student.uid), {
    name: student.name,
    number: student.number,
    loginId: student.loginId,
    group: student.group,
    joinedAt: serverTimestamp(),
    active: true,
  });
  await batch.commit();
}

export async function getStudentProfile(
  classId: string,
  uid: string,
): Promise<StudentProfile | null> {
  const snap = await getDoc(doc(studentsPath(classId), uid));
  return snap.exists() ? asStudent(snap.id, snap.data()) : null;
}

export async function getStudentClassId(uid: string): Promise<string | null> {
  const snap = await getDoc(doc(db(), 'users', uid));
  if (!snap.exists()) return null;
  const classId = snap.data().classId;
  return typeof classId === 'string' ? classId : null;
}

export function watchStudents(classId: string, cb: (items: StudentProfile[]) => void) {
  return onSnapshot(query(studentsPath(classId), orderBy('number')), (snap) =>
    cb(snap.docs.map((d) => asStudent(d.id, d.data()))),
  );
}

export async function listStudents(classId: string): Promise<StudentProfile[]> {
  const snap = await getDocs(query(studentsPath(classId), orderBy('number')));
  return snap.docs.map((d) => asStudent(d.id, d.data()));
}

/**
 * 번호 자리를 잡아 둔다.
 *
 * 학생은 가입할 때 학급 명단을 읽을 권한이 없다(다른 학생 이름이 새면 안 되므로).
 * 그래서 번호마다 문서를 하나 만들어 두고, 이미 있으면 만들기가 실패하게 한다.
 * 먼저 읽고 나중에 쓰는 방식과 달리, 같은 순간에 두 명이 같은 번호를 잡는 일이 없다.
 */
export async function claimNumber(classId: string, number: number, uid: string): Promise<void> {
  try {
    await setDoc(doc(db(), 'classes', classId, 'numbers', String(number)), { uid });
  } catch {
    throw new Error(`${number}번은 이미 가입했어요. 번호를 다시 확인해 볼까요?`);
  }
}

/** 교사가 학생을 내보낼 때 번호 자리를 비워 준다. */
export async function releaseNumber(classId: string, number: number): Promise<void> {
  await deleteDoc(doc(db(), 'classes', classId, 'numbers', String(number))).catch(() => {
    // 이미 없으면 그냥 넘어간다.
  });
}

export async function updateStudent(
  classId: string,
  uid: string,
  patch: Partial<Pick<StudentProfile, 'name' | 'number' | 'group' | 'active'>>,
) {
  await updateDoc(doc(studentsPath(classId), uid), patch);
}

/**
 * 계정 재연결 — 비밀번호를 잊은 학생이 새 아이디로 다시 가입한 뒤,
 * 이전 계정의 결과물을 새 계정으로 옮긴다.
 */
export async function transferSubmissions(classId: string, fromUid: string, toUid: string) {
  const snap = await getDocs(query(submissionsPath(classId), where('ownerUid', '==', fromUid)));
  const batch = writeBatch(db());
  snap.docs.forEach((d) => {
    const raw = d.data();
    batch.set(doc(submissionsPath(classId), `${toUid}_${raw.activityId}`), {
      ...raw,
      ownerUid: toUid,
      updatedAt: serverTimestamp(),
    });
    batch.delete(d.ref);
  });
  await batch.commit();
}

/* --- 교사의 결과물 열람 --- */

export function watchAllSubmissions(classId: string, cb: (items: Submission[]) => void) {
  return onSnapshot(submissionsPath(classId), (snap) =>
    cb(snap.docs.map((d) => asSubmission(d.id, d.data()))),
  );
}

export async function listAllSubmissions(classId: string): Promise<Submission[]> {
  const snap = await getDocs(submissionsPath(classId));
  return snap.docs.map((d) => asSubmission(d.id, d.data()));
}

export async function savePraise(classId: string, uid: string, activityId: ActivityId, praise: string) {
  await setDoc(
    doc(submissionsPath(classId), `${uid}_${activityId}`),
    { praise: clampField(praise) },
    { merge: true },
  );
}

/* --- 교사 평가 (학생이 읽을 수 없는 별도 컬렉션) --- */

export async function saveEvaluation(
  classId: string,
  uid: string,
  activityId: ActivityId,
  grade: Evaluation['grade'],
  memo: string,
) {
  await setDoc(doc(evalsPath(classId), `${uid}_${activityId}`), {
    ownerUid: uid,
    activityId,
    grade,
    memo: clampField(memo),
    updatedAt: serverTimestamp(),
  });
}

export async function listEvaluations(classId: string): Promise<Evaluation[]> {
  const snap = await getDocs(evalsPath(classId));
  return snap.docs.map((d) => {
    const raw = d.data();
    return {
      id: d.id,
      ownerUid: String(raw.ownerUid ?? ''),
      activityId: raw.activityId as ActivityId,
      grade: (raw.grade as Evaluation['grade']) ?? '',
      memo: String(raw.memo ?? ''),
      updatedAt: toMillis(raw.updatedAt),
    };
  });
}

export function watchEvaluations(classId: string, cb: (items: Evaluation[]) => void) {
  return onSnapshot(evalsPath(classId), (snap) =>
    cb(
      snap.docs.map((d) => {
        const raw = d.data();
        return {
          id: d.id,
          ownerUid: String(raw.ownerUid ?? ''),
          activityId: raw.activityId as ActivityId,
          grade: (raw.grade as Evaluation['grade']) ?? '',
          memo: String(raw.memo ?? ''),
          updatedAt: toMillis(raw.updatedAt),
        };
      }),
    ),
  );
}

/* --- 교사의 학급 공유 화면 --- */

export function watchAllEmotions(classId: string, cb: (items: EmotionEntry[]) => void) {
  return onSnapshot(query(emotionsPath(classId), limit(500)), (snap) =>
    cb(
      snap.docs.map((d) => ({
        id: d.id,
        word: String(d.data().word ?? ''),
        createdAt: toMillis(d.data().createdAt),
        hidden: Boolean(d.data().hidden),
      })),
    ),
  );
}

export async function hideEmotion(classId: string, id: string, hidden: boolean) {
  await updateDoc(doc(emotionsPath(classId), id), { hidden });
}

export function watchAllGallery(classId: string, cb: (items: GalleryItem[]) => void) {
  return onSnapshot(galleryPath(classId), (snap) =>
    cb(snap.docs.map((d) => asGalleryItem(d.id, d.data()))),
  );
}

export function watchAllBoards(classId: string, cb: (items: GroupBoard[]) => void) {
  return onSnapshot(boardsPath(classId), (snap) =>
    cb(snap.docs.map((d) => asGroupBoard(d.id, d.data()))),
  );
}

export function watchAllVotes(classId: string, cb: (items: VoteDoc[]) => void) {
  return onSnapshot(votesPath(classId), (snap) =>
    cb(
      snap.docs.map((d) => ({
        id: d.id,
        picks: (d.data().picks as string[]) ?? [],
        reason: String(d.data().reason ?? ''),
        updatedAt: toMillis(d.data().updatedAt),
      })),
    ),
  );
}

export { MAX_FIELD_LENGTH };
