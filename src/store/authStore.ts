import { create } from 'zustand';
import type { User } from 'firebase/auth';
import type { ClassDoc, UserDoc } from '@/types/firestore';

export type AuthStatus = 'loading' | 'anon' | 'ready';

interface AuthState {
  status: AuthStatus;
  user: User | null;
  profile: (UserDoc & { uid: string }) | null;
  /** 학생이면 소속 학급 문서 */
  classDoc: (ClassDoc & { id: string }) | null;
  isAdmin: boolean;
  set: (patch: Partial<AuthState>) => void;
  reset: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  status: 'loading',
  user: null,
  profile: null,
  classDoc: null,
  isAdmin: false,
  set: (patch) => set(patch),
  reset: () => set({ status: 'anon', user: null, profile: null, classDoc: null, isAdmin: false }),
}));
