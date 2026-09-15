import { useState } from 'react';
import { NavLink, Link, useNavigate } from 'react-router-dom';
import { LogIn, LogOut, Menu, ScrollText, X } from 'lucide-react';
import { useAuth } from '../lib/AuthContext';

const MENU = [
  { to: '/about', label: '소개 공간' },
  { to: '/lessons', label: '수업 공간' },
  { to: '/dev', label: '개발 공간' },
  { to: '/webapps', label: '개발 웹앱' },
  { to: '/collaborate', label: '협업 요청' },
];

export default function Nav() {
  const { user, member, canManageContent, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  const onLogout = async () => {
    await logout();
    setOpen(false);
    navigate('/');
  };

  return (
    <header className="nav">
      <div className="nav__inner">
        <Link to="/" className="brand" onClick={() => setOpen(false)}>
          <span className="brand__mark"><ScrollText aria-hidden="true" /></span>
          <span className="brand__name brand__name--always">
            에듀테크 교사 연구회 역사연구팀
            <small>EDUTECH TEACHERS · HISTORY</small>
          </span>
        </Link>

        <button
          className="nav__toggle"
          aria-expanded={open}
          aria-label="메뉴 열기"
          onClick={() => setOpen((v) => !v)}
        >
          {open ? <X aria-hidden="true" /> : <Menu aria-hidden="true" />}
        </button>

        <nav className={`nav__links ${open ? 'is-open' : ''}`}>
          {MENU.map((m) => (
            <NavLink key={m.to} to={m.to} onClick={() => setOpen(false)}>{m.label}</NavLink>
          ))}

          <span className="nav__divider" aria-hidden="true" />

          {user ? (
            <>
              {member?.status === 'pending' && (
                <NavLink to="/pending" onClick={() => setOpen(false)}>승인 대기</NavLink>
              )}
              {canManageContent && (
                <NavLink to="/admin" onClick={() => setOpen(false)}>운영 도구</NavLink>
              )}
              <button className="btn btn--ghost" onClick={onLogout}><LogOut />로그아웃</button>
            </>
          ) : (
            <NavLink to="/login" className="btn btn--ghost" onClick={() => setOpen(false)}>
              <LogIn />회원 로그인
            </NavLink>
          )}
        </nav>
      </div>
    </header>
  );
}
