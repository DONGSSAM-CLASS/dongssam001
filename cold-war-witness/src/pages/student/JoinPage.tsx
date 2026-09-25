/**
 * 학생 입장 — 한 화면에 한 가지씩
 *  처음 들어오기: ① 학급 코드 → ② 번호 · 닉네임 → ③ PIN 만들기
 *  이어 하기(다른 기기): 학급 코드 · 번호 · PIN
 */
import { useState, type FormEvent } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Layout } from '../../components/Layout';
import { Button, Notice, TextInput, friendlyError } from '../../components/ui';
import { useAuth } from '../../app/AuthContext';
import { useStudent } from '../../app/StudentContext';
import { isValidClassCode, normalizeClassCode } from '../../lib/code';
import { isValidPin } from '../../lib/hash';
import { joinClass, lookupClassCode, recoverStudent, type ClassLookup } from '../../lib/db';
import { LIMITS, PRIVACY_NOTICE } from '../../config';

type Mode = 'new' | 'recover';

function parseNumber(v: string): number | null {
  if (!/^[0-9]{1,2}$/.test(v)) return null;
  const n = Number(v);
  return n >= 1 && n <= LIMITS.studentNumberMax ? n : null;
}

export default function JoinPage() {
  const [params] = useSearchParams();
  const [mode, setMode] = useState<Mode>(params.get('mode') === 'recover' ? 'recover' : 'new');
  return (
    <Layout>
      <h1 className="typewriter text-2xl font-bold">학생 입장</h1>
      <div className="mt-4 grid grid-cols-2 gap-2" role="tablist" aria-label="입장 방법">
        {(
          [
            ['new', '처음 들어와요'],
            ['recover', '다른 기기에서 이어 해요'],
          ] as const
        ).map(([m, label]) => (
          <button
            key={m}
            type="button"
            role="tab"
            aria-selected={mode === m}
            onClick={() => setMode(m)}
            className={`min-h-12 rounded-md border-2 px-2 font-bold ${
              mode === m ? 'border-ink bg-ink text-paper' : 'border-line bg-white text-ink'
            }`}
          >
            {label}
          </button>
        ))}
      </div>
      <Notice tone="info" className="mt-4">
        🔒 <strong>{PRIVACY_NOTICE}</strong> 이름·전화번호·이메일은 쓰지 않아요.
      </Notice>
      <div className="mt-4">{mode === 'new' ? <NewJoin initialCode={params.get('code') ?? ''} /> : <Recover initialCode={params.get('code') ?? ''} />}</div>
    </Layout>
  );
}

/** 학급 코드 확인 단계 (두 방식이 같이 쓴다) */
function useClassCodeStep(initialCode: string) {
  const { ensureStudent } = useAuth();
  const [code, setCode] = useState(initialCode);
  const [found, setFound] = useState<ClassLookup | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const check = async (): Promise<ClassLookup | null> => {
    const c = normalizeClassCode(code);
    setCode(c);
    if (!isValidClassCode(c)) {
      setError('학급 코드는 6글자예요. 칠판에 적힌 코드를 다시 확인해 주세요.');
      return null;
    }
    setBusy(true);
    setError(null);
    try {
      await ensureStudent();
      const r = await lookupClassCode(c);
      if (!r) setError('그런 학급 코드가 없어요. 0(숫자)과 O(영어), 1과 I를 헷갈리지 않았는지 확인해 주세요.');
      setFound(r);
      return r;
    } catch (e) {
      setError(friendlyError(e));
      return null;
    } finally {
      setBusy(false);
    }
  };
  return { code, setCode, found, setFound, error, busy, check };
}

function StepBadge({ now, total }: { now: number; total: number }) {
  return (
    <p className="typewriter text-[15px] text-ink-soft" aria-label={`${total}단계 가운데 ${now}단계`}>
      {Array.from({ length: total }, (_, i) => (i < now ? '●' : '○')).join(' ')} &nbsp;{now}/{total} 단계
    </p>
  );
}

function NewJoin({ initialCode }: { initialCode: string }) {
  const nav = useNavigate();
  const { ensureStudent } = useAuth();
  const { start } = useStudent();
  const cc = useClassCodeStep(initialCode);
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [num, setNum] = useState('');
  const [nick, setNick] = useState('');
  const [pin, setPin] = useState('');
  const [pin2, setPin2] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submitCode = async (e: FormEvent) => {
    e.preventDefault();
    if (await cc.check()) setStep(2);
  };

  const submitWho = (e: FormEvent) => {
    e.preventDefault();
    if (!parseNumber(num)) return setError(`번호는 1부터 ${LIMITS.studentNumberMax}까지 숫자로 써 주세요.`);
    const n = nick.trim();
    if (n.length < 1) return setError('닉네임을 써 주세요.');
    if (n.length > LIMITS.nickname) return setError(`닉네임은 ${LIMITS.nickname}글자까지 쓸 수 있어요.`);
    setError(null);
    setStep(3);
  };

  const submitPin = async (e: FormEvent) => {
    e.preventDefault();
    if (!isValidPin(pin)) return setError('PIN은 숫자 4개예요. (예: 2580)');
    if (pin !== pin2) return setError('두 PIN이 달라요. 똑같이 두 번 써 주세요.');
    const number = parseNumber(num)!;
    const cls = cc.found!;
    setBusy(true);
    setError(null);
    try {
      const user = await ensureStudent();
      const r = await joinClass(user.uid, cls.classId, number, nick.trim(), pin);
      if (!r.ok) {
        setError(
          r.reason === 'taken'
            ? `${number}번은 이미 누군가 쓰고 있어요. 내 번호가 맞는지 확인하고, 예전에 이 번호로 들어온 적이 있다면 위의 ‘다른 기기에서 이어 해요’를 눌러 주세요.`
            : '들어가지 못했어요. 인터넷 연결을 확인하고 다시 눌러 주세요.',
        );
        return;
      }
      start({ classId: cls.classId, classCode: cc.code, className: cls.className, studentId: r.studentId, number });
      nav('/play', { replace: true, state: { welcome: r.resumed ? 'resumed' : 'new' } });
    } catch (err) {
      setError(friendlyError(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="dossier p-5">
      {step === 1 && (
        <form onSubmit={submitCode} className="flex flex-col gap-4" noValidate>
          <StepBadge now={1} total={3} />
          <TextInput
            label="학급 코드"
            hint="선생님이 알려 준 6글자 코드를 써 주세요."
            value={cc.code}
            onChange={(v) => cc.setCode(v.toUpperCase())}
            maxLength={8}
            autoFocus
            placeholder="예: K7MPQ2"
            error={cc.error}
          />
          <Button type="submit" disabled={cc.busy || cc.code.trim().length === 0}>
            {cc.busy ? '확인하는 중…' : '다음'}
          </Button>
        </form>
      )}
      {step === 2 && (
        <form onSubmit={submitWho} className="flex flex-col gap-4" noValidate>
          <StepBadge now={2} total={3} />
          <p className="rounded bg-paper px-3 py-2">
            📁 <strong>{cc.found?.className}</strong> 에 들어가요.{' '}
            <button type="button" className="underline" onClick={() => setStep(1)}>
              코드 다시 쓰기
            </button>
          </p>
          <TextInput label="내 번호" hint="출석 번호를 숫자로 써 주세요." value={num} onChange={(v) => setNum(v.replace(/[^0-9]/g, ''))} inputMode="numeric" maxLength={2} autoFocus placeholder="예: 7" />
          <TextInput
            label="닉네임"
            hint={`실명 말고 별명을 써 주세요. (${LIMITS.nickname}글자까지)`}
            value={nick}
            onChange={setNick}
            maxLength={LIMITS.nickname}
            placeholder="예: 파란연필"
          />
          {error && <Notice tone="error">{error}</Notice>}
          <Button type="submit">다음</Button>
        </form>
      )}
      {step === 3 && (
        <form onSubmit={submitPin} className="flex flex-col gap-4" noValidate>
          <StepBadge now={3} total={3} />
          <p>
            <strong>PIN 4자리</strong>를 만들어요. 다른 기기에서 이어 할 때 필요해요.
            <br />
            <span className="text-ink-soft">생일이나 1234처럼 쉬운 숫자는 피하고, 꼭 기억해 두세요. 친구에게 알려 주지 마세요.</span>
          </p>
          <TextInput label="PIN (숫자 4개)" type="password" value={pin} onChange={(v) => setPin(v.replace(/[^0-9]/g, ''))} inputMode="numeric" maxLength={4} autoComplete="new-password" autoFocus />
          <TextInput label="PIN 한 번 더" type="password" value={pin2} onChange={(v) => setPin2(v.replace(/[^0-9]/g, ''))} inputMode="numeric" maxLength={4} autoComplete="new-password" />
          {error && <Notice tone="error">{error}</Notice>}
          <div className="flex gap-2">
            <Button variant="secondary" onClick={() => setStep(2)} disabled={busy}>
              이전
            </Button>
            <Button type="submit" className="flex-1" disabled={busy}>
              {busy ? '들어가는 중…' : '입장하기'}
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}

function Recover({ initialCode }: { initialCode: string }) {
  const nav = useNavigate();
  const { ensureStudent } = useAuth();
  const { start } = useStudent();
  const cc = useClassCodeStep(initialCode);
  const [num, setNum] = useState('');
  const [pin, setPin] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    const number = parseNumber(num);
    if (!number) return setError(`번호는 1부터 ${LIMITS.studentNumberMax}까지 숫자로 써 주세요.`);
    if (!isValidPin(pin)) return setError('PIN은 숫자 4개예요.');
    const cls = cc.found ?? (await cc.check());
    if (!cls) return;
    setBusy(true);
    try {
      const user = await ensureStudent();
      const r = await recoverStudent(user.uid, cls.classId, number, pin);
      if (!r.ok) {
        setError(
          r.reason === 'wrong'
            ? '번호나 PIN이 맞지 않아요. PIN이 기억나지 않으면 선생님께 “PIN 초기화”를 부탁해 주세요.'
            : '들어가지 못했어요. 인터넷 연결을 확인하고 다시 눌러 주세요.',
        );
        return;
      }
      start({ classId: cls.classId, classCode: normalizeClassCode(cc.code), className: cls.className, studentId: r.studentId, number });
      nav('/play', { replace: true, state: { welcome: 'resumed' } });
    } catch (err) {
      setError(friendlyError(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} className="dossier flex flex-col gap-4 p-5" noValidate>
      <p>처음 들어올 때 쓴 <strong>학급 코드 · 번호 · PIN</strong>을 써 주세요. 하던 곳부터 이어서 할 수 있어요.</p>
      <TextInput
        label="학급 코드"
        value={cc.code}
        onChange={(v) => {
          cc.setCode(v.toUpperCase());
          cc.setFound(null);
        }}
        maxLength={8}
        placeholder="예: K7MPQ2"
        error={cc.error}
      />
      <TextInput label="내 번호" value={num} onChange={(v) => setNum(v.replace(/[^0-9]/g, ''))} inputMode="numeric" maxLength={2} />
      <TextInput label="PIN (숫자 4개)" type="password" value={pin} onChange={(v) => setPin(v.replace(/[^0-9]/g, ''))} inputMode="numeric" maxLength={4} autoComplete="current-password" />
      {error && <Notice tone="error">{error}</Notice>}
      <Button type="submit" disabled={busy || cc.busy}>
        {busy || cc.busy ? '확인하는 중…' : '이어 하기'}
      </Button>
    </form>
  );
}
