/**
 * 교사 수정본(teacher_overrides) — 기본 역사 데이터는 보호되고, 교사가 자기 학급용으로만 덮어쓴다.
 * 규칙: 교사는 자기 것만 쓰기, 학생은 담당 교사의 것만 읽기.
 */
import { collection, deleteDoc, doc, getDocs, onSnapshot, query, serverTimestamp, setDoc, where } from 'firebase/firestore';
import { db } from './firebase';
import { overrideDocId } from './studentAuth';
import { useOverridesStore } from '@/store/overridesStore';
import type { OverrideKind, TeacherOverrideDoc } from '@/types/firestore';

export function watchOverrides(teacherId: string) {
  return onSnapshot(
    query(collection(db, 'teacher_overrides'), where('teacherId', '==', teacherId)),
    (snap) => useOverridesStore.getState().set(snap.docs.map((d) => ({ id: d.id, ...(d.data() as TeacherOverrideDoc) }))),
    () => useOverridesStore.getState().set([]),
  );
}

export async function loadOverrides(teacherId: string) {
  try {
    const snap = await getDocs(query(collection(db, 'teacher_overrides'), where('teacherId', '==', teacherId)));
    useOverridesStore.getState().set(snap.docs.map((d) => ({ id: d.id, ...(d.data() as TeacherOverrideDoc) })));
  } catch {
    useOverridesStore.getState().set([]);
  }
}

export async function saveOverride(
  teacherId: string,
  kind: OverrideKind,
  targetId: string,
  op: TeacherOverrideDoc['op'],
  data: Record<string, unknown>,
) {
  await setDoc(doc(db, 'teacher_overrides', overrideDocId(teacherId, kind, targetId)), {
    teacherId,
    kind,
    targetId,
    op,
    data,
    updatedAt: serverTimestamp(),
  });
}

export async function deleteOverride(teacherId: string, kind: OverrideKind, targetId: string) {
  await deleteDoc(doc(db, 'teacher_overrides', overrideDocId(teacherId, kind, targetId)));
}
