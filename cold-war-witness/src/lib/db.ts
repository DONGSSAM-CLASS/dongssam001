/**
 * Firestore 읽기·쓰기를 모두 이 파일에 모았다. 구조 설명: docs/data-model.md
 * 보안 규칙(firestore.rules)이 여기서 보내는 모양을 그대로 검증한다.
 */
import {
  arrayUnion,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  query,
  runTransaction,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  writeBatch,
  type DocumentReference,
  type Unsubscribe,
} from 'firebase/firestore';
import { db } from './firebase';
import { studentDocId, randomPin } from './hash';
import { generateClassCode } from './code';
import type { ChapterId, EmotionId, PrincipleId } from '../types/content';
import type {
  ChapterStep,
  ChoiceId,
  ClassCodeDoc,
  ClassDoc,
  ClassRecord,
  Declaration,
  HighlightsDoc,
  StatsDoc,
  StudentDoc,
  StudentRecord,
} from '../types/db';
import type { ChoiceStats } from './stats';

/* ─────────────── 경로 ─────────────── */

const classRef = (classId: string) => doc(db(), 'classes', classId);
const codeRef = (code: string) => doc(db(), 'classCodes', code);
const studentRef = (classId: string, studentId: string) => doc(db(), 'classes', classId, 'students', studentId);
const seatRef = (classId: string, number: number) => doc(db(), 'classes', classId, 'seats', String(number));
const memberRef = (classId: string, uid: string) => doc(db(), 'classes', classId, 'members', uid);
const statsRef = (classId: string) => doc(db(), 'classes', classId, 'public', 'stats');
const highlightsRef = (classId: string) => doc(db(), 'classes', classId, 'teacherOnly', 'highlights');

/** Firestore 오류 코드 꺼내기 */
export function errorCode(e: unknown): string {
  return typeof e === 'object' && e && 'code' in e ? String((e as { code: unknown }).code) : '';
}

/* ═════════════════════ 학생 ═════════════════════ */

export interface ClassLookup {
  classId: string;
  className: string;
}

/** 학급 코드로 학급 찾기. 없으면 null */
export async function lookupClassCode(code: string): Promise<ClassLookup | null> {
  const snap = await getDoc(codeRef(code));
  if (!snap.exists()) return null;
  const d = snap.data() as ClassCodeDoc;
  return { classId: d.classId, className: d.className };
}

export type JoinResult = { ok: true; studentId: string; resumed: boolean } | { ok: false; reason: 'taken' | 'error' };

/**
 * 처음 입장: 학생 기록 + 번호 자리 + 멤버 문서를 한 번에 만든다.
 * 번호가 이미 쓰이고 있으면, 같은 PIN 으로 예전에 들어온 것일 수 있으니 이어 하기를 시도한다.
 */
export async function joinClass(
  uid: string,
  classId: string,
  number: number,
  nickname: string,
  pin: string,
): Promise<JoinResult> {
  const studentId = await studentDocId(classId, number, pin);
  const batch = writeBatch(db());
  const fresh: Omit<StudentDoc, 'createdAt' | 'updatedAt'> & Record<'createdAt' | 'updatedAt', unknown> = {
    uid,
    number,
    nickname,
    progress: {},
    choices: {},
    emotions: {},
    answers: {},
    cards: [],
    declaration: null,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };
  batch.set(studentRef(classId, studentId), fresh);
  batch.set(seatRef(classId, number), { studentId });
  batch.set(memberRef(classId, uid), { studentId, number, joinedAt: serverTimestamp() });
  try {
    await batch.commit();
    return { ok: true, studentId, resumed: false };
  } catch (e) {
    if (errorCode(e) !== 'permission-denied') return { ok: false, reason: 'error' };
    // 번호 자리가 이미 있음 → 같은 PIN 이면 이어 하기로 처리
    const again = await recoverStudent(uid, classId, number, pin);
    if (again.ok) return { ok: true, studentId: again.studentId, resumed: true };
    return { ok: false, reason: 'taken' };
  }
}

export type RecoverResult = { ok: true; studentId: string } | { ok: false; reason: 'wrong' | 'error' };

/** 다른 기기에서 이어 하기: 학급 + 번호 + PIN 으로 문서 주소를 계산해 uid 를 옮긴다. */
export async function recoverStudent(
  uid: string,
  classId: string,
  number: number,
  pin: string,
): Promise<RecoverResult> {
  const studentId = await studentDocId(classId, number, pin);
  const batch = writeBatch(db());
  batch.update(studentRef(classId, studentId), { uid, updatedAt: serverTimestamp() });
  batch.set(memberRef(classId, uid), { studentId, number, joinedAt: serverTimestamp() });
  try {
    await batch.commit();
    return { ok: true, studentId };
  } catch (e) {
    const code = errorCode(e);
    if (code === 'permission-denied' || code === 'not-found') return { ok: false, reason: 'wrong' };
    return { ok: false, reason: 'error' };
  }
}

export function subscribeStudent(
  classId: string,
  studentId: string,
  onData: (s: StudentRecord | null) => void,
  onError: (e: unknown) => void,
): Unsubscribe {
  return onSnapshot(
    studentRef(classId, studentId),
    (snap) => onData(snap.exists() ? { id: snap.id, ...(snap.data() as StudentDoc) } : null),
    onError,
  );
}

export function subscribeClass(
  classId: string,
  onData: (c: ClassRecord | null) => void,
  onError: (e: unknown) => void,
): Unsubscribe {
  return onSnapshot(
    classRef(classId),
    (snap) => onData(snap.exists() ? { id: snap.id, ...(snap.data() as ClassDoc) } : null),
    onError,
  );
}

export function subscribeStats(
  classId: string,
  onData: (s: ChoiceStats | null) => void,
  onError: (e: unknown) => void,
): Unsubscribe {
  return onSnapshot(
    statsRef(classId),
    (snap) => onData(snap.exists() ? (snap.data() as StatsDoc).choices : null),
    onError,
  );
}

type Ref = DocumentReference;
const sRef = (classId: string, studentId: string): Ref => studentRef(classId, studentId);

/** 챕터 단계 옮기기 (인트로 → 장면1, 장면 → 다음 장면 …) */
export function setStep(classId: string, studentId: string, chapter: ChapterId, step: ChapterStep) {
  return updateDoc(sRef(classId, studentId), { [`progress.${chapter}`]: step, updatedAt: serverTimestamp() });
}

/** 장면 저장: 감정 + 선택 (한 번 정하면 바꿀 수 없다) */
export function saveSceneChoice(
  classId: string,
  studentId: string,
  sceneId: string,
  emotion: EmotionId,
  choice: ChoiceId,
) {
  return updateDoc(sRef(classId, studentId), {
    [`emotions.${sceneId}`]: emotion,
    [`choices.${sceneId}`]: choice,
    updatedAt: serverTimestamp(),
  });
}

export function saveAnswer(classId: string, studentId: string, answerId: string, text: string) {
  return updateDoc(sRef(classId, studentId), { [`answers.${answerId}`]: text, updatedAt: serverTimestamp() });
}

/** 원칙 카드 받기 + 마무리 단계로 */
export function awardCards(classId: string, studentId: string, chapter: ChapterId, cards: PrincipleId[]) {
  return updateDoc(sRef(classId, studentId), {
    cards: arrayUnion(...cards),
    [`progress.${chapter}`]: 'wrapup',
    updatedAt: serverTimestamp(),
  });
}

export function saveDeclaration(classId: string, studentId: string, d: Omit<Declaration, 'submittedAt'>) {
  return updateDoc(sRef(classId, studentId), {
    declaration: { ...d, submittedAt: serverTimestamp() },
    updatedAt: serverTimestamp(),
  });
}

/* ═════════════════════ 교사 ═════════════════════ */

export function subscribeTeacherClasses(
  uid: string,
  onData: (list: ClassRecord[]) => void,
  onError: (e: unknown) => void,
): Unsubscribe {
  const q = query(collection(db(), 'classes'), where('teacherUid', '==', uid));
  return onSnapshot(
    q,
    (snap) => {
      const list = snap.docs.map((d) => ({ id: d.id, ...(d.data() as ClassDoc) }));
      list.sort((a, b) => (b.createdAt?.toMillis?.() ?? 0) - (a.createdAt?.toMillis?.() ?? 0));
      onData(list);
    },
    onError,
  );
}

/** 학급 만들기: 6자리 코드를 겹치지 않게 뽑아 학급·코드 문서를 함께 만든다. */
export async function createClass(uid: string, name: string): Promise<{ classId: string; code: string }> {
  const newClassRef = doc(collection(db(), 'classes'));
  for (let attempt = 0; attempt < 8; attempt++) {
    const code = generateClassCode();
    try {
      await runTransaction(db(), async (tx) => {
        const existing = await tx.get(codeRef(code));
        if (existing.exists()) throw new Error('code-taken');
        tx.set(newClassRef, {
          name,
          code,
          teacherUid: uid,
          unlocked: { ch1: false, ch2: false, ch3: false, finale: false },
          showDistribution: false,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
        tx.set(codeRef(code), { classId: newClassRef.id, className: name, teacherUid: uid, createdAt: serverTimestamp() });
      });
      return { classId: newClassRef.id, code };
    } catch (e) {
      if (e instanceof Error && e.message === 'code-taken') continue;
      throw e;
    }
  }
  throw new Error('학급 코드를 만들지 못했어요. 잠시 뒤 다시 시도해 주세요.');
}

export function setUnlocked(classId: string, key: ChapterId | 'finale', value: boolean) {
  return updateDoc(classRef(classId), { [`unlocked.${key}`]: value, updatedAt: serverTimestamp() });
}

export function setShowDistribution(classId: string, value: boolean) {
  return updateDoc(classRef(classId), { showDistribution: value, updatedAt: serverTimestamp() });
}

export function subscribeStudents(
  classId: string,
  onData: (list: StudentRecord[]) => void,
  onError: (e: unknown) => void,
): Unsubscribe {
  return onSnapshot(
    collection(db(), 'classes', classId, 'students'),
    (snap) => {
      const list = snap.docs.map((d) => ({ id: d.id, ...(d.data() as StudentDoc) }));
      list.sort((a, b) => a.number - b.number);
      onData(list);
    },
    onError,
  );
}

export function publishStats(classId: string, choices: ChoiceStats) {
  return setDoc(statsRef(classId), { choices, updatedAt: serverTimestamp() });
}

export function subscribeHighlights(
  classId: string,
  onData: (items: Record<string, true>) => void,
  onError: (e: unknown) => void,
): Unsubscribe {
  return onSnapshot(
    highlightsRef(classId),
    (snap) => onData(snap.exists() ? (snap.data() as HighlightsDoc).items : {}),
    onError,
  );
}

export function setHighlights(classId: string, items: Record<string, true>) {
  return setDoc(highlightsRef(classId), { items, updatedAt: serverTimestamp() });
}

/**
 * PIN 초기화: 새 임시 PIN 으로 문서 주소를 다시 계산해 기록을 옮기고, 번호 자리를 새 주소로 바꾼다.
 * 돌려준 임시 PIN 을 학생에게 알려 주면, 학생은 ‘이어 하기’로 들어온다.
 */
export async function resetStudentPin(classId: string, student: StudentRecord): Promise<string> {
  const { id: oldId, ...data } = student;
  let pin = randomPin();
  let newId = await studentDocId(classId, data.number, pin);
  while (newId === oldId) {
    pin = randomPin();
    newId = await studentDocId(classId, data.number, pin);
  }
  const batch = writeBatch(db());
  batch.set(studentRef(classId, newId), { ...data, updatedAt: serverTimestamp() });
  batch.delete(studentRef(classId, oldId));
  batch.set(seatRef(classId, data.number), { studentId: newId });
  await batch.commit();
  return pin;
}

/** 학급 삭제(데이터 파기): 학생·자리·멤버·통계·하이라이트·코드·학급 문서를 모두 지운다. */
export async function deleteClassCompletely(classId: string, code: string): Promise<void> {
  const subs = ['students', 'seats', 'members', 'public', 'teacherOnly'];
  for (const sub of subs) {
    const snap = await getDocs(collection(db(), 'classes', classId, sub));
    for (let i = 0; i < snap.docs.length; i += 400) {
      const batch = writeBatch(db());
      snap.docs.slice(i, i + 400).forEach((d) => batch.delete(d.ref));
      await batch.commit();
    }
  }
  await deleteDoc(codeRef(code));
  await deleteDoc(classRef(classId));
}
