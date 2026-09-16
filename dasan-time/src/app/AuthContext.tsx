import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { auth, isFirebaseConfigured } from '../lib/firebase';
import {
  getStudentClassId,
  getStudentProfile,
  getTeacherProfile,
  getUserRole,
} from '../lib/db';
import type { StudentProfile, TeacherProfile } from '../lib/types';

export type SessionMode = 'guest' | 'teacher' | 'student' | 'trial';

interface AuthState {
  ready: boolean;
  mode: SessionMode;
  user: User | null;
  teacher: TeacherProfile | null;
  student: StudentProfile | null;
  classId: string | null;
  /** 체험 모드 켜기 / 끄기 */
  startTrial: () => void;
  endTrial: () => void;
  /** 학생 이름·번호·모둠이 바뀌었을 때 다시 읽기 */
  refreshStudent: () => Promise<void>;
  configured: boolean;
}

const TRIAL_KEY = 'dasan-time.trial.active';

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [teacher, setTeacher] = useState<TeacherProfile | null>(null);
  const [student, setStudent] = useState<StudentProfile | null>(null);
  const [classId, setClassId] = useState<string | null>(null);
  const [trial, setTrial] = useState(() => localStorage.getItem(TRIAL_KEY) === '1');

  useEffect(() => {
    if (!isFirebaseConfigured) {
      setReady(true);
      return;
    }
    return onAuthStateChanged(auth(), async (next) => {
      // 방금 가입한 경우, 계정이 먼저 만들어지고 프로필 문서가 조금 뒤에 저장된다.
      // 한 번 읽어서 없다고 바로 포기하면 가입 직후 로그인 화면으로 튕긴다. 잠깐 기다렸다 다시 읽는다.
      const roleWithRetry = async (uid: string) => {
        for (let attempt = 0; attempt < 5; attempt += 1) {
          const role = await getUserRole(uid).catch(() => null);
          if (role) return role;
          await new Promise((r) => setTimeout(r, 400));
        }
        return null;
      };

      setUser(next);
      if (!next) {
        setTeacher(null);
        setStudent(null);
        setClassId(null);
        setReady(true);
        return;
      }
      try {
        const role = await roleWithRetry(next.uid);
        if (role === 'teacher') {
          setTeacher(await getTeacherProfile(next.uid));
          setStudent(null);
          setClassId(null);
        } else if (role === 'student') {
          const cid = await getStudentClassId(next.uid);
          setClassId(cid);
          setStudent(cid ? await getStudentProfile(cid, next.uid) : null);
          setTeacher(null);
        }
      } catch {
        // 프로필을 못 읽어도 로그인 상태 자체는 유지한다. 화면에서 다시 시도한다.
      }
      setReady(true);
    });
  }, []);

  const value = useMemo<AuthState>(() => {
    const mode: SessionMode = teacher ? 'teacher' : student ? 'student' : trial ? 'trial' : 'guest';
    return {
      ready,
      mode,
      user,
      teacher,
      student,
      classId,
      configured: isFirebaseConfigured,
      startTrial: () => {
        localStorage.setItem(TRIAL_KEY, '1');
        setTrial(true);
      },
      endTrial: () => {
        localStorage.removeItem(TRIAL_KEY);
        setTrial(false);
      },
      refreshStudent: async () => {
        if (!user || !classId) return;
        setStudent(await getStudentProfile(classId, user.uid));
      },
    };
  }, [ready, user, teacher, student, classId, trial]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('AuthProvider 안에서만 쓸 수 있어요.');
  return ctx;
}
