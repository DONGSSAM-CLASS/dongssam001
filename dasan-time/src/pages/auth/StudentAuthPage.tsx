import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { CircleHelp, GraduationCap, KeyRound, LogIn, UserPlus } from 'lucide-react';
import { useAuth } from '../../app/AuthContext';
import { friendlyAuthError, studentSignIn, studentSignUp } from '../../lib/authService';
import { lookupClassCode } from '../../lib/db';
import { isValidClassCode, isValidLoginId, normalizeClassCode } from '../../lib/code';
import { APP, UI_TEXT } from '../../content/lessons';
import { ErrorNotice, Loading } from '../../components/States';

type Tab = 'login' | 'signup';

interface FoundClass {
  classId: string;
  className: string;
  teacherName: string;
  joinOpen: boolean;
}

export default function StudentAuthPage() {
  const { ready, student } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>('login');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  // 회원가입 1단계: 학급 코드 확인
  const [code, setCode] = useState('');
  const [found, setFound] = useState<FoundClass | null>(null);
  const [confirmed, setConfirmed] = useState(false);

  const [form, setForm] = useState({ name: '', number: '', loginId: '', password: '' });
  const set = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));

  if (!ready) return <Loading />;
  if (student) return <Navigate to="/student" replace />;

  async function checkCode() {
    setError('');
    const clean = normalizeClassCode(code);
    setCode(clean);
    if (!isValidClassCode(clean)) {
      setError('학급 코드는 6글자예요. 칠판에 적힌 코드를 다시 볼까요?');
      return;
    }
    setBusy(true);
    try {
      const entry = await lookupClassCode(clean);
      if (!entry) {
        setError('그런 학급 코드가 없어요. 코드를 다시 확인해 볼까요?');
        setFound(null);
        return;
      }
      setFound({
        classId: entry.classId,
        className: entry.className,
        teacherName: entry.teacherName,
        joinOpen: entry.joinOpen,
      });
    } catch (err) {
      setError(friendlyAuthError(err));
    } finally {
      setBusy(false);
    }
  }

  async function handleSignUp(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    const number = Number(form.number);
    if (!form.name.trim()) return setError('이름을 적어 주세요.');
    if (!Number.isInteger(number) || number < 1 || number > 60) {
      return setError('번호는 1부터 60 사이의 숫자로 적어 주세요.');
    }
    if (!isValidLoginId(form.loginId)) {
      return setError('아이디는 영문 소문자와 숫자로 4~12자로 만들어요.');
    }
    if (form.password.length < 6) return setError('비밀번호는 6자 이상으로 정해요.');

    setBusy(true);
    try {
      await studentSignUp({
        code,
        name: form.name.trim(),
        number,
        loginId: form.loginId.trim().toLowerCase(),
        password: form.password,
      });
      navigate('/student');
    } catch (err) {
      setError(friendlyAuthError(err));
    } finally {
      setBusy(false);
    }
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      await studentSignIn(form.loginId.trim().toLowerCase(), form.password);
      navigate('/student');
    } catch (err) {
      setError(friendlyAuthError(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-base-200 px-4 py-10">
      <div className="card w-full max-w-md rounded-2xl bg-base-100 shadow-sm">
        <div className="card-body gap-4 p-6">
          <header className="text-center">
            <GraduationCap className="mx-auto h-10 w-10 text-primary" aria-hidden />
            <h1 className="mt-2 text-2xl font-extrabold">학생으로 시작하기</h1>
            <p className="text-sm opacity-70">{APP.name}</p>
          </header>

          <div role="tablist" className="tabs tabs-boxed rounded-2xl">
            <button
              role="tab"
              type="button"
              className={`tab ${tab === 'login' ? 'tab-active' : ''}`}
              onClick={() => {
                setTab('login');
                setError('');
              }}
            >
              로그인
            </button>
            <button
              role="tab"
              type="button"
              className={`tab ${tab === 'signup' ? 'tab-active' : ''}`}
              onClick={() => {
                setTab('signup');
                setError('');
              }}
            >
              처음이에요
            </button>
          </div>

          {tab === 'login' ? (
            /* 로그인 화면에는 아이디와 비밀번호만 보여 준다. */
            <form className="flex flex-col gap-3" onSubmit={handleLogin}>
              <Field label="아이디" value={form.loginId} onChange={set('loginId')} autoComplete="username" required />
              <Field
                label="비밀번호"
                type="password"
                value={form.password}
                onChange={set('password')}
                autoComplete="current-password"
                required
              />
              {error && <ErrorNotice message={error} />}
              <button type="submit" className="btn btn-primary gap-2 rounded-2xl" disabled={busy}>
                {busy ? <span className="loading loading-spinner loading-sm" aria-hidden /> : <LogIn className="h-5 w-5" aria-hidden />}
                들어가기
              </button>
              <div className="collapse-arrow collapse rounded-2xl bg-base-200">
                <input type="checkbox" aria-label="비밀번호를 잊었을 때 안내 펼치기" />
                <div className="collapse-title flex items-center gap-2 text-sm font-semibold">
                  <CircleHelp className="h-4 w-4" aria-hidden />
                  비밀번호를 잊었어요
                </div>
                <div className="collapse-content text-sm opacity-80">
                  <p>{UI_TEXT.passwordHelp}</p>
                </div>
              </div>
            </form>
          ) : !found || !confirmed ? (
            /* 회원가입 1단계 — 학급 코드부터 확인한다. */
            <div className="flex flex-col gap-3">
              <label className="form-control w-full">
                <span className="label-text mb-1 font-bold">학급 코드 (6글자)</span>
                <input
                  className="input input-bordered w-full rounded-2xl text-center text-2xl font-extrabold tracking-[0.3em]"
                  value={code}
                  maxLength={6}
                  inputMode="text"
                  autoCapitalize="characters"
                  placeholder="ABC234"
                  onChange={(e) => setCode(normalizeClassCode(e.target.value))}
                />
              </label>
              {error && <ErrorNotice message={error} />}
              {found && (
                <div className="rounded-2xl bg-primary/10 p-4 text-center">
                  <p className="text-lg font-bold">
                    {found.teacherName} 선생님의 {found.className}이 맞나요?
                  </p>
                  {!found.joinOpen && (
                    <p className="mt-2 text-sm font-semibold text-warning">
                      지금은 가입이 잠겨 있어요. 선생님께 말씀드려 주세요.
                    </p>
                  )}
                  <div className="mt-3 flex justify-center gap-2">
                    <button
                      type="button"
                      className="btn btn-ghost rounded-2xl"
                      onClick={() => {
                        setFound(null);
                        setCode('');
                      }}
                    >
                      아니에요
                    </button>
                    <button
                      type="button"
                      className="btn btn-primary rounded-2xl"
                      disabled={!found.joinOpen}
                      onClick={() => setConfirmed(true)}
                    >
                      맞아요
                    </button>
                  </div>
                </div>
              )}
              {!found && (
                <button
                  type="button"
                  className="btn btn-primary gap-2 rounded-2xl"
                  disabled={busy}
                  onClick={() => void checkCode()}
                >
                  {busy ? <span className="loading loading-spinner loading-sm" aria-hidden /> : <KeyRound className="h-5 w-5" aria-hidden />}
                  학급 확인하기
                </button>
              )}
            </div>
          ) : (
            /* 회원가입 2단계 */
            <form className="flex flex-col gap-3" onSubmit={handleSignUp}>
              <p className="rounded-2xl bg-primary/10 p-3 text-center text-sm font-semibold">
                {found.teacherName} 선생님 · {found.className}
              </p>
              <Field label="이름" value={form.name} onChange={set('name')} required />
              <Field
                label="번호"
                type="number"
                min={1}
                max={60}
                value={form.number}
                onChange={set('number')}
                required
              />
              <Field
                label="아이디 (영문 소문자·숫자 4~12자)"
                value={form.loginId}
                onChange={(e) =>
                  setForm((f) => ({ ...f, loginId: e.target.value.toLowerCase().replace(/[^a-z0-9]/g, '') }))
                }
                autoComplete="username"
                required
              />
              <Field
                label="비밀번호 (6자 이상)"
                type="password"
                value={form.password}
                onChange={set('password')}
                autoComplete="new-password"
                required
              />
              <p className="text-xs opacity-70">
                이메일이나 전화번호는 받지 않아요. 아이디와 비밀번호만 기억하면 돼요.
              </p>
              {error && <ErrorNotice message={error} />}
              <button type="submit" className="btn btn-primary gap-2 rounded-2xl" disabled={busy}>
                {busy ? <span className="loading loading-spinner loading-sm" aria-hidden /> : <UserPlus className="h-5 w-5" aria-hidden />}
                가입하기
              </button>
            </form>
          )}

          <Link to="/" className="btn btn-ghost btn-sm rounded-2xl">
            첫 화면으로
          </Link>
        </div>
      </div>
    </div>
  );
}

function Field({ label, ...rest }: { label: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className="form-control w-full">
      <span className="label-text mb-1 font-bold">{label}</span>
      <input className="input input-bordered w-full rounded-2xl" {...rest} />
    </label>
  );
}
