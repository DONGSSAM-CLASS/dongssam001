import { useState } from 'react';
import { Link } from 'react-router-dom';
import { sendEmailVerification } from 'firebase/auth';
import { auth } from '../lib/firebase';
import { useAuth } from '../lib/AuthContext';
import { CONTACT_EMAIL, MEMBER_TYPE_MAP, STATUS_LABEL } from '../lib/constants';

export default function Pending() {
  const { user, member, logout } = useAuth();
  const [sent, setSent] = useState(false);

  if (!user) {
    return (
      <div className="state">
        <h2>로그인이 필요합니다</h2>
        <Link className="btn btn--solid" to="/login">로그인</Link>
      </div>
    );
  }

  const resend = async () => {
    await sendEmailVerification(auth.currentUser);
    setSent(true);
  };

  return (
    <div className="page page--narrow">
      <div className="statuscard">
        <p className="eyebrow">신청 현황</p>
        <h2>{STATUS_LABEL[member?.status] || '신청 확인 중'}</h2>
        <dl>
          <div><dt>신청 유형</dt><dd>{MEMBER_TYPE_MAP[member?.memberType]?.label || '-'}</dd></div>
          <div><dt>메일</dt><dd>{user.email}</dd></div>
          <div><dt>메일 인증</dt><dd>{user.emailVerified ? '완료' : '미완료'}</dd></div>
        </dl>

        {!user.emailVerified && (
          <p className="notice">
            메일 인증을 마쳐야 승인 심사가 시작됩니다.{' '}
            <button className="linkbtn" onClick={resend} type="button">인증 메일 다시 보내기</button>
            {sent && ' — 보냈습니다.'}
          </p>
        )}

        {member?.status === 'approved' && (
          <Link className="btn btn--solid" to="/lessons">수업 공간으로 이동</Link>
        )}
        {member?.status === 'rejected' && (
          <p className="notice">
            승인이 거절되었습니다. 문의는 <a className="font-semibold text-primary" href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a> 으로 남겨 주세요.
          </p>
        )}

        <button className="btn btn--ghost" onClick={logout} type="button">로그아웃</button>
      </div>
    </div>
  );
}
