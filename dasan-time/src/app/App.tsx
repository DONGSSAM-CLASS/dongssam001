import { lazy, Suspense } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './AuthContext';
import { DataProvider } from './DataContext';
import Layout from './Layout';
import { RequireStudent, RequireTeacher, RequireTrial } from './guards';
import { Loading } from '../components/States';
import LandingPage from '../pages/landing/LandingPage';

// 무거운 화면(교사용·PDF)은 필요할 때 불러온다.
const TeacherAuthPage = lazy(() => import('../pages/auth/TeacherAuthPage'));
const StudentAuthPage = lazy(() => import('../pages/auth/StudentAuthPage'));
const StudentHome = lazy(() => import('../pages/student/StudentHome'));
const Session1 = lazy(() => import('../pages/student/Session1'));
const Session2 = lazy(() => import('../pages/student/Session2'));
const Session3 = lazy(() => import('../pages/student/Session3'));
const HomeCheck = lazy(() => import('../pages/student/HomeCheck'));
const SurveyPage = lazy(() => import('../pages/student/SurveyPage'));
const TeacherShell = lazy(() => import('../pages/teacher/TeacherShell'));
const Dashboard = lazy(() => import('../pages/teacher/Dashboard'));
const ClassManage = lazy(() => import('../pages/teacher/ClassManage'));
const LiveControl = lazy(() => import('../pages/teacher/LiveControl'));
const Results = lazy(() => import('../pages/teacher/Results'));
const Stats = lazy(() => import('../pages/teacher/Stats'));
const ExportPage = lazy(() => import('../pages/teacher/ExportPage'));
const GuidePage = lazy(() => import('../pages/teacher/GuidePage'));
const ParentLetterPage = lazy(() => import('../report/ParentLetter'));

/** 학생 화면과 체험 화면은 같은 코드를 쓴다. 다른 것은 데이터 통로뿐이다. */
function studentRoutes() {
  return (
    <>
      <Route index element={<StudentHome />} />
      <Route path="survey/:kind" element={<SurveyPage />} />
      <Route path="s1" element={<Session1 />} />
      <Route path="s2" element={<Session2 />} />
      <Route path="s3" element={<Session3 />} />
      <Route path="home" element={<HomeCheck />} />
    </>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Suspense fallback={<Loading />}>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/teacher/login" element={<TeacherAuthPage />} />
            <Route path="/student/login" element={<StudentAuthPage />} />

            {/* 학생 */}
            <Route
              path="/student"
              element={
                <RequireStudent>
                  <DataProvider>
                    <Layout />
                  </DataProvider>
                </RequireStudent>
              }
            >
              {studentRoutes()}
            </Route>

            {/* 체험 모드 — 같은 화면, localStorage 저장 */}
            <Route
              path="/trial"
              element={
                <RequireTrial>
                  <DataProvider>
                    <Layout />
                  </DataProvider>
                </RequireTrial>
              }
            >
              {studentRoutes()}
            </Route>

            {/* 교사 */}
            <Route
              path="/teacher"
              element={
                <RequireTeacher>
                  <TeacherShell />
                </RequireTeacher>
              }
            >
              <Route index element={<Dashboard />} />
              <Route path="class" element={<ClassManage />} />
              <Route path="live" element={<LiveControl />} />
              <Route path="results" element={<Results />} />
              <Route path="stats" element={<Stats />} />
              <Route path="export" element={<ExportPage />} />
              <Route path="guide" element={<GuidePage />} />
            </Route>

            {/* 인쇄 전용 화면 (틀 없이 A4 그대로) */}
            <Route
              path="/teacher/letter/:classId"
              element={
                <RequireTeacher>
                  <ParentLetterPage />
                </RequireTeacher>
              }
            />

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </AuthProvider>
  );
}
