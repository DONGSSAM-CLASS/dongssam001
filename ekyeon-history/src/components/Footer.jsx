import { Link } from 'react-router-dom';
import { ExternalLink, Mail } from 'lucide-react';
import { CONTACT_EMAIL, PARENT_SITE_URL, SITE_NAME, SITE_NAME_EN } from '../lib/constants';

export default function Footer() {
  return (
    <footer className="footer">
      <div className="footer__inner">
        <div className="footer__top">
          <div className="footer__brand">
            <div>
              <p className="footer__vision">{SITE_NAME}</p>
              <p className="footer__note">{SITE_NAME_EN}</p>
            </div>
          </div>
        </div>

        {/* 사이트 정체성 — 홈 히어로 · 소개 공간과 동일하게 명시합니다. */}
        <p className="m-0 max-w-3xl text-sm leading-7 text-base-content/55">
          전국 단위 에듀테크 교육 연구자 모임 <strong className="text-base-content">‘에듀테크 교사 연구회(에크연)’의 스핀오프 연구회</strong>이자,{' '}
          <strong className="text-base-content">교육부 역사교사학습공동체</strong>입니다.
        </p>

        <div className="footer__meta">
          <a className="inline-flex items-center gap-1.5" href={`mailto:${CONTACT_EMAIL}`}>
            <Mail size={15} />{CONTACT_EMAIL}
          </a>
          <a className="inline-flex items-center gap-1.5" href={PARENT_SITE_URL} target="_blank" rel="noreferrer noopener">
            <ExternalLink size={15} />본원 연구회 홈페이지
          </a>
          <Link to="/collaborate">협업 요청</Link>
          <Link to="/admin/login">관리자 로그인</Link>
        </div>

        <p className="footer__note">
          © {new Date().getFullYear()} EduTech Teachers · History Research Team
        </p>
      </div>
    </footer>
  );
}
