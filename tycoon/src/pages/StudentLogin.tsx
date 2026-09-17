import { useState } from 'react';
import { Link } from 'react-router-dom';
import { signInStudent } from '../lib/auth';
import { Button, Card, Field, Notice, inputClass } from '../components/ui';

export default function StudentLogin() {
  const [code, setCode] = useState('');
  const [number, setNumber] = useState('');
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function handle() {
    setBusy(true);
    setError('');
    try {
      await signInStudent(code, number, pin);
      // 로그인 뒤 화면 전환은 세션 스토어가 맡습니다.
    } catch (e) {
      setError(e instanceof Error ? e.message : '로그인하지 못했습니다.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-center gap-5 px-4 py-8">
      <Card title="학생 로그인" tone="sky">
        <form
          className="space-y-4"
          onSubmit={(e) => { e.preventDefault(); void handle(); }}
        >
          <Field label="학급 코드" hint="로그인 카드에 적힌 6자리">
            <input
              className={`${inputClass} font-mono text-xl tracking-widest uppercase`}
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              maxLength={6}
              autoCapitalize="characters"
              autoComplete="off"
            />
          </Field>
          <Field label="번호">
            <input
              className={`${inputClass} font-mono text-xl`}
              value={number}
              onChange={(e) => setNumber(e.target.value.replace(/\D/g, ''))}
              inputMode="numeric"
              maxLength={3}
            />
          </Field>
          <Field label="PIN" hint="숫자 4~6자리. 다른 사람에게 알려 주지 마세요.">
            <input
              className={`${inputClass} font-mono text-xl tracking-widest`}
              type="password"
              value={pin}
              onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
              inputMode="numeric"
              maxLength={6}
            />
          </Field>
          <Button type="submit" full disabled={busy || !code || !number || !pin}>
            {busy ? '들어가는 중…' : '들어가기'}
          </Button>
        </form>
        {error && <div className="mt-4"><Notice kind="error">{error}</Notice></div>}
      </Card>
      <Link to="/" className="text-center text-base font-bold text-navy-600">처음 화면으로</Link>
    </main>
  );
}
