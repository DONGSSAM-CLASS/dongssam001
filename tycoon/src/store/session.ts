import { create } from 'zustand';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { collection, doc, getDoc, getDocs, limit, query, where } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import { STUDENT_EMAIL_DOMAIN } from '../lib/ids';
import type { ClassDoc, MemberDoc, StudentDoc } from '../types';

export type SessionKind = 'loading' | 'anonymous' | 'teacher' | 'student';

interface SessionState {
  kind: SessionKind;
  user: User | null;
  classId: string | null;
  classDoc: (ClassDoc & { id: string }) | null;
  member: MemberDoc | null;
  student: StudentDoc | null;
  setClass: (classId: string) => Promise<void>;
  refresh: () => Promise<void>;
}

const LAST_CLASS_KEY = 'tycoon.lastClassId';

function rememberClass(classId: string | null) {
  try {
    if (classId) localStorage.setItem(LAST_CLASS_KEY, classId);
    else localStorage.removeItem(LAST_CLASS_KEY);
  } catch { /* 공용 기기에서 저장이 막혀도 동작해야 합니다. */ }
}

function recalledClass(): string | null {
  try { return localStorage.getItem(LAST_CLASS_KEY); } catch { return null; }
}

async function loadFor(user: User): Promise<Partial<SessionState>> {
  const isStudentAccount = (user.email ?? '').endsWith(`@${STUDENT_EMAIL_DOMAIN}`);

  if (isStudentAccount) {
    // 학생 계정은 소속 학급이 하나뿐입니다. 가상 이메일 접두어로 학급을 찾습니다.
    const authPrefix = (user.email ?? '').split('-')[0];
    const codeSnap = await getDoc(doc(db, 'classCodes', authPrefix.toUpperCase()));
    const classId = codeSnap.exists() ? (codeSnap.data().classId as string) : recalledClass();
    if (!classId) return { kind: 'anonymous', user, classId: null };

    const [classSnap, memberSnap] = await Promise.all([
      getDoc(doc(db, 'classes', classId)),
      getDoc(doc(db, `classes/${classId}/members/${user.uid}`)),
    ]);
    if (!classSnap.exists() || !memberSnap.exists()) {
      return { kind: 'anonymous', user, classId: null };
    }
    const member = memberSnap.data() as MemberDoc;
    const studentSnap = await getDoc(doc(db, `classes/${classId}/students/${member.number}`));
    rememberClass(classId);
    return {
      kind: 'student',
      user,
      classId,
      classDoc: { id: classId, ...(classSnap.data() as ClassDoc) },
      member,
      student: studentSnap.exists() ? (studentSnap.data() as StudentDoc) : null,
    };
  }

  // 교사 계정: 내가 담임인 학급을 찾습니다(기억해 둔 학급 우선).
  const remembered = recalledClass();
  if (remembered) {
    const snap = await getDoc(doc(db, 'classes', remembered));
    if (snap.exists() && snap.data().teacherId === user.uid) {
      return { kind: 'teacher', user, classId: remembered, classDoc: { id: remembered, ...(snap.data() as ClassDoc) }, member: null, student: null };
    }
  }
  const owned = await getDocs(
    query(collection(db, 'classes'), where('teacherId', '==', user.uid), limit(1)),
  );
  if (owned.empty) {
    return { kind: 'teacher', user, classId: null, classDoc: null, member: null, student: null };
  }
  const first = owned.docs[0];
  rememberClass(first.id);
  return {
    kind: 'teacher',
    user,
    classId: first.id,
    classDoc: { id: first.id, ...(first.data() as ClassDoc) },
    member: null,
    student: null,
  };
}

export const useSession = create<SessionState>((set, get) => ({
  kind: 'loading',
  user: null,
  classId: null,
  classDoc: null,
  member: null,
  student: null,
  async setClass(classId) {
    rememberClass(classId);
    await get().refresh();
  },
  async refresh() {
    const user = auth.currentUser;
    if (!user) {
      set({ kind: 'anonymous', user: null, classId: null, classDoc: null, member: null, student: null });
      return;
    }
    set(await loadFor(user) as SessionState);
  },
}));

onAuthStateChanged(auth, async (user) => {
  if (!user) {
    rememberClass(null);
    useSession.setState({ kind: 'anonymous', user: null, classId: null, classDoc: null, member: null, student: null });
    return;
  }
  useSession.setState(await loadFor(user) as SessionState);
});
