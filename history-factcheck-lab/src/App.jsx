import { Navigate, Route, Routes } from 'react-router-dom';

import Layout from './components/Layout.jsx';
import HomePage from './pages/HomePage.jsx';
import CaseListPage from './pages/CaseListPage.jsx';
import LearningLoopPage from './pages/LearningLoopPage.jsx';
import ReportPage from './pages/ReportPage.jsx';
import ArchiveGuidePage from './pages/ArchiveGuidePage.jsx';
import TeacherPage from './pages/TeacherPage.jsx';
import NotFoundPage from './pages/NotFoundPage.jsx';

/**
 * 라우팅 뼈대 (Phase 1)
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
        <Route path="/guide" element={<ArchiveGuidePage />} />
        <Route path="/teacher" element={<TeacherPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}
