import { useEffect, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { FolderOpen, LayoutDashboard, Plus, Printer, School } from 'lucide-react';
import { Layout } from '../../components/Layout';
import { Button, LinkButton, Loading, Notice, TextInput, friendlyError } from '../../components/ui';
import { TeacherGate, TeacherMenu } from './TeacherGate';
import { useAuth } from '../../app/AuthContext';
import { createClass, subscribeTeacherClasses } from '../../lib/db';
import { LIMITS } from '../../config';
import type { ClassRecord } from '../../types/db';
import { LESSON_SESSIONS } from '../../data/project';

function Home() {
  const { user } = useAuth();
  const [classes, setClasses] = useState<ClassRecord[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [busy, setBusy] = useState(false);
  const [created, setCreated] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    return subscribeTeacherClasses(user.uid, setClasses, (e) => setError(friendlyError(e)));
  }, [user]);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const n = name.trim();
    if (!n || !user) return;
    setBusy(true);
    setError(null);
    try {
      const r = await createClass(user.uid, n);
      setCreated(r.code);
      setName('');
    } catch (err) {
      setError(friendlyError(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Layout wide right={<TeacherMenu />}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="typewriter flex items-center gap-2 text-2xl font-bold">
          <LayoutDashboard className="h-7 w-7 text-declass" aria-hidden="true" />
          선생님 화면 · 내 학급
        </h1>
        <LinkButton to="/teacher/materials" variant="secondary">
          <Printer className="h-5 w-5" aria-hidden="true" />
          수업 자료 (과정안·활동지·가이드)
        </LinkButton>
      </div>

      <form onSubmit={submit} className="dossier mt-5 flex flex-col gap-3 p-5 sm:flex-row sm:items-end">
        <div className="flex-1">
          <TextInput label="새 학급 만들기" hint="예: 2학년 3반 (역사)" value={name} onChange={setName} maxLength={LIMITS.className} />
        </div>
        <Button type="submit" disabled={busy || !name.trim()}>
          <Plus className="h-5 w-5" aria-hidden="true" />
          {busy ? '만드는 중…' : '학급 만들기'}
        </Button>
      </form>
      {created && (
        <Notice tone="ok" className="mt-3">
          학급을 만들었어요. 학급 코드: <strong data-testid="new-class-code" className="text-xl tracking-widest">{created}</strong> — 학생에게 칠판에 적어 알려 주세요.
        </Notice>
      )}
      {error && (
        <Notice tone="error" className="mt-3">
          {error}
        </Notice>
      )}

      <section className="mt-6" aria-label="학급 목록">
        {!classes ? (
          <Loading />
        ) : classes.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-10 text-ink-soft">
            <School className="h-12 w-12" aria-hidden="true" />
            <p>아직 만든 학급이 없어요. 위에서 학급을 만들어 주세요.</p>
          </div>
        ) : (
          <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {classes.map((c) => (
              <li key={c.id}>
                <Link to={`/teacher/class/${c.id}`} className="dossier flex flex-col gap-1 p-4 transition-transform hover:-translate-y-0.5">
                  <span className="typewriter flex items-center gap-2 text-xl font-bold">
                    <FolderOpen className="h-5 w-5 text-declass" aria-hidden="true" />
                    {c.name}
                  </span>
                  <span>
                    학급 코드 <strong className="badge badge-lg h-auto border-0 bg-secondary py-1 tracking-widest text-secondary-content">{c.code}</strong>
                  </span>
                  <span className="text-[15px] text-ink-soft">
                    지금 {c.session}차시 · {LESSON_SESSIONS[c.session - 1]?.title} · 모둠 {c.groupCount}개
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </Layout>
  );
}

export default function TeacherHome() {
  return (
    <TeacherGate>
      <Home />
    </TeacherGate>
  );
}
