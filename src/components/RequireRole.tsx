import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';

/** 역할별 라우트 가드 */
export function RequireRole({ role, children }: { role: 'teacher' | 'student' | 'admin'; children: ReactNode }) {
  const status = useAuthStore((s) => s.status);
  const profile = useAuthStore((s) => s.profile);
  const isAdmin = useAuthStore((s) => s.isAdmin);
  const location = useLocation();
  if (status === 'loading') return <div className="flex h-full items-center justify-center text-slate-400">로그인 확인 중…</div>;
  if (!profile) return <Navigate to={role === 'student' ? '/join' : '/teacher/login'} replace state={{ from: location }} />;
  if (role === 'admin' && !isAdmin) return <Navigate to="/teacher" replace />;
  if (role !== 'admin' && profile.role !== role) return <Navigate to={profile.role === 'teacher' ? '/teacher' : '/student'} replace />;
  return <>{children}</>;
}
