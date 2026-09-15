import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { sendPasswordResetEmail, signInWithEmailAndPassword } from 'firebase/auth';
import { auth, isFirebaseConfigured } from '../lib/firebase';
import { readable } from '../lib/errors';
import SectionTitle from '../components/SectionTitle';
import FirebaseNotice from '../components/FirebaseNotice';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const submit = async (event) => {
    event.preventDefault();
    setError(''); setMsg('');
    if (!isFirebaseConfigured) return setError('아직 회원 기능이 연결되지 않았습니다.');
    setBusy(true);
    try {
      await signInWithEmailAndPassword(auth, email.trim(), password);
      navigate(location.state?.from?.pathname || '/lessons', { replace: true });
    } catch (err) {
      setError(readable(err));
    } finally {
      setBusy(false);
    }
  };

  const reset = async () => {
    if (!email.trim()) return setError('메일 주소를 먼저 입력해 주세요.');
    try {
      await sendPasswordResetEmail(auth, email.trim());
      setError('');
      setMsg('비밀번호 재설정 메일을 보냈습니다. 받은편지함을 확인해 주세요.');
    } catch (err) {
      setError(readable(err));
    }
    return undefined;
  };

  return (
    <div className="page page--narrow">
      <SectionTitle eyebrow="Members" title="회원 로그인" lead="가입할 때 등록한 메일 주소와 비밀번호로 로그인해 주세요." />
      <FirebaseNotice />
      <form className="form" onSubmit={submit}>
        <label>
          메일 주소
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" />
        </label>
        <label>
          비밀번호
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required autoComplete="current-password" />
        </label>
        {error && <p className="error" role="alert">{error}</p>}
        {msg && <p className="notice">{msg}</p>}
        <button className="btn btn--solid btn--lg" disabled={busy || !isFirebaseConfigured} type="submit">
          {busy ? '확인 중…' : '로그인'}
        </button>
        <div className="form__links">
          <button type="button" className="linkbtn" onClick={reset}>비밀번호 재설정</button>
          <Link to="/signup">처음 오셨나요?</Link>
        </div>
      </form>
    </div>
  );
}
