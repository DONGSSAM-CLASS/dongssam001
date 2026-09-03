/**
 * 학생 기록 동기화 — Firestore(수업 세션) 또는 localStorage(자유 탐색).
 *
 * 쓰기 횟수를 줄이려고 1.5초 디바운스로 "학생 1명 = 세션당 문서 1개"를 통째로 갱신한다.
 * 저장 구독은 모듈 로드 시 한 번만 걸고 해제하지 않는다(화면 전환·프로필 갱신으로 구독이
 * 잠시 끊긴 사이의 변경이 저장되지 않는 문제를 막기 위함). 대신 openWork 세대 토큰으로
 * 오래된 읽기 응답이 새 세션의 데이터를 덮어쓰지 않게 한다.
 */
import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore';
import { db } from './firebase';
import { useWorkStore } from '@/store/workStore';
import { studentWorkDocId } from './studentAuth';
import type { Pin, Route, StudentWorkDoc } from '@/types/firestore';

const LOCAL_KEY = 'history-globe:free-work';
const DEBOUNCE_MS = 1500;
let timer: ReturnType<typeof setTimeout> | null = null;
let opId = 0;
let subscribed = false;

function ensureSubscription() {
  if (subscribed) return;
  subscribed = true;
  useWorkStore.subscribe((s, prev) => {
    if (s.dirty && (s.pins !== prev.pins || s.routes !== prev.routes)) scheduleSave();
  });
}

export interface WorkContext {
  sessionId: string | null;
  classId: string | null;
  number: number | null;
  uid: string | null;
}

/** 세션(또는 자유 탐색) 기록을 연다. 같은 컨텍스트로 다시 호출해도 안전하다. */
export async function openWork(ctx: WorkContext) {
  ensureSubscription();
  await flushWork(); // 이전 컨텍스트의 미저장 변경을 먼저 기록
  const myOp = ++opId;
  const store = useWorkStore.getState();
  store.reset(ctx);
  store.setStatus({ loading: true });
  try {
    if (!ctx.sessionId) {
      const raw = localStorage.getItem(LOCAL_KEY);
      const parsed = raw ? (JSON.parse(raw) as { pins?: Pin[]; routes?: Route[] }) : {};
      if (myOp === opId) store.setData(parsed.pins ?? [], parsed.routes ?? []);
    } else if (ctx.number != null) {
      const snap = await getDoc(doc(db, 'student_work', studentWorkDocId(ctx.sessionId, ctx.number)));
      if (myOp !== opId) return; // 그사이 다른 세션이 열렸으면 무시
      if (snap.exists()) {
        const d = snap.data() as StudentWorkDoc;
        store.setData(d.pins ?? [], d.routes ?? []);
      }
    }
  } catch (e) {
    if (myOp === opId) store.setStatus({ error: (e as Error).message });
  } finally {
    if (myOp === opId) store.setStatus({ loading: false });
  }
}

/** 화면을 떠날 때 호출 — 남은 변경을 즉시 저장한다(구독은 유지). */
export function closeWork() {
  if (timer) {
    clearTimeout(timer);
    timer = null;
  }
  void flushWork();
}

function scheduleSave() {
  if (timer) clearTimeout(timer);
  timer = setTimeout(() => {
    timer = null;
    void flushWork();
  }, DEBOUNCE_MS);
}

export async function flushWork() {
  const s = useWorkStore.getState();
  if (!s.dirty) return;
  s.setStatus({ saving: true, error: null });
  try {
    if (!s.sessionId) {
      localStorage.setItem(LOCAL_KEY, JSON.stringify({ pins: s.pins, routes: s.routes }));
    } else if (s.classId && s.number != null && s.uid) {
      const payload: StudentWorkDoc = {
        sessionId: s.sessionId,
        classId: s.classId,
        number: s.number,
        uid: s.uid,
        pins: s.pins,
        routes: s.routes,
        updatedAt: serverTimestamp(),
      };
      await setDoc(doc(db, 'student_work', studentWorkDocId(s.sessionId, s.number)), payload);
    }
    // 저장하는 사이에 또 바뀌었을 수 있으므로 스냅샷과 현재 상태가 같을 때만 dirty 를 내린다
    const after = useWorkStore.getState();
    if (after.pins === s.pins && after.routes === s.routes) after.setStatus({ dirty: false, lastSavedAt: Date.now() });
    else after.setStatus({ lastSavedAt: Date.now() });
  } catch (e) {
    useWorkStore.getState().setStatus({ error: (e as Error).message });
  } finally {
    useWorkStore.getState().setStatus({ saving: false });
  }
}
