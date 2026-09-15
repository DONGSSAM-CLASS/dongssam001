import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  signInWithEmailAndPassword,
  sendSignInLinkToEmail,
  signOut,
} from 'firebase/auth';
import { doc, getDoc, setDoc, onSnapshot, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import { ADMIN_APPROVER_EMAIL, ADMIN_ID_DOMAIN } from '../lib/constants';
import { readable } from '../lib/errors';
import SectionTitle from '../components/SectionTitle';
import FirebaseNotice from '../components/FirebaseNotice';

// 관리자 로그인 = 아이디/비밀번호(1단계) + 승인 메일 클릭(2단계)
export default function AdminLogin() {
  const [adminId, setAdminId] = useState('');
  const [password, setPassword] = useState('');
  const [stage, setStage] = useState('form'); // form | waiting
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [uid, setUid] = useState(null);
  const navigate = useNavigate();

  // 2단계 승인이 끝나면 admins/{uid}.verifiedUntil 이 미래로 갱신됩니다.
  useEffect(() => {
    if (!uid) return undefined;
    return onSnapshot(doc(db, 'admins', uid), (s) => {
      const until = s.data()?.verifiedUntil?.toDate?.();
      if (until && until.getTime() > Date.now()) navigate('/admin', { replace: true });
    });
  }, [uid, navigate]);

  const submit = async (e) => {
    e.preventDefault();
    setError(''); setBusy(true);
    try {
      const email = `${adminId.trim().toLowerCase()}@${ADMIN_ID_DOMAIN}`;
      const cred = await signInWithEmailAndPassword(auth, email, password);

      const adminSnap = await getDoc(doc(db, 'admins', cred.user.uid));
      if (!adminSnap.exists()) {
        await signOut(auth);
        throw new Error('관리자 권한이 없는 계정입니다.');
      }

      const until = adminSnap.data()?.verifiedUntil?.toDate?.();
      if (until && until.getTime() > Date.now()) {
        navigate('/admin', { replace: true });
        return;
      }

      const sessionId =
        crypto.randomUUID?.() || Math.random().toString(36).slice(2) + Date.now().toString(36);

      await setDoc(doc(db, 'adminSessions', sessionId), {
        uid: cred.user.uid,
        adminId: adminId.trim().toLowerCase(),
        status: 'requested',
        requestedAt: serverTimestamp(),
        userAgent: navigator.userAgent.slice(0, 200),
      });

      await sendSignInLinkToEmail(auth, ADMIN_APPROVER_EMAIL, {
        url: `${window.location.origin}/admin/approve?session=${sessionId}`,
        handleCodeInApp: true,
      });

      setUid(cred.user.uid);
      setStage('waiting');
    } catch (err) {
      setError(err.message?.startsWith('관리자') ? err.message : readable(err));
    } finally {
      setBusy(false);
    }
  };

  if (stage === 'waiting') {
    return (
      <div className="page page--narrow">
        <div className="statuscard">
          <p className="eyebrow">2단계 확인</p>
          <h2>승인 메일을 보냈습니다</h2>
          <p>
            {ADMIN_APPROVER_EMAIL} 받은편지함에서 링크를 열고 이 로그인을 승인해 주세요.
            승인되면 이 화면이 자동으로 운영 도구로 넘어갑니다.
          </p>
          <p className="hint">
            링크는 승인 계정으로 로그인되므로 <strong>다른 브라우저나 휴대폰</strong>에서 여는 것을 권합니다.
            이 창은 그대로 두세요.
          </p>
          <button className="btn btn--ghost" type="button" onClick={() => { signOut(auth); setStage('form'); setUid(null); }}>
            취소하고 로그아웃
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="page page--narrow">
      <SectionTitle
        eyebrow="운영진 전용"
        title="관리자 로그인"
        lead={`아이디와 비밀번호를 확인한 뒤 ${ADMIN_APPROVER_EMAIL} 승인까지 마쳐야 들어갈 수 있습니다.`}
      />
      <FirebaseNotice />
      <form className="form" onSubmit={submit}>
        <label>
          관리자 아이디
          <input value={adminId} onChange={(e) => setAdminId(e.target.value)} required autoComplete="username" />
        </label>
        <label>
          비밀번호
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required autoComplete="current-password" />
        </label>
        {error && <p className="error" role="alert">{error}</p>}
        <button className="btn btn--solid btn--lg" disabled={busy} type="submit">
          {busy ? '확인 중…' : '승인 요청 보내기'}
        </button>
      </form>
    </div>
  );
}
