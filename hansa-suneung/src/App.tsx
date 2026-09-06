import { Route, Routes } from 'react-router-dom';
import Layout from './components/Layout';
import ExplorePage from './pages/ExplorePage';
import HeatmapPage from './pages/HeatmapPage';
import SearchPage from './pages/SearchPage';
import RecordsPage from './pages/RecordsPage';
import ReportPage from './pages/ReportPage';
import PlanPage from './pages/PlanPage';
import TeacherHome from './pages/teacher/TeacherHome';
import VerifyPage from './pages/teacher/VerifyPage';
import WorksheetPage from './pages/teacher/WorksheetPage';
import SharePage from './pages/teacher/SharePage';
import ProjectionPage from './pages/teacher/ProjectionPage';
import Placeholder from './pages/Placeholder';

/**
 * 화면 라우팅.
 *  /            단원 탐색 + 문항 카드 (기능 1, 3)
 *  /heatmap     출제 빈도 히트맵 (기능 2)          [3단계]
 *  /search      검색 + 역방향 탐색 (기능 4, 5)     [5단계]
 *  /records     내 학습 기록 (기능 6)              [6단계]
 *  /report      취약 단원 리포트 (기능 7)          [6단계]
 *  /plan        D-day 학습 플랜 (기능 8)           [6단계]
 *  /teacher     교사용 홈 · 투사/공유/인쇄/검수    [4·7단계]
 */
export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<ExplorePage />} />
        <Route path="heatmap" element={<HeatmapPage />} />
        <Route path="search" element={<SearchPage />} />
        <Route path="records" element={<RecordsPage />} />
        <Route path="report" element={<ReportPage />} />
        <Route path="plan" element={<PlanPage />} />
        <Route path="teacher" element={<TeacherHome />} />
        <Route path="teacher/verify" element={<VerifyPage />} />
        <Route path="teacher/worksheet" element={<WorksheetPage />} />
        <Route path="teacher/share" element={<SharePage />} />
      </Route>
      {/* 투사 모드는 전체화면(학생 네비게이션 없음) 전용 라우트 */}
      <Route path="teacher/project" element={<ProjectionPage />} />
      <Route path="*" element={<Placeholder title="페이지를 찾을 수 없습니다" />} />
    </Routes>
  );
}
