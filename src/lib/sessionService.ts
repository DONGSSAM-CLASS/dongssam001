/**
 * 수업 세션·미션 관리 (교사용).
 * 주의: 규칙의 ownsClass() 는 get() 을 쓰므로 세션·미션은 학급이 이미 존재한 뒤에 만들어야 한다.
 */
import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from 'firebase/firestore';
import { db } from './firebase';
import type { CameraState, LayerKey, MissionDoc, SessionDoc, SessionStatus, StudentWorkDoc, WorksheetItem } from '@/types/firestore';

export const DEFAULT_SESSION_LAYERS: Record<LayerKey, boolean> = {
  polities: true,
  figures: true,
  places: true,
  routes: false,
  modernBorders: false,
};

export interface SessionInput {
  classId: string;
  title: string;
  yearRange: [number, number];
  focusYear: number;
  layers: Record<LayerKey, boolean>;
  highlightPolities: string[];
  highlightFigures: string[];
  achievementStandards: string[];
  worksheet: WorksheetItem[];
  status?: SessionStatus;
}

export async function createSession(teacherId: string, input: SessionInput): Promise<string> {
  const ref = doc(collection(db, 'sessions'));
  const data: SessionDoc = {
    teacherId,
    classId: input.classId,
    title: input.title.trim() || '새 수업 세션',
    status: input.status ?? 'draft',
    yearRange: input.yearRange,
    focusYear: input.focusYear,
    layers: input.layers,
    highlightPolities: input.highlightPolities,
    highlightFigures: input.highlightFigures,
    achievementStandards: input.achievementStandards,
    worksheet: input.worksheet,
    follow: { enabled: false, year: input.focusYear, camera: { lat: 30, lon: 105, zoom: 2.6 }, updatedAt: serverTimestamp() },
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };
  await setDoc(ref, data);
  return ref.id;
}

export async function updateSession(sessionId: string, patch: Partial<Omit<SessionDoc, 'teacherId' | 'classId' | 'createdAt'>>) {
  await updateDoc(doc(db, 'sessions', sessionId), { ...patch, updatedAt: serverTimestamp() });
}

export async function setSessionStatus(sessionId: string, status: SessionStatus) {
  await updateSession(sessionId, { status });
}

/** 따라오기 모드: 교사의 연대·시점을 세션 문서에 기록하면 학생 화면이 onSnapshot 으로 따라온다 */
export async function updateFollow(sessionId: string, enabled: boolean, year: number, camera: CameraState) {
  await updateDoc(doc(db, 'sessions', sessionId), {
    follow: { enabled, year, camera, updatedAt: serverTimestamp() },
    updatedAt: serverTimestamp(),
  });
}

export async function duplicateSession(teacherId: string, source: SessionDoc, toClassId?: string): Promise<string> {
  return createSession(teacherId, {
    classId: toClassId ?? source.classId,
    title: `${source.title} (복제)`,
    yearRange: source.yearRange,
    focusYear: source.focusYear,
    layers: source.layers,
    highlightPolities: source.highlightPolities,
    highlightFigures: source.highlightFigures,
    achievementStandards: source.achievementStandards,
    worksheet: source.worksheet,
    status: 'draft',
  });
}

export async function deleteSession(sessionId: string) {
  await deleteDoc(doc(db, 'sessions', sessionId));
}

export async function listTeacherSessions(teacherId: string) {
  const snap = await getDocs(query(collection(db, 'sessions'), where('teacherId', '==', teacherId), orderBy('updatedAt', 'desc')));
  return snap.docs.map((d) => ({ id: d.id, ...(d.data() as SessionDoc) }));
}

export async function listClassSessions(classId: string) {
  const snap = await getDocs(query(collection(db, 'sessions'), where('classId', '==', classId), orderBy('updatedAt', 'desc')));
  return snap.docs.map((d) => ({ id: d.id, ...(d.data() as SessionDoc) }));
}

/** 수업 중에만 켜는 실시간 리스너 (무료 할당량 절약) */
export function watchSessionWork(
  sessionId: string,
  cb: (rows: (StudentWorkDoc & { id: string })[]) => void,
  onError?: (e: Error) => void,
) {
  return onSnapshot(
    query(collection(db, 'student_work'), where('sessionId', '==', sessionId), orderBy('number')),
    (snap) => cb(snap.docs.map((d) => ({ id: d.id, ...(d.data() as StudentWorkDoc) }))),
    (e) => onError?.(e),
  );
}

export function watchSession(sessionId: string, cb: (s: (SessionDoc & { id: string }) | null) => void, onError?: (e: Error) => void) {
  return onSnapshot(
    doc(db, 'sessions', sessionId),
    (snap) => cb(snap.exists() ? { id: snap.id, ...(snap.data() as SessionDoc) } : null),
    (e) => onError?.(e),
  );
}

export async function createMission(teacherId: string, input: Omit<MissionDoc, 'teacherId' | 'createdAt'>): Promise<string> {
  const ref = doc(collection(db, 'missions'));
  await setDoc(ref, { ...input, teacherId, createdAt: serverTimestamp() });
  return ref.id;
}

export async function listSessionMissions(sessionId: string, classId: string) {
  const snap = await getDocs(query(collection(db, 'missions'), where('classId', '==', classId), where('sessionId', '==', sessionId)));
  return snap.docs.map((d) => ({ id: d.id, ...(d.data() as MissionDoc) }));
}

export async function updateMission(missionId: string, patch: Partial<MissionDoc>) {
  await updateDoc(doc(db, 'missions', missionId), patch);
}

export async function deleteMission(missionId: string) {
  await deleteDoc(doc(db, 'missions', missionId));
}
