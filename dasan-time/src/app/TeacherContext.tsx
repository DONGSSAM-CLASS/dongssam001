import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { useAuth } from './AuthContext';
import {
  watchAllSubmissions,
  watchEvaluations,
  watchStudents,
  watchTeacherClasses,
} from '../lib/db';
import type { ClassDoc, Evaluation, StudentProfile, Submission } from '../lib/types';

interface TeacherState {
  classes: ClassDoc[];
  cls: ClassDoc | null;
  selectClass: (id: string) => void;
  students: StudentProfile[];
  submissions: Submission[];
  evaluations: Evaluation[];
  loading: boolean;
}

const KEY = 'dasan-time.teacher.selectedClass';
const TeacherContext = createContext<TeacherState | null>(null);

export function TeacherProvider({ children }: { children: ReactNode }) {
  const { teacher } = useAuth();
  const [classes, setClasses] = useState<ClassDoc[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(() => localStorage.getItem(KEY));
  const [students, setStudents] = useState<StudentProfile[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [evaluations, setEvaluations] = useState<Evaluation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!teacher) return;
    return watchTeacherClasses(teacher.uid, (items) => {
      setClasses(items);
      setLoading(false);
      // 고른 학급이 없거나 사라졌으면 첫 학급을 보여 준다.
      setSelectedId((prev) => (prev && items.some((c) => c.id === prev) ? prev : (items[0]?.id ?? null)));
    });
  }, [teacher]);

  const cls = useMemo(
    () => classes.find((c) => c.id === selectedId) ?? null,
    [classes, selectedId],
  );

  useEffect(() => {
    if (!cls) {
      setStudents([]);
      setSubmissions([]);
      setEvaluations([]);
      return;
    }
    const stops = [
      watchStudents(cls.id, setStudents),
      watchAllSubmissions(cls.id, setSubmissions),
      watchEvaluations(cls.id, setEvaluations),
    ];
    return () => stops.forEach((stop) => stop());
  }, [cls]);

  const value = useMemo<TeacherState>(
    () => ({
      classes,
      cls,
      students,
      submissions,
      evaluations,
      loading,
      selectClass: (id: string) => {
        localStorage.setItem(KEY, id);
        setSelectedId(id);
      },
    }),
    [classes, cls, students, submissions, evaluations, loading],
  );

  return <TeacherContext.Provider value={value}>{children}</TeacherContext.Provider>;
}

export function useTeacher(): TeacherState {
  const ctx = useContext(TeacherContext);
  if (!ctx) throw new Error('TeacherProvider 안에서만 쓸 수 있어요.');
  return ctx;
}

/** 학생 uid + 활동 ID 로 제출물을 빨리 찾기 위한 표 */
export function indexSubmissions(items: Submission[]): Map<string, Submission> {
  const map = new Map<string, Submission>();
  items.forEach((s) => map.set(`${s.ownerUid}_${s.activityId}`, s));
  return map;
}
