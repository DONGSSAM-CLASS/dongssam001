import { Navigate, Route, Routes } from 'react-router-dom';
import { useSession } from './store/session';
import Landing from './pages/Landing';
import TeacherLogin from './pages/TeacherLogin';
import TeacherHome from './pages/TeacherHome';
import TeacherClassSetup from './pages/TeacherClassSetup';
import TeacherStudents from './pages/TeacherStudents';
import LoginCards from './pages/LoginCards';
import StudentLogin from './pages/StudentLogin';
import StudentHome from './pages/StudentHome';

export default function App() {
  const kind = useSession((s) => s.kind);
  const classId = useSession((s) => s.classId);

  if (kind === 'loading') {
    return (
      <div className="flex min-h-dvh items-center justify-center text-lg font-bold text-gray-500">
        불러오는 중…
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/teacher/login" element={kind === 'teacher' ? <Navigate to="/teacher" replace /> : <TeacherLogin />} />
      <Route path="/student/login" element={kind === 'student' ? <Navigate to="/student" replace /> : <StudentLogin />} />

      <Route
        path="/teacher"
        element={
          kind !== 'teacher' ? <Navigate to="/teacher/login" replace />
            : classId ? <TeacherHome /> : <Navigate to="/teacher/setup" replace />
        }
      />
      <Route path="/teacher/setup" element={kind === 'teacher' ? <TeacherClassSetup /> : <Navigate to="/teacher/login" replace />} />
      <Route path="/teacher/students" element={kind === 'teacher' && classId ? <TeacherStudents /> : <Navigate to="/teacher" replace />} />
      <Route path="/teacher/cards" element={kind === 'teacher' && classId ? <LoginCards /> : <Navigate to="/teacher" replace />} />

      <Route path="/student" element={kind === 'student' ? <StudentHome /> : <Navigate to="/student/login" replace />} />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
