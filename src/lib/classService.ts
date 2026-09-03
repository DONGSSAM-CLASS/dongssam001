/**
 * 학급·학생 관리 (교사용). 모든 처리는 클라이언트에서 하며 권한은 firestore.rules 가 강제한다.
 * 쓰기 순서 제약: 규칙의 ownsClass() 는 get() 을 쓰므로 세션·미션은 학급이 이미 존재한 뒤에 만든다.
 */
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  where,
  writeBatch,
} from 'firebase/firestore';
import { db } from './firebase';
import { generateClassCode, memberDocId } from './studentAuth';
import type { ClassDoc, ClassMemberDoc, ClassSettings, SchoolLevel } from '@/types/firestore';
import type { Subject } from '@/types/history';

export const DEFAULT_CLASS_SETTINGS: ClassSettings = { walkKmPerDay: 30, horseKmPerDay: 60, sailKmPerDay: 120 };

/** 아직 쓰이지 않는 6자리 학급코드를 찾는다 (class_codes 는 문서 ID 조회가 공개) */
async function findFreeCode(maxTries = 10): Promise<string> {
  for (let i = 0; i < maxTries; i++) {
    const code = generateClassCode();
    const snap = await getDoc(doc(db, 'class_codes', code));
    if (!snap.exists()) return code;
  }
  throw new Error('학급코드를 만들지 못했습니다. 잠시 후 다시 시도해 주세요.');
}

export async function createClass(
  teacherId: string,
  input: { name: string; schoolLevel: SchoolLevel; subject: Subject },
): Promise<{ id: string; code: string }> {
  const code = await findFreeCode();
  const ref = doc(collection(db, 'classes'));
  const batch = writeBatch(db);
  const data: ClassDoc = {
    teacherId,
    name: input.name.trim(),
    code,
    authPrefix: code, // 로그인용 접두어는 이후 코드를 재발급해도 바뀌지 않는다
    schoolLevel: input.schoolLevel,
    subject: input.subject,
    archived: false,
    settings: { ...DEFAULT_CLASS_SETTINGS },
    createdAt: serverTimestamp(),
    codeUpdatedAt: serverTimestamp(),
  };
  batch.set(ref, data);
  batch.set(doc(db, 'class_codes', code), { classId: ref.id, teacherId, authPrefix: code, active: true, resets: {} });
  await batch.commit();
  return { id: ref.id, code };
}

/** 학급코드 재발급 — authPrefix 는 그대로라 기존 학생 로그인은 계속 유효하다 */
export async function reissueClassCode(cls: ClassDoc & { id: string }): Promise<string> {
  const code = await findFreeCode();
  const oldSnap = await getDoc(doc(db, 'class_codes', cls.code));
  const resets = (oldSnap.data()?.resets as Record<string, number> | undefined) ?? {};
  const batch = writeBatch(db);
  batch.update(doc(db, 'classes', cls.id), { code, codeUpdatedAt: serverTimestamp() });
  batch.set(doc(db, 'class_codes', code), { classId: cls.id, teacherId: cls.teacherId, authPrefix: cls.authPrefix, active: true, resets });
  await batch.commit();
  // 옛 코드 문서는 새 코드가 자리 잡은 뒤 지운다(실패해도 새 코드 사용에는 지장 없음)
  await deleteDoc(doc(db, 'class_codes', cls.code)).catch(() => {});
  return code;
}

export async function updateClass(classId: string, patch: Partial<Pick<ClassDoc, 'name' | 'archived' | 'settings' | 'subject' | 'schoolLevel'>>) {
  await updateDoc(doc(db, 'classes', classId), patch);
}

export function watchClassMembers(classId: string, cb: (members: (ClassMemberDoc & { id: string })[]) => void, onError?: (e: Error) => void) {
  return onSnapshot(
    query(collection(db, 'class_members'), where('classId', '==', classId), orderBy('number')),
    (snap) => cb(snap.docs.map((d) => ({ id: d.id, ...(d.data() as ClassMemberDoc) }))),
    (e) => onError?.(e),
  );
}

export async function listClassMembers(classId: string) {
  const snap = await getDocs(query(collection(db, 'class_members'), where('classId', '==', classId), orderBy('number')));
  return snap.docs.map((d) => ({ id: d.id, ...(d.data() as ClassMemberDoc) }));
}

/**
 * 비밀번호 초기화 (Spark 요금제에는 Admin SDK 가 없어 서버에서 비밀번호를 바꿀 수 없다).
 * 세대를 1 올리고 class_codes.resets 에 기록해 두면, 학생이 같은 번호로 새 비밀번호를 정해 다시 가입한다.
 * 기록(student_work·submissions)은 번호 기준 문서 ID 라 그대로 유지된다.
 */
export async function resetStudentPassword(cls: ClassDoc & { id: string }, member: ClassMemberDoc & { id: string }) {
  const generation = member.authGeneration + 1;
  const batch = writeBatch(db);
  batch.update(doc(db, 'class_members', member.id), { authGeneration: generation, resetPending: true });
  batch.update(doc(db, 'class_codes', cls.code), { [`resets.${member.number}`]: generation });
  await batch.commit();
  return generation;
}

export async function setStudentActive(member: ClassMemberDoc & { id: string }, active: boolean) {
  const batch = writeBatch(db);
  batch.update(doc(db, 'class_members', member.id), { active });
  if (member.uid) batch.update(doc(db, 'users', member.uid), { active });
  await batch.commit();
}

export async function renameStudent(member: ClassMemberDoc & { id: string }, displayName: string) {
  const batch = writeBatch(db);
  batch.update(doc(db, 'class_members', member.id), { displayName });
  if (member.uid) batch.update(doc(db, 'users', member.uid), { displayName });
  await batch.commit();
}

/** 학급 이동 — 두 학급 모두 같은 교사 소유여야 한다 */
export async function moveStudent(member: ClassMemberDoc & { id: string }, toClassId: string, toNumber: number) {
  const batch = writeBatch(db);
  batch.set(doc(db, 'class_members', memberDocId(toClassId, toNumber)), {
    classId: toClassId,
    number: toNumber,
    uid: member.uid,
    displayName: member.displayName,
    ...(member.nickname ? { nickname: member.nickname } : {}),
    active: member.active,
    authGeneration: member.authGeneration,
    resetPending: member.resetPending,
    joinedAt: member.joinedAt,
    lastSeenAt: member.lastSeenAt,
  });
  if (member.uid) batch.update(doc(db, 'users', member.uid), { classId: toClassId, number: toNumber });
  batch.delete(doc(db, 'class_members', member.id));
  await batch.commit();
}

/** 교사가 명단을 미리 등록 (학생이 그 번호로 가입하면 자리를 이어받는다) */
export async function preRegisterStudent(classId: string, number: number, displayName: string) {
  await writeBatch(db)
    .set(doc(db, 'class_members', memberDocId(classId, number)), {
      classId,
      number,
      uid: null,
      displayName: displayName.trim(),
      active: true,
      authGeneration: 0,
      resetPending: false,
      joinedAt: null,
      lastSeenAt: null,
    })
    .commit();
}
