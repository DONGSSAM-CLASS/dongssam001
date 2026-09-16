import { Navigate, useLocation } from 'react-router-dom';
import type { ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { Loading } from '../components/States';

export function RequireTeacher({ children }: { children: ReactNode }) {
  const { ready, teacher } = useAuth();
  const location = useLocation();
  if (!ready) return <Loading />;
  if (!teacher) return <Navigate to="/teacher/login" state={{ from: location.pathname }} replace />;
  return <>{children}</>;
}

export function RequireStudent({ children }: { children: ReactNode }) {
  const { ready, student, classId } = useAuth();
  const location = useLocation();
  if (!ready) return <Loading />;
  if (!student || !classId) {
    return <Navigate to="/student/login" state={{ from: location.pathname }} replace />;
  }
  return <>{children}</>;
}

export function RequireTrial({ children }: { children: ReactNode }) {
  const { mode } = useAuth();
  if (mode !== 'trial') return <Navigate to="/" replace />;
  return <>{children}</>;
}
