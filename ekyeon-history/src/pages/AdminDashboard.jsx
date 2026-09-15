import { useState } from 'react';
import { useAuth } from '../lib/AuthContext';
import SectionTitle from '../components/SectionTitle';
import MemberTable from '../components/admin/MemberTable';
import LessonManager from '../components/admin/LessonManager';
import WebAppManager from '../components/admin/WebAppManager';

const CONTENT_TABS = [
  { id: 'lessons', label: '수업 기록 관리' },
  { id: 'webapps', label: '웹앱 관리' },
];

const ADMIN_TABS = [
  { id: 'pending', label: '승인 대기' },
  { id: 'members', label: '회원 목록' },
];

export default function AdminDashboard() {
  const { admin, adminVerified, isStaffEditor } = useAuth();
  const [tab, setTab] = useState('lessons');
  const until = admin?.verifiedUntil?.toDate?.();
  const tabs = adminVerified ? [...ADMIN_TABS, ...CONTENT_TABS] : CONTENT_TABS;

  return (
    <div className="page page--admin">
      <SectionTitle
        eyebrow="운영 도구"
        title={isStaffEditor && !adminVerified ? '콘텐츠 관리' : '관리자 대시보드'}
        lead={until
          ? `이 관리자 세션은 ${until.toLocaleString('ko-KR')}까지 유효합니다.`
          : '승인된 운영진 권한으로 수업 기록과 웹앱을 관리할 수 있습니다.'}
      />

      <div className="typetabs" role="tablist">
        {tabs.map((t) => (
          <button
            key={t.id}
            role="tab"
            aria-selected={tab === t.id}
            className={`typetab ${tab === t.id ? 'is-active' : ''}`}
            onClick={() => setTab(t.id)}
            type="button"
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'pending' && <MemberTable statusFilter="pending" />}
      {tab === 'members' && <MemberTable statusFilter="approved" />}
      {tab === 'lessons' && <LessonManager />}
      {tab === 'webapps' && <WebAppManager />}
    </div>
  );
}
