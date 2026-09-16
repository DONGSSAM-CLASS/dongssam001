import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
  ChartColumn,
  BookOpenText,
  FileDown,
  LayoutDashboard,
  LogOut,
  Menu,
  MonitorPlay,
  NotebookText,
  Users,
} from 'lucide-react';
import { TeacherProvider, useTeacher } from '../../app/TeacherContext';
import { useAuth } from '../../app/AuthContext';
import { logOut } from '../../lib/authService';
import { APP } from '../../content/lessons';

const MENU = [
  { to: '/teacher', end: true, label: '대시보드', icon: LayoutDashboard },
  { to: '/teacher/class', label: '학급 관리', icon: Users },
  { to: '/teacher/live', label: '수업 진행', icon: MonitorPlay },
  { to: '/teacher/results', label: '학생 결과물', icon: NotebookText },
  { to: '/teacher/stats', label: '통계', icon: ChartColumn },
  { to: '/teacher/export', label: 'PDF 내보내기', icon: FileDown },
  { to: '/teacher/guide', label: '수업 안내 자료', icon: BookOpenText },
];

export default function TeacherShell() {
  return (
    <TeacherProvider>
      <Shell />
    </TeacherProvider>
  );
}

function Shell() {
  const { teacher } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="drawer lg:drawer-open">
      <input id="teacher-drawer" type="checkbox" className="drawer-toggle" />
      <div className="drawer-content flex min-h-screen flex-col bg-base-200">
        <header className="no-print navbar min-h-14 bg-base-100 px-3 shadow-sm lg:hidden">
          <label htmlFor="teacher-drawer" className="btn btn-ghost rounded-2xl" aria-label="메뉴 열기">
            <Menu className="h-5 w-5" aria-hidden />
          </label>
          <span className="ml-2 font-extrabold">{APP.name}</span>
        </header>
        <main className="w-full grow p-4 lg:p-6">
          <ClassPicker />
          <Outlet />
        </main>
      </div>

      <div className="drawer-side no-print z-30">
        <label htmlFor="teacher-drawer" className="drawer-overlay" aria-label="메뉴 닫기" />
        <aside className="flex min-h-full w-64 flex-col bg-base-100 p-4">
          <p className="px-2 text-lg font-extrabold">{APP.name}</p>
          <p className="mb-4 px-2 text-xs opacity-60">{APP.subtitle}</p>
          <ul className="menu w-full grow gap-1 p-0">
            {MENU.map((m) => {
              const Icon = m.icon;
              return (
                <li key={m.to}>
                  <NavLink
                    to={m.to}
                    end={m.end}
                    className={({ isActive }) =>
                      `rounded-2xl ${isActive ? 'active font-bold' : ''}`
                    }
                  >
                    <Icon className="h-5 w-5" aria-hidden />
                    {m.label}
                  </NavLink>
                </li>
              );
            })}
          </ul>
          <div className="border-t border-base-300 pt-3">
            <p className="px-2 text-sm font-semibold">{teacher?.name} 선생님</p>
            <p className="mb-2 px-2 text-xs opacity-60">{teacher?.school}</p>
            <button
              type="button"
              className="btn btn-ghost btn-sm w-full justify-start gap-2 rounded-2xl"
              onClick={async () => {
                await logOut();
                navigate('/');
              }}
            >
              <LogOut className="h-4 w-4" aria-hidden />
              로그아웃
            </button>
          </div>
        </aside>
      </div>
    </div>
  );
}

function ClassPicker() {
  const { classes, cls, selectClass } = useTeacher();
  if (classes.length === 0) return null;
  return (
    <div className="no-print mb-4 flex flex-wrap items-center gap-3">
      <label className="form-control">
        <select
          className="select select-bordered rounded-2xl"
          aria-label="학급 고르기"
          value={cls?.id ?? ''}
          onChange={(e) => selectClass(e.target.value)}
        >
          {classes.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </label>
      {cls && (
        <span className="badge badge-lg rounded-2xl font-mono text-base tracking-widest">
          {cls.code}
        </span>
      )}
    </div>
  );
}
