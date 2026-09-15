import { Routes, Route, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import { logVisit } from './lib/usage';

import Home from './pages/Home';
import About from './pages/About';
import Lessons from './pages/Lessons';
import DevSpace from './pages/DevSpace';
import WebApps from './pages/WebApps';
import Collaborate from './pages/Collaborate';
import Signup from './pages/Signup';
import Login from './pages/Login';
import Pending from './pages/Pending';
import AdminLogin from './pages/AdminLogin';
import AdminApprove from './pages/AdminApprove';
import AdminDashboard from './pages/AdminDashboard';
import NotFound from './pages/NotFound';

export default function App() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
    logVisit(pathname);
  }, [pathname]);

  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<About />} />
        <Route path="/lessons" element={<Lessons />} />
        <Route path="/dev" element={<DevSpace />} />
        <Route path="/webapps" element={<WebApps />} />
        <Route path="/collaborate" element={<Collaborate />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/login" element={<Login />} />
        <Route path="/pending" element={<Pending />} />
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/admin/approve" element={<AdminApprove />} />
        <Route
          path="/admin"
          element={
            <ProtectedRoute admin>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Layout>
  );
}
