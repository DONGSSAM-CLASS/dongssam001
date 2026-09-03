import { useState, type FormEvent } from 'react';
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import { friendlyError, lookupClassCode, studentSignIn, studentSignUp } from '@/lib/authService';
import { normalizeClassCode } from '@/lib/studentAuth';
import { useAuthStore } from '@/store/authStore';

type Mode = 'login' | 'signup';

/** 학생 입장: 학급코드 → 번호 + 이름(별명) + 4~6자리 비밀번호 */
export default function StudentJoinPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const profile = useAuthStore((s) => s.profile);
  const [code, setCode] = useState(normalizeClassCode(params.get('code') ?? ''));
  const [codeOk, setCodeOk] = useState<boolean | null>(null);
  const [mode, setMode] = useState<Mode>('login');
  const [number, setNumber] = useState('');
  const [name, setName] = useState('');
  const [useNickname, setUseNickname] = useState(false);
  const [pin, setPin] = useState('');
  const [pin2, setPin2] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (profile?.role === 'student') return <Navigate to="/student" replace />;

  const checkCode = async () => {
    setError(null);
    setBusy(true);
    try {
      const cc = await lookupClassCode(code);
      setCodeOk(Boolean(cc));
      if (!cc) setError('학급코드를 찾을 수 없습니다. 선생님께 다시 확인해 주세요.');
    } catch (e) {
      setError(friendlyError(e));
    } finally {
      setBusy(false);
    }
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    if (mode === 'signup' && pin !== pin2) {
      setError('비밀번호 두 번 입력이 서로 다릅니다.');
      return;
    }
    setBusy(true);
    try {
      const n = Number(number);
      if (mode === 'login') await studentSignIn({ code, number: n, pin });
      else await studentSignUp({ code, number: n, pin, displayName: name, nickname: useNickname ? name : undefined });
      navigate('/student', { replace: true });
    } catch (err) {
      const c = (err as { code?: string }).code;
      if (mode === 'login' && (c === 'auth/user-not-found' || c === 'auth/invalid-credential')) {
        setError('번호 또는 비밀번호가 맞지 않습니다. 처음이라면 "처음이에요"를 눌러 가입해 주세요.');
      } else setError(friendlyError(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="min-h-full flex items-center justify-center p-6">
      <div className="w-full max-w-md rounded-2xl bg-slate-800/80 border border-slate-700 p-6">
        <h1 className="text-2xl font-bold">🧑‍🎓 학생 입장</h1>
        <p className="mt-1 text-sm text-slate-300">선생님께 받은 학급코드 6자리를 입력하세요.</p>

        <div className="mt-4 flex gap-2">
          <label className="sr-only" htmlFor="code">학급코드</label>
          <input id="code" value={code} onChange={(e) => { setCode(normalizeClassCode(e.target.value)); setCodeOk(null); }} maxLength={6} placeholder="예: ABC234"
            className="flex-1 rounded-xl bg-slate-900 px-4 py-3 text-lg tracking-[0.3em] uppercase border border-slate-600" autoComplete="off" />
          <button type="button" onClick={checkCode} disabled={busy || code.length !== 6} className="rounded-xl bg-sky-500 px-4 py-3 font-bold disabled:opacity-50">확인</button>
        </div>
        {codeOk && <p className="mt-2 text-sm text-emerald-300">✔ 학급을 찾았습니다.</p>}

        {codeOk && (
          <form onSubmit={submit} className="mt-4 flex flex-col gap-3">
            <div role="tablist" className="flex rounded-xl overflow-hidden border border-slate-600 text-sm">
              <button type="button" role="tab" aria-selected={mode === 'login'} onClick={() => setMode('login')} className={`flex-1 py-2 ${mode === 'login' ? 'bg-amber-400 text-slate-900 font-bold' : 'bg-slate-900'}`}>이미 가입했어요</button>
              <button type="button" role="tab" aria-selected={mode === 'signup'} onClick={() => setMode('signup')} className={`flex-1 py-2 ${mode === 'signup' ? 'bg-amber-400 text-slate-900 font-bold' : 'bg-slate-900'}`}>처음이에요</button>
            </div>
            <label className="flex flex-col gap-1 text-sm">번호
              <input inputMode="numeric" pattern="[0-9]*" value={number} onChange={(e) => setNumber(e.target.value.replace(/\D/g, '').slice(0, 3))} required className="rounded-xl bg-slate-900 px-4 py-2 border border-slate-600" placeholder="예: 7" />
            </label>
            {mode === 'signup' && (
              <>
                <label className="flex flex-col gap-1 text-sm">{useNickname ? '별명' : '이름'}
                  <input value={name} onChange={(e) => setName(e.target.value)} required maxLength={30} className="rounded-xl bg-slate-900 px-4 py-2 border border-slate-600" placeholder={useNickname ? '예: 역사탐험가' : '예: 김하늘'} />
                </label>
                <label className="flex items-center gap-2 text-xs text-slate-300">
                  <input type="checkbox" checked={useNickname} onChange={(e) => setUseNickname(e.target.checked)} className="accent-amber-400" />
                  이름 대신 별명을 쓸래요 (14세 미만 권장)
                </label>
              </>
            )}
            <label className="flex flex-col gap-1 text-sm">비밀번호 (숫자 4~6자리)
              <input type="password" inputMode="numeric" value={pin} onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 6))} required minLength={4} className="rounded-xl bg-slate-900 px-4 py-2 border border-slate-600" />
            </label>
            {mode === 'signup' && (
              <label className="flex flex-col gap-1 text-sm">비밀번호 다시 입력
                <input type="password" inputMode="numeric" value={pin2} onChange={(e) => setPin2(e.target.value.replace(/\D/g, '').slice(0, 6))} required className="rounded-xl bg-slate-900 px-4 py-2 border border-slate-600" />
              </label>
            )}
            {error && <p role="alert" className="text-sm text-red-300">{error}</p>}
            <button type="submit" disabled={busy} className="rounded-xl bg-amber-400 px-4 py-3 font-bold text-slate-900 disabled:opacity-50">{busy ? '잠시만요…' : mode === 'login' ? '들어가기' : '가입하고 들어가기'}</button>
            <p className="text-[11px] text-slate-400">이름(또는 별명)과 번호 외에는 어떤 개인정보도 수집하지 않습니다. 비밀번호를 잊으면 선생님께 초기화를 요청하세요.</p>
          </form>
        )}
        <p className="mt-4 text-xs"><Link className="underline" to="/">← 처음으로</Link> · <Link className="underline" to="/globe">로그인 없이 둘러보기</Link></p>
      </div>
    </main>
  );
}
