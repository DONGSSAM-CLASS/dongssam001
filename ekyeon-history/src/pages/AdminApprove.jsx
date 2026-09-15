import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { isSignInWithEmailLink, signInWithEmailLink, signOut } from 'firebase/auth';
import { doc, getDoc, updateDoc, serverTimestamp, Timestamp } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import { ADMIN_APPROVER_EMAIL } from '../lib/constants';
import { readable } from '../lib/errors';

const SESSION_TTL_MIN = 15;   // 승인 요청 유효 시간
const GRANT_HOURS = 12;       // 승인 후 관리자 권한 유지 시간

export default function AdminApprove() {
  const [params] = useSearchParams();
  const sessionId = params.get('session');
  const [state, setState] = useState('checking'); // checking | ready | done | error
  const [session, setSession] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    (async () => {
      try {
        if (!sessionId) throw new Error('승인 요청 정보가 없습니다.');
        if (isSignInWithEmailLink(auth, window.location.href)) {
          await signInWithEmailLink(auth, ADMIN_APPROVER_EMAIL, window.location.href);
        }
        if (auth.currentUser?.email !== ADMIN_APPROVER_EMAIL) {
          throw new Error(`${ADMIN_APPROVER_EMAIL} 계정으로 받은 메일 링크를 열어 주세요.`);
        }

        const snap = await getDoc(doc(db, 'adminSessions', sessionId));
        if (!snap.exists()) throw new Error('만료되었거나 존재하지 않는 요청입니다.');

        const data = snap.data();
        const requested = data.requestedAt?.toDate?.();
        if (requested && Date.now() - requested.getTime() > SESSION_TTL_MIN * 60 * 1000) {
          throw new Error('요청이 만료되었습니다. 관리자 화면에서 다시 시도해 주세요.');
        }
        if (data.status === 'approved') throw new Error('이미 승인 처리된 요청입니다.');

        setSession({ id: snap.id, ...data });
        setState('ready');
      } catch (err) {
        setError(err.message || readable(err));
        setState('error');
      }
    })();
  }, [sessionId]);

  const approve = async () => {
    try {
      const until = Timestamp.fromMillis(Date.now() + GRANT_HOURS * 60 * 60 * 1000);
      await updateDoc(doc(db, 'admins', session.uid), {
        verifiedUntil: until,
        lastApprovedAt: serverTimestamp(),
        lastApprovedBy: ADMIN_APPROVER_EMAIL,
      });
      await updateDoc(doc(db, 'adminSessions', session.id), {
        status: 'approved',
        approvedAt: serverTimestamp(),
        approvedBy: ADMIN_APPROVER_EMAIL,
      });
      await signOut(auth);
      setState('done');
    } catch (err) {
      setError(readable(err));
      setState('error');
    }
  };

  const reject = async () => {
    try {
      await updateDoc(doc(db, 'adminSessions', session.id), {
        status: 'rejected',
        approvedAt: serverTimestamp(),
        approvedBy: ADMIN_APPROVER_EMAIL,
      });
      await signOut(auth);
      setState('done');
    } catch (err) {
      setError(readable(err));
      setState('error');
    }
  };

  return (
    <div className="page page--narrow">
      <div className="statuscard">
        <p className="eyebrow">관리자 로그인 승인</p>
        {state === 'checking' && <h2>요청을 확인하는 중…</h2>}

        {state === 'ready' && (
          <>
            <h2>이 로그인을 승인할까요?</h2>
            <dl>
              <div><dt>관리자 아이디</dt><dd>{session.adminId}</dd></div>
              <div><dt>요청 시각</dt><dd>{session.requestedAt?.toDate?.().toLocaleString('ko-KR')}</dd></div>
              <div><dt>기기 정보</dt><dd className="mono">{session.userAgent}</dd></div>
            </dl>
            <p className="hint">본인이 요청한 로그인이 아니라면 거절하고 비밀번호를 바꿔 주세요.</p>
            <div className="form__row">
              <button className="btn btn--solid" onClick={approve} type="button">승인</button>
              <button className="btn btn--ghost" onClick={reject} type="button">거절</button>
            </div>
          </>
        )}

        {state === 'done' && (
          <>
            <h2>처리했습니다</h2>
            <p>요청한 창에서 자동으로 진행됩니다. 이 창은 닫아도 됩니다.</p>
          </>
        )}

        {state === 'error' && (
          <>
            <h2>승인할 수 없습니다</h2>
            <p className="error">{error}</p>
          </>
        )}
      </div>
    </div>
  );
}
