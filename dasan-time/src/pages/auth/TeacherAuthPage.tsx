import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { KeyRound, LogIn, Mail, School, UserPlus } from 'lucide-react';
import { useAuth } from '../../app/AuthContext';
import { friendlyAuthError, resetPassword, teacherSignIn, teacherSignUp } from '../../lib/authService';
import { APP } from '../../content/lessons';
import { ErrorNotice, Loading } from '../../components/States';

type Tab = 'login' | 'signup';

export default function TeacherAuthPage() {
  const { ready, teacher } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>('login');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const [form, setForm] = useState({
    school: '',
    name: '',
    subject: '역사',
    email: '',
    password: '',
    passwordConfirm: '',
  });

  const set = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));

  if (!ready) return <Loading />;
  if (teacher) return <Navigate to="/teacher" replace />;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setNotice('');

    if (tab === 'signup') {
      if (form.password.length < 8) {
        setError('비밀번호는 8자 이상으로 정해 주세요.');
        return;
      }
      if (form.password !== form.passwordConfirm) {
        setError('비밀번호 확인이 맞지 않아요.');
        return;
      }
      if (!form.school.trim() || !form.name.trim()) {
        setError('소속 학교와 성함을 적어 주세요.');
        return;
      }
    }

    setBusy(true);
    try {
      if (tab === 'signup') {
        await teacherSignUp({
          school: form.school.trim(),
          name: form.name.trim(),
          subject: form.subject.trim(),
          email: form.email.trim(),
          password: form.password,
        });
      } else {
        await teacherSignIn(form.email.trim(), form.password);
      }
      navigate('/teacher');
    } catch (err) {
      setError(friendlyAuthError(err));
    } finally {
      setBusy(false);
    }
  }

  async function handleReset() {
    setError('');
    setNotice('');
    if (!form.email.trim()) {
      setError('비밀번호를 새로 정하려면 이메일을 먼저 적어 주세요.');
      return;
    }
    try {
      await resetPassword(form.email.trim());
      setNotice('비밀번호를 새로 정하는 메일을 보냈어요. 메일함을 확인해 주세요.');
    } catch (err) {
      setError(friendlyAuthError(err));
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-base-200 px-4 py-10">
      <div className="card w-full max-w-lg rounded-2xl bg-base-100 shadow-sm">
        <div className="card-body gap-4 p-6">
          <header className="text-center">
            <School className="mx-auto h-10 w-10 text-secondary" aria-hidden />
            <h1 className="mt-2 text-2xl font-extrabold">선생님으로 시작하기</h1>
            <p className="text-sm opacity-70">{APP.name}</p>
          </header>

          <div role="tablist" className="tabs tabs-boxed rounded-2xl">
            <button
              role="tab"
              type="button"
              className={`tab ${tab === 'login' ? 'tab-active' : ''}`}
              onClick={() => setTab('login')}
            >
              로그인
            </button>
            <button
              role="tab"
              type="button"
              className={`tab ${tab === 'signup' ? 'tab-active' : ''}`}
              onClick={() => setTab('signup')}
            >
              회원가입
            </button>
          </div>

          <form className="flex flex-col gap-3" onSubmit={handleSubmit}>
            {tab === 'signup' && (
              <>
                <Field label="소속 학교" value={form.school} onChange={set('school')} placeholder="○○중학교" required />
                <Field label="성함" value={form.name} onChange={set('name')} placeholder="김다산" required />
                <Field label="담당 교과" value={form.subject} onChange={set('subject')} placeholder="역사" required />
              </>
            )}
            <Field
              label="이메일"
              type="email"
              value={form.email}
              onChange={set('email')}
              placeholder="teacher@example.com"
              required
              autoComplete="username"
            />
            <Field
              label={tab === 'signup' ? '비밀번호 (8자 이상)' : '비밀번호'}
              type="password"
              value={form.password}
              onChange={set('password')}
              required
              autoComplete={tab === 'signup' ? 'new-password' : 'current-password'}
            />
            {tab === 'signup' && (
              <Field
                label="비밀번호 확인"
                type="password"
                value={form.passwordConfirm}
                onChange={set('passwordConfirm')}
                required
                autoComplete="new-password"
              />
            )}

            {error && <ErrorNotice message={error} />}
            {notice && (
              <div className="alert alert-success rounded-2xl" role="status">
                <span>{notice}</span>
              </div>
            )}

            <button type="submit" className="btn btn-secondary mt-1 gap-2 rounded-2xl" disabled={busy}>
              {busy ? (
                <span className="loading loading-spinner loading-sm" aria-hidden />
              ) : tab === 'signup' ? (
                <UserPlus className="h-5 w-5" aria-hidden />
              ) : (
                <LogIn className="h-5 w-5" aria-hidden />
              )}
              {tab === 'signup' ? '가입하기' : '로그인'}
            </button>
          </form>

          <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
            <button type="button" className="btn btn-ghost btn-sm gap-1 rounded-2xl" onClick={handleReset}>
              <KeyRound className="h-4 w-4" aria-hidden />
              비밀번호를 잊으셨나요?
            </button>
            <Link to="/" className="btn btn-ghost btn-sm rounded-2xl">
              첫 화면으로
            </Link>
          </div>

          {tab === 'signup' && (
            <p className="flex items-start gap-2 rounded-2xl bg-base-200 p-3 text-xs opacity-80">
              <Mail className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
              가입하시면 이메일 인증 메일이 갑니다. 메일함에서 인증을 마쳐 주세요.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  ...rest
}: { label: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className="form-control w-full">
      <span className="label-text mb-1 font-bold">{label}</span>
      <input className="input input-bordered w-full rounded-2xl" {...rest} />
    </label>
  );
}
