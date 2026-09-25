import { lazy, Suspense, type ReactNode } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './app/AuthContext';
import { StudentProvider, useStudent } from './app/StudentContext';
import { Layout } from './components/Layout';
import { Loading, Notice, Button, LinkButton } from './components/ui';
import { isFirebaseConfigured } from './lib/firebase';
import LandingPage from './pages/LandingPage';
import JoinPage from './pages/student/JoinPage';
import StudentHome from './pages/student/StudentHome';
import ChapterPage from './pages/student/ChapterPage';
import CardsPage from './pages/student/CardsPage';
import FinalePage from './pages/student/FinalePage';
import CertificatePage from './pages/student/CertificatePage';
import GuidePage from './pages/student/project/GuidePage';
import TeamPage from './pages/student/project/TeamPage';
import ExplorePage from './pages/student/project/ExplorePage';
import PlanPage from './pages/student/project/PlanPage';
import ReviewPage from './pages/student/project/ReviewPage';
import CreatePage from './pages/student/project/CreatePage';
import GalleryPage from './pages/student/project/GalleryPage';
import AboutPage from './pages/AboutPage';

// 교사 화면과 인쇄 자료는 학생이 받을 필요가 없으므로 따로 내려받는다.
const TeacherHome = lazy(() => import('./pages/teacher/TeacherHome'));
const ClassDashboard = lazy(() => import('./pages/teacher/ClassDashboard'));
const PresentPage = lazy(() => import('./pages/teacher/PresentPage'));
const MaterialsPage = lazy(() => import('./pages/print/MaterialsPage'));

/** 학생 기록이 준비된 뒤에만 화면을 보여 준다. */
function StudentGate({ children }: { children: ReactNode }) {
  const { status, session, leave } = useStudent();
  if (status === 'loading')
    return (
      <Layout>
        <Loading />
      </Layout>
    );
  if (status === 'none') return <Navigate to="/join" replace />;
  if (status === 'lost')
    return (
      <Layout>
        <div className="dossier flex flex-col gap-4 p-6">
          <h1 className="typewriter text-2xl font-bold">기록을 찾을 수 없어요</h1>
          <p>
            다른 기기에서 이어 하기를 했거나, 선생님이 PIN을 새로 만들었을 수 있어요.
            <br />
            <strong>학급 코드 · 번호 · PIN</strong>으로 다시 들어와 주세요.
          </p>
          <div className="flex flex-wrap gap-2">
            <LinkButton
              to={`/join?mode=recover${session ? `&code=${session.classCode}` : ''}`}
              onClick={() => void leave()}
            >
              이어 하기로 들어가기
            </LinkButton>
          </div>
        </div>
      </Layout>
    );
  if (status === 'error')
    return (
      <Layout>
        <Notice tone="error">
          인터넷 연결이 불안정해서 기록을 불러오지 못했어요.
          <div className="mt-3">
            <Button onClick={() => window.location.reload()}>다시 불러오기</Button>
          </div>
        </Notice>
      </Layout>
    );
  return <>{children}</>;
}

function NotConfigured() {
  return (
    <Layout>
      <Notice tone="warn">
        <p className="font-bold">Firebase 설정이 아직 없어요.</p>
        <p>README 의 “Firebase 설정” 단계를 따라 .env.local 파일을 만든 뒤 다시 실행해 주세요.</p>
      </Notice>
    </Layout>
  );
}

export default function App() {
  if (!isFirebaseConfigured) {
    return (
      <BrowserRouter>
        <Routes>
          <Route path="/about" element={<AboutPage />} />
          <Route path="*" element={<NotConfigured />} />
        </Routes>
      </BrowserRouter>
    );
  }
  const fallback = (
    <Layout wide>
      <Loading />
    </Layout>
  );
  return (
    <BrowserRouter>
      <AuthProvider>
        <StudentProvider>
          <Suspense fallback={fallback}>
            <Routes>
              <Route path="/" element={<LandingPage />} />
              <Route path="/about" element={<AboutPage />} />
              <Route path="/join" element={<JoinPage />} />
              <Route path="/play" element={<StudentGate><StudentHome /></StudentGate>} />
              <Route path="/play/guide" element={<StudentGate><GuidePage /></StudentGate>} />
              <Route path="/play/team" element={<StudentGate><TeamPage /></StudentGate>} />
              <Route path="/play/explore" element={<StudentGate><ExplorePage /></StudentGate>} />
              <Route path="/play/plan" element={<StudentGate><PlanPage /></StudentGate>} />
              <Route path="/play/review" element={<StudentGate><ReviewPage /></StudentGate>} />
              <Route path="/play/create" element={<StudentGate><CreatePage /></StudentGate>} />
              <Route path="/play/gallery" element={<StudentGate><GalleryPage /></StudentGate>} />
              <Route path="/play/chapter/:chapterId" element={<StudentGate><ChapterPage /></StudentGate>} />
              <Route path="/play/cards" element={<StudentGate><CardsPage /></StudentGate>} />
              <Route path="/play/finale" element={<StudentGate><FinalePage /></StudentGate>} />
              <Route path="/play/certificate" element={<StudentGate><CertificatePage /></StudentGate>} />
              <Route path="/teacher" element={<TeacherHome />} />
              <Route path="/teacher/class/:classId" element={<ClassDashboard />} />
              <Route path="/teacher/class/:classId/present" element={<PresentPage />} />
              <Route path="/teacher/materials" element={<MaterialsPage />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Suspense>
        </StudentProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
