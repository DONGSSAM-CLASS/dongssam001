import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useSession } from '../store/session';
import {
  listRoster, parseRoster, registerStudents, resetStudentPin, watchStudents,
  type ParsedStudent, type RegisteredStudent,
} from '../lib/rosterService';
import type { RosterDoc, StudentDoc } from '../types';
import { Button, Card, Field, Notice, inputClass } from '../components/ui';

export default function TeacherStudents() {
  const { classId, classDoc, user } = useSession();
  const [students, setStudents] = useState<StudentDoc[]>([]);
  const [roster, setRoster] = useState<RosterDoc[]>([]);
  const [raw, setRaw] = useState('');
  const [preview, setPreview] = useState<ParsedStudent[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const [created, setCreated] = useState<RegisteredStudent[]>([]);
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!classId) return;
    const off = watchStudents(classId, setStudents);
    return off;
  }, [classId]);

  useEffect(() => {
    if (!classId) return;
    void listRoster(classId).then(setRoster);
  }, [classId, students.length, created.length]);

  if (!classId || !classDoc || !user) return null;

  function check() {
    const result = parseRoster(raw);
    setPreview(result.students);
    setErrors(result.errors);
  }

  async function commit() {
    setBusy(true);
    setMessage('');
    try {
      const result = await registerStudents(classId!, classDoc!.classCode, user!.uid, preview);
      setCreated(result);
      setRaw('');
      setPreview([]);
      setMessage(`${result.length}명을 등록했습니다. 로그인 카드를 인쇄해 나눠 주세요.`);
    } catch (e) {
      setErrors([e instanceof Error ? e.message : '등록하지 못했습니다.']);
    } finally {
      setBusy(false);
    }
  }

  async function reset(number: string) {
    setMessage('');
    try {
      const pin = await resetStudentPin(classId!, classDoc!.classCode, user!.uid, number);
      setMessage(`${Number(number)}번 학생의 새 PIN은 ${pin} 입니다. 학생이 다음 로그인 때 이 PIN을 쓰면 됩니다.`);
      setRoster(await listRoster(classId!));
    } catch (e) {
      setErrors([e instanceof Error ? e.message : 'PIN을 초기화하지 못했습니다.']);
    }
  }

  const pinOf = (number: string) => roster.find((r) => r.number === number)?.pin ?? '····';

  return (
    <main className="mx-auto max-w-3xl px-4 py-6">
      <header className="mb-5 flex items-center justify-between gap-3">
        <h1 className="text-2xl font-black text-navy-700">학생·명단 관리</h1>
        <Link to="/teacher" className="btn rounded-xl border-2 border-navy-500 px-4 py-2 font-bold text-navy-700">
          콘솔로
        </Link>
      </header>

      <Card title="학생 일괄 등록" tone="navy">
        <Field
          label="번호와 이름을 붙여 넣으세요"
          hint="한 줄에 한 명. '1 김철수', '1,김철수', 이름만 써도 됩니다(순서대로 번호가 붙습니다)."
        >
          <textarea
            className={`${inputClass} h-40 font-mono`}
            value={raw}
            onChange={(e) => setRaw(e.target.value)}
            placeholder={'1\t김철수\n2\t이영희\n3\t박민수'}
          />
        </Field>
        <div className="mt-4 flex flex-wrap gap-3">
          <Button kind="ghost" onClick={check} disabled={!raw.trim()}>미리 확인하기</Button>
          <Button onClick={commit} disabled={busy || preview.length === 0 || errors.length > 0}>
            {busy ? '등록하는 중…' : `${preview.length}명 등록하기`}
          </Button>
        </div>

        {errors.length > 0 && (
          <div className="mt-4">
            <Notice kind="error">
              <ul className="list-disc pl-5">{errors.map((e) => <li key={e}>{e}</li>)}</ul>
            </Notice>
          </div>
        )}
        {preview.length > 0 && errors.length === 0 && (
          <div className="mt-4">
            <Notice kind="ok">
              {preview.length}명을 등록합니다: {preview.slice(0, 5).map((s) => `${Number(s.number)}번 ${s.name}`).join(', ')}
              {preview.length > 5 ? ' …' : ''}
            </Notice>
          </div>
        )}
        {message && <div className="mt-4"><Notice kind="ok">{message}</Notice></div>}
      </Card>

      {created.length > 0 && (
        <div className="mt-4">
          <Card title="방금 만든 PIN" tone="emerald">
            <p className="mb-3 text-base text-gray-600">
              이 PIN은 지금 화면에서만 한눈에 볼 수 있습니다. 아래 목록에서도 언제든 다시 확인할 수 있습니다.
            </p>
            <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {created.map((s) => (
                <li key={s.number} className="rounded-xl bg-emerald-50 px-3 py-2 text-base">
                  <b>{Number(s.number)}번 {s.name}</b>
                  <span className="ml-2 font-mono text-lg tracking-widest">{s.pin}</span>
                </li>
              ))}
            </ul>
            <div className="mt-4">
              <Link to="/teacher/cards" className="btn inline-block rounded-xl bg-navy-600 px-5 py-3 font-bold text-white">
                로그인 카드 인쇄하기
              </Link>
            </div>
          </Card>
        </div>
      )}

      <div className="mt-4">
        <Card title={`등록된 학생 ${students.length}명`}>
          {students.length === 0 ? (
            <p className="text-base text-gray-500">아직 등록된 학생이 없습니다.</p>
          ) : (
            <ul className="divide-y divide-gray-100">
              {students.map((s) => (
                <li key={s.number} className="flex flex-wrap items-center justify-between gap-2 py-3">
                  <div>
                    <p className="text-base font-bold">{Number(s.number)}번 {s.name}</p>
                    <p className="text-sm text-gray-500">
                      PIN <span className="font-mono tracking-widest">{pinOf(s.number)}</span>
                      {' · '}
                      {s.uid ? '로그인함' : '아직 로그인 안 함'}
                    </p>
                  </div>
                  <Button kind="ghost" onClick={() => reset(s.number)}>PIN 초기화</Button>
                </li>
              ))}
            </ul>
          )}
          <p className="mt-4 text-sm text-gray-500">
            학생이 스스로 PIN을 바꾸면 위 목록의 PIN과 달라질 수 있습니다.
            학생이 PIN을 잊었다면 초기화해 주세요. 잔액과 거래내역은 그대로 유지됩니다.
          </p>
        </Card>
      </div>
    </main>
  );
}
