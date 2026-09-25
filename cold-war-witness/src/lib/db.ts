/**
 * Firestore 읽기·쓰기를 모두 이 파일에 모았다. 구조 설명: docs/data-model.md
 * 보안 규칙(firestore.rules)이 여기서 보내는 모양을 그대로 검증한다.
 */
import {
  arrayUnion,
  collection,
  deleteDoc,
  deleteField,
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
import type { ChapterId, EmotionId, PrincipleId, RoleId, SessionNo } from '../types/content';
import { MAX_GROUPS, PLAN_FIELDS } from '../data/project';
import type {
  ChapterStep,
  ChoiceId,
  ClassCodeDoc,
  ClassDoc,
  ClassRecord,
  Declaration,
  FinalReviewDoc,
  GroupDoc,
  GroupPlan,
  GroupRecord,
  HighlightsDoc,
  PlanStatus,
  ReviewDoc,
  ReviewRecord,
  RubricScores,
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
const groupRef = (classId: string, no: number) => doc(db(), 'classes', classId, 'groups', `g${no}`);
const reviewsCol = (classId: string) => collection(db(), 'classes', classId, 'reviews');

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
    groupNo: 0,
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
          session: 1,
          groupCount: 0,
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

/** 지금 차시 바꾸기 (학생 화면이 그 차시까지의 활동을 연다) */
export function setSession(classId: string, session: SessionNo) {
  return updateDoc(classRef(classId), { session, updatedAt: serverTimestamp() });
}

/** 모둠 수 바꾸기: 아직 없는 모둠 문서는 같은 배치로 빈 문서를 만든다. (줄여도 문서는 남는다) */
export async function setGroupCount(classId: string, count: number, existing: number[]) {
  const n = Math.max(0, Math.min(MAX_GROUPS, count));
  const batch = writeBatch(db());
  batch.update(classRef(classId), { groupCount: n, updatedAt: serverTimestamp() });
  for (let no = 1; no <= n; no++) {
    if (!existing.includes(no)) batch.set(groupRef(classId, no), emptyGroup(no));
  }
  await batch.commit();
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

/** 학급 삭제(데이터 파기): 학생·자리·멤버·모둠·검토·통계·하이라이트·코드·학급 문서를 모두 지운다. */
export async function deleteClassCompletely(classId: string, code: string): Promise<void> {
  const subs = ['students', 'seats', 'members', 'groups', 'reviews', 'public', 'teacherOnly'];
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

/* ═════════════════════ 모둠 프로젝트 ═════════════════════ */

export function emptyPlan(): GroupPlan {
  const text = Object.fromEntries(PLAN_FIELDS.map((f) => [f.id, ''])) as Record<(typeof PLAN_FIELDS)[number]['id'], string>;
  return { ...text, format: null, formatOther: '', factIds: [], principleIds: [], aspectTags: [], valueIds: [] };
}

function emptyGroup(no: number): Record<keyof GroupDoc, unknown> {
  return {
    no,
    name: '',
    caseId: null,
    pledge: '',
    members: {},
    plan: emptyPlan(),
    planChecks: {},
    finalChecks: {},
    planStatus: 'draft',
    teacherComment: '',
    storyboard: {},
    stage: 'idea',
    aiLog: { tools: '', where: '', human: '', label: '' },
    sources: '',
    submission: null,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };
}

export function subscribeGroups(
  classId: string,
  onData: (list: GroupRecord[]) => void,
  onError: (e: unknown) => void,
): Unsubscribe {
  return onSnapshot(
    collection(db(), 'classes', classId, 'groups'),
    (snap) => {
      const list = snap.docs.map((d) => ({ id: d.id, ...(d.data() as GroupDoc) }));
      list.sort((a, b) => a.no - b.no);
      onData(list);
    },
    onError,
  );
}

/** 모둠 하나 구독 (학생은 자기 모둠만 늘 구독한다 — 무료 읽기 한도를 아끼기 위해) */
export function subscribeGroup(
  classId: string,
  no: number,
  onData: (g: GroupRecord | null) => void,
  onError: (e: unknown) => void,
): Unsubscribe {
  return onSnapshot(
    groupRef(classId, no),
    (snap) => onData(snap.exists() ? { id: snap.id, ...(snap.data() as GroupDoc) } : null),
    onError,
  );
}

/**
 * 학생이 모둠 고르기·옮기기: 내 기록의 모둠 번호 + 예전 모둠 명단에서 빠지기 + 새 모둠 명단에 들어가기를 한 번에.
 * to 가 0 이면 모둠에서 나가기만 한다.
 */
export async function joinGroup(
  classId: string,
  studentId: string,
  me: { number: number; nickname: string },
  from: number,
  to: number,
) {
  const key = `members.${me.number}`;
  const batch = writeBatch(db());
  batch.update(studentRef(classId, studentId), { groupNo: to, updatedAt: serverTimestamp() });
  if (from > 0 && from !== to) batch.update(groupRef(classId, from), { [key]: deleteField(), updatedAt: serverTimestamp() });
  if (to > 0) batch.update(groupRef(classId, to), { [key]: { nickname: me.nickname, roles: [] }, updatedAt: serverTimestamp() });
  await batch.commit();
}

/** 내 역할 고르기 */
export function setMyRoles(classId: string, groupNo: number, me: { number: number; nickname: string }, roles: RoleId[]) {
  return updateDoc(groupRef(classId, groupNo), {
    [`members.${me.number}`]: { nickname: me.nickname, roles },
    updatedAt: serverTimestamp(),
  });
}

/**
 * 모둠 공동 기록 고치기. 키는 점으로 이은 필드 경로 (예: 'plan.title', 'planChecks.hc1', 'storyboard.c2', 'stage').
 * 필드 단위로 쓰기 때문에 모둠원이 동시에 다른 칸을 고쳐도 서로 덮어쓰지 않는다.
 */
export function updateGroup(classId: string, groupNo: number, fields: Record<string, unknown>) {
  return updateDoc(groupRef(classId, groupNo), { ...fields, updatedAt: serverTimestamp() });
}

/** 기획서 제출 / 제출 취소 (학생은 ‘작성 중’과 ‘제출’만 고를 수 있다) */
export function setPlanSubmitted(classId: string, groupNo: number, submitted: boolean) {
  return updateGroup(classId, groupNo, { planStatus: submitted ? 'submitted' : 'draft' });
}

/** 작품 제출 (5차시) */
export function submitWork(classId: string, groupNo: number, w: { url: string; intro: string; note: string }) {
  return updateGroup(classId, groupNo, { submission: { ...w, submittedAt: serverTimestamp() }, stage: 'done' });
}

export function cancelSubmission(classId: string, groupNo: number) {
  return updateGroup(classId, groupNo, { submission: null });
}

/* ───── 교사: 모둠 관리 ───── */

/** 기획서 승인 또는 고칠 점 보내기 */
export function reviewPlanAsTeacher(classId: string, groupNo: number, status: PlanStatus, comment: string) {
  return updateGroup(classId, groupNo, { planStatus: status, teacherComment: comment });
}

/** 학생 모둠 옮기기 (교사). 역할은 새 모둠에서 다시 고른다. */
export async function moveStudentAsTeacher(classId: string, student: StudentRecord, to: number) {
  const from = student.groupNo ?? 0;
  if (from === to) return;
  const key = `members.${student.number}`;
  const batch = writeBatch(db());
  batch.update(studentRef(classId, student.id), { groupNo: to, updatedAt: serverTimestamp() });
  if (from > 0) batch.update(groupRef(classId, from), { [key]: deleteField(), updatedAt: serverTimestamp() });
  if (to > 0) batch.update(groupRef(classId, to), { [key]: { nickname: student.nickname, roles: [] }, updatedAt: serverTimestamp() });
  await batch.commit();
}

/* ───── 검토·평가 ───── */

export const planReviewId = (from: number, to: number) => `plan_g${from}_g${to}`;
export const finalReviewId = (to: number, number: number) => `final_g${to}_n${number}`;

/**
 * 기획서 동료 검토 저장 (보낸 모둠이 함께 쓴다).
 * 이미 있는 문서는 고친 칸만 합쳐 써서, 모둠원이 동시에 다른 칸을 써도 덮어쓰지 않는다.
 */
export function savePlanReviewField(
  classId: string,
  from: number,
  to: number,
  authorNumber: number,
  key: 'praise' | 'suggest' | 'ethics',
  text: string,
  exists: boolean,
) {
  const head = { kind: 'plan', fromGroup: from, toGroup: to, authorNumber, updatedAt: serverTimestamp() };
  const ref = doc(reviewsCol(classId), planReviewId(from, to));
  if (exists) return setDoc(ref, { ...head, [key]: text }, { merge: true });
  return setDoc(ref, { ...head, praise: '', suggest: '', ethics: '', [key]: text });
}

/** 발표 평가 저장 (학생 한 명이 다른 모둠 하나에 하나) */
export function saveFinalReview(
  classId: string,
  to: number,
  authorNumber: number,
  r: { scores: RubricScores; praise: string; suggest: string },
) {
  return setDoc(doc(reviewsCol(classId), finalReviewId(to, authorNumber)), {
    kind: 'final',
    toGroup: to,
    ...r,
    authorNumber,
    updatedAt: serverTimestamp(),
  });
}

function subscribeReviewQuery(
  q: ReturnType<typeof query>,
  onData: (list: ReviewRecord[]) => void,
  onError: (e: unknown) => void,
): Unsubscribe {
  return onSnapshot(q, (snap) => onData(snap.docs.map((d) => ({ id: d.id, ...(d.data() as ReviewDoc) }))), onError);
}

/** 우리 모둠이 받은 검토·평가 */
export function subscribeReviewsTo(classId: string, groupNo: number, onData: (l: ReviewRecord[]) => void, onError: (e: unknown) => void) {
  return subscribeReviewQuery(query(reviewsCol(classId), where('toGroup', '==', groupNo)), onData, onError);
}

/** 우리 모둠이 쓴 기획서 검토 */
export function subscribePlanReviewsFrom(classId: string, groupNo: number, onData: (l: ReviewRecord[]) => void, onError: (e: unknown) => void) {
  return subscribeReviewQuery(
    query(reviewsCol(classId), where('kind', '==', 'plan'), where('fromGroup', '==', groupNo)),
    onData,
    onError,
  );
}

/** 내가 쓴 발표 평가 */
export function subscribeMyFinalReviews(classId: string, number: number, onData: (l: ReviewRecord[]) => void, onError: (e: unknown) => void) {
  return subscribeReviewQuery(
    query(reviewsCol(classId), where('kind', '==', 'final'), where('authorNumber', '==', number)),
    onData,
    onError,
  );
}

/** 교사: 학급의 모든 검토·평가 */
export function subscribeAllReviews(classId: string, onData: (l: ReviewRecord[]) => void, onError: (e: unknown) => void) {
  return subscribeReviewQuery(query(reviewsCol(classId)), onData, onError);
}

export type { FinalReviewDoc };
