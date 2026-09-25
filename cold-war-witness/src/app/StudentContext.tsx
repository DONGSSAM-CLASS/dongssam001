/**
 * 학생 화면 공통 상태: 입장 정보(이 기기), 학생 기록, 학급 설정, 학급 선택 분포.
 * 모두 Firestore 실시간 구독으로 받는다.
 */
import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { clearSession, loadSession, saveSession, type StudentSession } from '../lib/session';
import { subscribeClass, subscribeStats, subscribeStudent } from '../lib/db';
import type { ClassRecord, StudentRecord } from '../types/db';
import type { ChoiceStats } from '../lib/stats';

/** none: 입장 전 / lost: 기록을 찾을 수 없음(PIN 초기화·다른 기기로 옮김) */
export type StudentStatus = 'loading' | 'none' | 'ready' | 'lost' | 'error';

interface StudentState {
  status: StudentStatus;
  session: StudentSession | null;
  student: StudentRecord | null;
  cls: ClassRecord | null;
  stats: ChoiceStats | null;
  start: (s: StudentSession) => void;
  leave: () => Promise<void>;
}

const Ctx = createContext<StudentState | null>(null);

export function StudentProvider({ children }: { children: ReactNode }) {
  const { user, loading: authLoading, signOut } = useAuth();
  const [session, setSession] = useState<StudentSession | null>(loadSession);
  const [student, setStudent] = useState<StudentRecord | null>(null);
  const [cls, setCls] = useState<ClassRecord | null>(null);
  const [stats, setStats] = useState<ChoiceStats | null>(null);
  const [status, setStatus] = useState<StudentStatus>('loading');

  const uid = user?.isAnonymous ? user.uid : null;

  useEffect(() => {
    if (authLoading) return;
    if (!session || !uid) {
      setStatus('none');
      setStudent(null);
      setCls(null);
      return;
    }
    setStatus('loading');
    let gotStudent = false;
    let gotClass = false;
    const ready = () => gotStudent && gotClass && setStatus('ready');
    const lost = () => {
      setStatus('lost');
      setStudent(null);
    };
    const u1 = subscribeStudent(
      session.classId,
      session.studentId,
      (s) => {
        if (!s || s.uid !== uid) return lost();
        setStudent(s);
        gotStudent = true;
        ready();
      },
      (e) => {
        const code = typeof e === 'object' && e && 'code' in e ? (e as { code: string }).code : '';
        if (code === 'permission-denied') lost();
        else setStatus('error');
      },
    );
    const u2 = subscribeClass(
      session.classId,
      (c) => {
        if (!c) return lost();
        setCls(c);
        gotClass = true;
        ready();
      },
      (e) => {
        const code = typeof e === 'object' && e && 'code' in e ? (e as { code: string }).code : '';
        if (code === 'permission-denied') lost();
        else setStatus('error');
      },
    );
    return () => {
      u1();
      u2();
    };
  }, [session, uid, authLoading]);

  // 선택 분포: 선생님이 공개했을 때만 구독 (공개하지 않으면 보안 규칙이 막는다)
  const showDist = !!cls?.showDistribution;
  useEffect(() => {
    if (!session || !showDist || status !== 'ready') {
      setStats(null);
      return;
    }
    return subscribeStats(session.classId, setStats, () => setStats(null));
  }, [session, showDist, status]);

  const start = useCallback((s: StudentSession) => {
    saveSession(s);
    setSession(s);
  }, []);

  const leave = useCallback(async () => {
    clearSession();
    setSession(null);
    await signOut();
  }, [signOut]);

  // 상태는 effect 가 돌기 전 한 번의 렌더에서 옛 값일 수 있으므로, 지금 값으로 다시 계산한다.
  let effective: StudentStatus = status;
  if (authLoading) effective = 'loading';
  else if (!session || !uid) effective = 'none';
  else if (status === 'none') effective = 'loading';
  else if (status === 'ready' && (student?.id !== session.studentId || cls?.id !== session.classId)) effective = 'loading';

  return (
    <Ctx.Provider value={{ status: effective, session, student, cls, stats, start, leave }}>{children}</Ctx.Provider>
  );
}

export function useStudent(): StudentState {
  const v = useContext(Ctx);
  if (!v) throw new Error('StudentProvider 안에서만 쓸 수 있어요.');
  return v;
}

/** 준비된 상태에서만 쓰는 화면용 */
export function useReadyStudent() {
  const s = useStudent();
  if (s.status !== 'ready' || !s.student || !s.cls || !s.session) throw new Error('학생 기록이 아직 준비되지 않았어요.');
  return { ...s, student: s.student, cls: s.cls, session: s.session };
}
