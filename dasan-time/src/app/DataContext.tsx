import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { createFirestoreDb } from '../lib/db';
import { createLocalDb } from '../lib/localDb';
import type { ClassDoc, DataApi, Submission } from '../lib/types';
import type { ActivityId } from '../content/lessons';

interface DataState {
  api: DataApi | null;
  cls: ClassDoc | null;
  submissions: Record<string, Submission>;
  loading: boolean;
  /** 지금 학생의 모둠 번호 (체험 모드는 1) */
  group: number;
  /** 화면에 보여 줄 학생 이름 */
  displayName: string;
}

const DataContext = createContext<DataState | null>(null);

export function DataProvider({ children }: { children: ReactNode }) {
  const { mode, user, classId, student } = useAuth();
  const [cls, setCls] = useState<ClassDoc | null>(null);
  const [submissions, setSubmissions] = useState<Record<string, Submission>>({});
  const [loading, setLoading] = useState(true);

  const api = useMemo<DataApi | null>(() => {
    if (mode === 'trial') return createLocalDb();
    if (mode === 'student' && classId && user) return createFirestoreDb(classId, user.uid);
    return null;
  }, [mode, classId, user]);

  useEffect(() => {
    if (!api) {
      setCls(null);
      setSubmissions({});
      setLoading(false);
      return;
    }
    setLoading(true);
    const stopClass = api.watchClass((doc) => {
      setCls(doc);
      setLoading(false);
    });
    const stopSubs = api.watchMySubmissions((items) => {
      const map: Record<string, Submission> = {};
      items.forEach((s) => {
        map[s.activityId] = s;
      });
      setSubmissions(map);
    });
    return () => {
      stopClass();
      stopSubs();
    };
  }, [api]);

  const value = useMemo<DataState>(
    () => ({
      api,
      cls,
      submissions,
      loading,
      group: student?.group ?? 1,
      displayName: mode === 'trial' ? '체험 학생' : (student?.name ?? '학생'),
    }),
    [api, cls, submissions, loading, student, mode],
  );

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

export function useData(): DataState {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error('DataProvider 안에서만 쓸 수 있어요.');
  return ctx;
}

/** 활동 하나의 저장된 값을 꺼내 준다. */
export function useSubmission(activityId: ActivityId): Submission | null {
  const { submissions } = useData();
  return submissions[activityId] ?? null;
}
