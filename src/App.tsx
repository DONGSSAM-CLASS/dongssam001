import { lazy, Suspense } from 'react';
import { Route, Routes } from 'react-router-dom';
import LandingPage from './pages/LandingPage';

// 화면별 코드 분할: 지구본(Three.js)과 Firebase 를 쓰는 화면은 필요할 때만 내려받는다
const GlobePage = lazy(() => import('./pages/GlobePage'));
const DevStatusPage = lazy(() => import('./pages/DevStatusPage'));

function Loading() {
  return <div className="flex h-full items-center justify-center text-slate-400">불러오는 중…</div>;
}

/**
 * 화면 라우팅 (8장 화면 목록)
 *  /                 랜딩(교사 가입/로그인, 학생 학급코드 입력)      — 4·5단계에서 구현
 *  /teacher          교사 대시보드                                    — 5단계
 *  /teacher/classes/:classId  학급 상세                              — 5·7단계
 *  /teacher/design   수업 설계                                       — 5·6단계
 *  /teacher/globe    교사용 지구본                                   — 2·7단계
 *  /student/globe    학생용 지구본                                   — 2·4단계
 *  /student/records  학생 내 기록                                    — 4단계
 *  /admin/data       데이터 검수/관리                                — 8단계
 *  /dev/status       1단계 점검용 상태 페이지
 */
export default function App() {
  return (
    <Suspense fallback={<Loading />}>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/globe" element={<GlobePage />} />
        <Route path="/dev/status" element={<DevStatusPage />} />
        <Route path="*" element={<LandingPage />} />
      </Routes>
    </Suspense>
  );
}
