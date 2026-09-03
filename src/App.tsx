import { lazy, Suspense, useEffect } from 'react';
import { Route, Routes } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import { RequireRole } from './components/RequireRole';
import { startAuthListener } from './lib/authService';

// 화면별 코드 분할: 지구본(Three.js)과 Firebase 를 쓰는 화면은 필요할 때만 내려받는다
const GlobePage = lazy(() => import('./pages/GlobePage'));
const DevStatusPage = lazy(() => import('./pages/DevStatusPage'));
const StudentJoinPage = lazy(() => import('./pages/student/StudentJoinPage'));
const StudentHomePage = lazy(() => import('./pages/student/StudentHomePage'));
const StudentGlobePage = lazy(() => import('./pages/student/StudentGlobePage'));
const StudentRecordsPage = lazy(() => import('./pages/student/StudentRecordsPage'));
const TeacherAuthPage = lazy(() => import('./pages/teacher/TeacherAuthPage'));
const TeacherDashboardPage = lazy(() => import('./pages/teacher/TeacherDashboardPage'));
const ClassDetailPage = lazy(() => import('./pages/teacher/ClassDetailPage'));
const LessonDesignPage = lazy(() => import('./pages/teacher/LessonDesignPage'));
const TeacherGlobePage = lazy(() => import('./pages/teacher/TeacherGlobePage'));
const WorksheetPage = lazy(() => import('./pages/teacher/WorksheetPage'));
const ContentPage = lazy(() => import('./pages/teacher/ContentPage'));
const DataReviewPage = lazy(() => import('./pages/admin/DataReviewPage'));

function Loading() {
  return <div className="flex h-full items-center justify-center text-slate-400">불러오는 중…</div>;
}

/**
 * 화면 라우팅 (8장 화면 목록)
 *  /                     랜딩(교사 가입/로그인, 학생 학급코드 입력)
 *  /globe                자유 탐색 지구본(로그인 불필요)
 *  /join                 학생 입장(학급코드 → 번호 + PIN)
 *  /student              학생 홈(세션 목록)
 *  /student/globe/:id    학생용 지구본(세션 연결, 핀·거리·루트 저장)
 *  /student/records      학생 내 기록
 *  /teacher/login        교사 가입·로그인
 *  /teacher              교사 대시보드(학급 목록·최근 세션)
 *  /teacher/classes/:id  학급 상세(학생 관리·학급코드·세션)
 *  /teacher/design       수업 설계(성취기준 → 세션)
 *  /teacher/globe/:id    교사용 지구본(수업 모드/따라오기)
 *  /teacher/worksheet/:id 활동지 생성·편집·PDF/HTML 다운로드
 *  /teacher/content      우리 학급 자료(교사 수정본)
 *  /admin/data           데이터 검수/관리
 *  /dev/status           개발 상태
 */
export default function App() {
  useEffect(() => startAuthListener(), []);
  return (
    <Suspense fallback={<Loading />}>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/globe" element={<GlobePage />} />
        <Route path="/join" element={<StudentJoinPage />} />
        <Route path="/student" element={<RequireRole role="student"><StudentHomePage /></RequireRole>} />
        <Route path="/student/globe/:sessionId" element={<RequireRole role="student"><StudentGlobePage /></RequireRole>} />
        <Route path="/student/records" element={<RequireRole role="student"><StudentRecordsPage /></RequireRole>} />
        <Route path="/teacher/login" element={<TeacherAuthPage />} />
        <Route path="/teacher" element={<RequireRole role="teacher"><TeacherDashboardPage /></RequireRole>} />
        <Route path="/teacher/classes/:classId" element={<RequireRole role="teacher"><ClassDetailPage /></RequireRole>} />
        <Route path="/teacher/design" element={<RequireRole role="teacher"><LessonDesignPage /></RequireRole>} />
        <Route path="/teacher/globe/:sessionId" element={<RequireRole role="teacher"><TeacherGlobePage /></RequireRole>} />
        <Route path="/teacher/worksheet/:sessionId" element={<RequireRole role="teacher"><WorksheetPage /></RequireRole>} />
        <Route path="/teacher/content" element={<RequireRole role="teacher"><ContentPage /></RequireRole>} />
        <Route path="/admin/data" element={<RequireRole role="teacher"><DataReviewPage /></RequireRole>} />
        <Route path="/dev/status" element={<DevStatusPage />} />
        <Route path="*" element={<LandingPage />} />
      </Routes>
    </Suspense>
  );
}
