import { Suspense, lazy } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';

import Layout from './components/Layout.jsx';
import HomePage from './pages/HomePage.jsx';
import CaseListPage from './pages/CaseListPage.jsx';
import LearningLoopPage from './pages/LearningLoopPage.jsx';
import ReportPage from './pages/ReportPage.jsx';
import NotFoundPage from './pages/NotFoundPage.jsx';

// 학생이 수업 중 곧바로 쓰지 않는 화면은 따로 떼어 내 첫 로딩을 가볍게 한다.
// 학교 크롬북·저대역폭 환경을 염두에 둔 조치다.
const ArchiveGuidePage = lazy(() => import('./pages/ArchiveGuidePage.jsx'));
const TeacherPage = lazy(() => import('./pages/TeacherPage.jsx'));
const CreditsPage = lazy(() => import('./pages/CreditsPage.jsx'));

function Loading() {
  return (
    <p className="card-file text-ink-soft" role="status">
      불러오는 중…
    </p>
  );
}

/**
 * 라우팅
 * 화면 구성 8번 항목과 1:1 대응한다.
 */
export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/cases" element={<Navigate to="/cases/korea" replace />} />
        <Route path="/cases/:track" element={<CaseListPage />} />
        <Route path="/learn/:caseId" element={<LearningLoopPage />} />
        <Route path="/learn/:caseId/:step" element={<LearningLoopPage />} />
        <Route path="/report/:caseId" element={<ReportPage />} />
        <Route
          path="/guide"
          element={
            <Suspense fallback={<Loading />}>
              <ArchiveGuidePage />
            </Suspense>
          }
        />
        <Route
          path="/teacher"
          element={
            <Suspense fallback={<Loading />}>
              <TeacherPage />
            </Suspense>
          }
        />
        <Route
          path="/credits"
          element={
            <Suspense fallback={<Loading />}>
              <CreditsPage />
            </Suspense>
          }
        />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}
