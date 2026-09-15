import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../lib/AuthContext';
import { canAccess } from '../lib/permissions';

export default function ProtectedRoute({ children, section, admin = false }) {
  const { user, member, isAdmin, adminVerified, isStaffEditor, loading } = useAuth();
  const location = useLocation();

  if (loading) return <div className="state">확인하는 중…</div>;

  if (admin) {
    if (isStaffEditor) return children;
    if (!user || !isAdmin) return <Navigate to="/admin/login" replace state={{ from: location }} />;
    if (!adminVerified) return <Navigate to="/admin/login" replace state={{ needApproval: true }} />;
    return children;
  }

  if (!user) return <Navigate to="/login" replace state={{ from: location }} />;
  if (!member) return <Navigate to="/signup" replace />;
  if (member.status !== 'approved') return <Navigate to="/pending" replace />;
  if (section && !canAccess(section, member)) {
    return (
      <div className="state">
        <h2>접근 권한이 없습니다</h2>
        <p>현재 등급으로는 이 영역을 볼 수 없습니다. 등급 변경은 운영진에게 문의해 주세요.</p>
      </div>
    );
  }
  return children;
}
