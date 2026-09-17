import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createClass } from '../lib/classService';
import { useSession } from '../store/session';
import { Button, Card, Field, Notice, inputClass } from '../components/ui';

export default function TeacherClassSetup() {
  const user = useSession((s) => s.user);
  const setClass = useSession((s) => s.setClass);
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [created, setCreated] = useState<{ classId: string; classCode: string } | null>(null);

  async function handle() {
    if (!user) return;
    setBusy(true);
    setError('');
    try {
      const result = await createClass(user.uid, name);
      setCreated(result);
      await setClass(result.classId);
    } catch (e) {
      setError(e instanceof Error ? e.message : '학급을 만들지 못했습니다.');
    } finally {
      setBusy(false);
    }
  }

  if (created) {
    return (
      <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-center gap-5 px-4">
        <Card title="학급이 만들어졌습니다" tone="emerald">
          <p className="text-base text-gray-600">학생들에게 알려 줄 학급 코드입니다.</p>
          <p className="my-5 text-center text-5xl font-black tracking-widest text-navy-700">
            {created.classCode}
          </p>
          <Notice>
            이 코드는 학생 로그인에 쓰입니다. 다음 화면에서 학생 명단을 등록하면
            번호별 PIN과 인쇄용 로그인 카드가 만들어집니다.
          </Notice>
          <div className="mt-5">
            <Button full onClick={() => navigate('/teacher/students')}>학생 명단 등록하러 가기</Button>
          </div>
        </Card>
      </main>
    );
  }

  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-center gap-5 px-4">
      <Card title="학급 만들기" tone="navy">
        <Field label="학급 이름" hint="예: 2학년 4반">
          <input className={inputClass} value={name} onChange={(e) => setName(e.target.value)} maxLength={30} />
        </Field>
        <div className="mt-5">
          <Button full onClick={handle} disabled={busy || !name.trim()}>
            {busy ? '만드는 중…' : '학급 만들기'}
          </Button>
        </div>
        {error && <div className="mt-4"><Notice kind="error">{error}</Notice></div>}
      </Card>
    </main>
  );
}
