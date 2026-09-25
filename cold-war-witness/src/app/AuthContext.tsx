import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import {
  GoogleAuthProvider,
  onAuthStateChanged,
  signInAnonymously,
  signInWithPopup,
  signOut as fbSignOut,
  type User,
} from 'firebase/auth';
import { auth, isFirebaseConfigured } from '../lib/firebase';

interface AuthState {
  user: User | null;
  loading: boolean;
  isTeacher: boolean;
  isStudent: boolean;
  /** 학생: 익명 로그인 (이미 익명이면 그대로) */
  ensureStudent: () => Promise<User>;
  /** 교사: Google 로그인 */
  signInTeacher: () => Promise<User>;
  signOut: () => Promise<void>;
}

const Ctx = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(isFirebaseConfigured);

  useEffect(() => {
    if (!isFirebaseConfigured) return;
    return onAuthStateChanged(auth(), (u) => {
      setUser(u);
      setLoading(false);
    });
  }, []);

  const value = useMemo<AuthState>(() => {
    const provider = user?.providerData[0]?.providerId;
    return {
      user,
      loading,
      isTeacher: !!user && !user.isAnonymous && provider === 'google.com',
      isStudent: !!user && user.isAnonymous,
      ensureStudent: async () => {
        const current = auth().currentUser;
        if (current?.isAnonymous) return current;
        if (current) await fbSignOut(auth());
        const cred = await signInAnonymously(auth());
        return cred.user;
      },
      signInTeacher: async () => {
        const provider = new GoogleAuthProvider();
        provider.setCustomParameters({ prompt: 'select_account' });
        const cred = await signInWithPopup(auth(), provider);
        return cred.user;
      },
      signOut: () => fbSignOut(auth()),
    };
  }, [user, loading]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAuth(): AuthState {
  const v = useContext(Ctx);
  if (!v) throw new Error('AuthProvider 안에서만 쓸 수 있어요.');
  return v;
}
