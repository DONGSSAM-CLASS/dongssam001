import { useState } from 'react';
import { Link } from 'react-router-dom';
import { signInTeacher } from '../lib/auth';
import { Button, Card, Notice } from '../components/ui';

export default function TeacherLogin() {
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function handle() {
    setBusy(true);
    setError('');
    try {
      await signInTeacher();
    } catch {
      setError('로그인에 실패했습니다. 잠시 뒤 다시 시도해 주세요.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-center gap-5 px-4">
      <Card title="선생님 로그인" tone="navy">
        <p className="mb-4 text-base text-gray-600">
          Google 계정으로 로그인합니다. 처음이라면 로그인 후 학급을 만듭니다.
        </p>
        <Button full onClick={handle} disabled={busy}>
          {busy ? '연결하는 중…' : 'Google 계정으로 로그인'}
        </Button>
        {error && <div className="mt-4"><Notice kind="error">{error}</Notice></div>}
      </Card>
      <Link to="/" className="text-center text-base font-bold text-navy-600">처음 화면으로</Link>
    </main>
  );
}
