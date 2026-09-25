/**
 * 학급 대시보드
 *  - 챕터 잠금/해제, 선택 분포 학생 공개
 *  - 탭: 진행 현황 · 선택 분포 · 성찰·선언문 · 학급 관리(PIN 초기화·CSV·학급 삭제)
 */
import { useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Layout } from '../../components/Layout';
import { Button, LinkButton, Loading, Modal, Notice, TextInput, friendlyError } from '../../components/ui';
import { DistributionChart } from '../../components/DistributionChart';
import { TeacherGate, TeacherMenu } from './TeacherGate';
import { useClassData, useStatsPublisher } from './useClassData';
import { CHAPTERS } from '../../data/scenarios';
import { PRINCIPLES } from '../../data/principles';
import { chapterStatus, stepLabel } from '../../lib/progress';
import { computeChoiceStats } from '../../lib/stats';
import { buildCsv } from '../../lib/csv';
import { deleteClassCompletely, resetStudentPin, setHighlights, setShowDistribution, setUnlocked } from '../../lib/db';
import type { ChapterId } from '../../types/content';
import type { ClassRecord, StudentRecord } from '../../types/db';

type Tab = 'progress' | 'dist' | 'writing' | 'manage';
const TABS: [Tab, string][] = [
  ['progress', '진행 현황'],
  ['dist', '선택 분포'],
  ['writing', '성찰·선언문'],
  ['manage', '학급 관리'],
];

export default function ClassDashboard() {
  return (
    <TeacherGate>
      <Dashboard />
    </TeacherGate>
  );
}

function Dashboard() {
  const { classId } = useParams();
  const { cls, students, highlights, state } = useClassData(classId);
  useStatsPublisher(cls, students);
  const [tab, setTab] = useState<Tab>('progress');
  const [bigCode, setBigCode] = useState(false);

  if (state === 'loading')
    return (
      <Layout wide right={<TeacherMenu />}>
        <Loading />
      </Layout>
    );
  if (state !== 'ready' || !cls)
    return (
      <Layout wide right={<TeacherMenu />}>
        <Notice tone="error">
          학급을 찾을 수 없거나 볼 수 있는 권한이 없어요.
          <div className="mt-3">
            <LinkButton to="/teacher" variant="secondary">
              내 학급 목록
            </LinkButton>
          </div>
        </Notice>
      </Layout>
    );

  const joinUrl = `${window.location.origin}/join?code=${cls.code}`;

  return (
    <Layout wide right={<TeacherMenu />}>
      <p>
        <Link to="/teacher" className="text-[15px] underline">
          ◀ 내 학급 목록
        </Link>
      </p>
      <div className="mt-1 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="typewriter text-2xl font-bold">📁 {cls.name}</h1>
          <p className="text-ink-soft">학생 {students.length}명 입장</p>
        </div>
        <button type="button" onClick={() => setBigCode(true)} className="dossier px-4 py-2 text-left hover:bg-white">
          <span className="block text-[14px] text-ink-soft">학급 코드 (눌러서 크게 보기)</span>
          <span className="typewriter text-2xl font-bold tracking-[0.3em]">{cls.code}</span>
        </button>
      </div>

      <Controls cls={cls} />

      <div className="mt-6 flex flex-wrap gap-1 border-b-2 border-ink" role="tablist">
        {TABS.map(([t, label]) => (
          <button
            key={t}
            type="button"
            role="tab"
            aria-selected={tab === t}
            onClick={() => setTab(t)}
            className={`min-h-12 rounded-t-md px-4 font-bold ${tab === t ? 'bg-ink text-paper' : 'bg-paper-dark text-ink hover:bg-folder'}`}
          >
            {label}
          </button>
        ))}
      </div>
      <div className="mt-4" role="tabpanel">
        {tab === 'progress' && <ProgressTab students={students} />}
        {tab === 'dist' && <DistTab students={students} />}
        {tab === 'writing' && <WritingTab cls={cls} students={students} highlights={highlights} />}
        {tab === 'manage' && <ManageTab cls={cls} students={students} />}
      </div>

      <Modal open={bigCode} onClose={() => setBigCode(false)} title="학급 코드">
        <p className="typewriter text-center text-6xl font-bold tracking-[0.3em] sm:text-7xl">{cls.code}</p>
        <p className="text-center">
          학생 입장 주소: <strong className="break-all">{joinUrl}</strong>
        </p>
        <Button onClick={() => setBigCode(false)}>닫기</Button>
      </Modal>
    </Layout>
  );
}

/* ─────────────── 잠금·공개 스위치 ─────────────── */

function Toggle({ label, on, onChange, sub }: { label: string; on: boolean; onChange: (v: boolean) => Promise<void>; sub?: string }) {
  const [busy, setBusy] = useState(false);
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      disabled={busy}
      onClick={async () => {
        setBusy(true);
        try {
          await onChange(!on);
        } finally {
          setBusy(false);
        }
      }}
      className={`flex min-h-14 flex-col items-start justify-center rounded-md border-2 px-3 py-2 text-left ${
        on ? 'border-declass bg-[#e2f2e8]' : 'border-line bg-white'
      }`}
    >
      <span className="font-bold">
        {on ? '🔓' : '🔒'} {label}
      </span>
      <span className="text-[14px] text-ink-soft">{sub ?? (on ? '열림 — 누르면 잠가요' : '잠김 — 누르면 열어요')}</span>
    </button>
  );
}

function Controls({ cls }: { cls: ClassRecord }) {
  const [error, setError] = useState<string | null>(null);
  const run = async (fn: () => Promise<void>) => {
    setError(null);
    try {
      await fn();
    } catch (e) {
      setError(friendlyError(e));
    }
  };
  return (
    <section className="dossier mt-4 p-4" aria-label="챕터 잠금과 공개 설정">
      <h2 className="font-bold">수업 진행 스위치</h2>
      <div className="mt-2 grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
        {CHAPTERS.map((c) => (
          <Toggle
            key={c.id}
            label={`${c.no}차시 「${c.title}」`}
            on={cls.unlocked[c.id]}
            onChange={(v) => run(() => setUnlocked(cls.id, c.id, v))}
          />
        ))}
        <Toggle label="선언문 (3차시 후반)" on={cls.unlocked.finale} onChange={(v) => run(() => setUnlocked(cls.id, 'finale', v))} />
        <Toggle
          label="선택 분포 학생 공개"
          on={cls.showDistribution}
          sub={cls.showDistribution ? '학생 마무리 화면에 보여요' : '선생님만 봐요'}
          onChange={(v) => run(() => setShowDistribution(cls.id, v))}
        />
      </div>
      {error && (
        <Notice tone="error" className="mt-2">
          {error}
        </Notice>
      )}
    </section>
  );
}

/* ─────────────── 진행 현황 ─────────────── */

function ago(s: StudentRecord): string {
  const t = s.updatedAt?.toDate?.();
  if (!t) return '-';
  const min = Math.floor((Date.now() - t.getTime()) / 60000);
  if (min < 1) return '방금';
  if (min < 60) return `${min}분 전`;
  const h = Math.floor(min / 60);
  if (h < 24) return `${h}시간 전`;
  return `${t.getMonth() + 1}/${t.getDate()}`;
}

function ProgressTab({ students }: { students: StudentRecord[] }) {
  if (students.length === 0) return <p className="text-ink-soft">아직 입장한 학생이 없어요. 학급 코드를 알려 주세요.</p>;
  return (
    <div className="flex flex-col gap-4">
      <div className="grid gap-2 sm:grid-cols-3">
        {CHAPTERS.map((c) => {
          const done = students.filter((s) => chapterStatus(s, c.id) === 'done').length;
          const doing = students.filter((s) => chapterStatus(s, c.id) === 'inProgress').length;
          return (
            <div key={c.id} className="dossier p-3">
              <p className="font-bold">
                CH{c.no} 「{c.title}」
              </p>
              <p className="text-[15px]">
                진행 중 {doing}명 · 완료 {done}명 · 시작 전 {students.length - done - doing}명
              </p>
            </div>
          );
        })}
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] border-collapse bg-white/60 text-left text-[16px]">
          <thead>
            <tr className="border-b-2 border-ink">
              <th className="p-2">번호</th>
              <th className="p-2">닉네임</th>
              {CHAPTERS.map((c) => (
                <th key={c.id} className="p-2">
                  CH{c.no}
                </th>
              ))}
              <th className="p-2">카드</th>
              <th className="p-2">선언문</th>
              <th className="p-2">마지막 활동</th>
            </tr>
          </thead>
          <tbody>
            {students.map((s) => (
              <tr key={s.id} className="border-b border-line">
                <td className="p-2 font-bold">{s.number}</td>
                <td className="p-2">{s.nickname}</td>
                {CHAPTERS.map((c) => {
                  const st = chapterStatus(s, c.id);
                  return (
                    <td key={c.id} className={`p-2 ${st === 'done' ? 'font-bold text-declass' : ''}`}>
                      {st === 'done' ? '✔ 완료' : stepLabel(s.progress[c.id])}
                    </td>
                  );
                })}
                <td className="p-2">
                  {s.cards.length}/{PRINCIPLES.length}
                </td>
                <td className="p-2">{s.declaration ? '제출' : '-'}</td>
                <td className="p-2 text-ink-soft">{ago(s)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ─────────────── 선택 분포 ─────────────── */

function DistTab({ students }: { students: StudentRecord[] }) {
  const [ch, setCh] = useState<ChapterId>('ch1');
  const [big, setBig] = useState(false);
  const stats = useMemo(() => computeChoiceStats(students), [students]);
  const chapter = CHAPTERS.find((c) => c.id === ch)!;
  return (
    <div data-chapter={chapter.theme}>
      <div className="flex flex-wrap items-center gap-2">
        {CHAPTERS.map((c) => (
          <button
            key={c.id}
            type="button"
            aria-pressed={ch === c.id}
            onClick={() => setCh(c.id)}
            className={`min-h-11 rounded-md border-2 px-3 font-bold ${ch === c.id ? 'border-ink bg-ink text-paper' : 'border-line bg-white'}`}
          >
            CH{c.no} 「{c.title}」
          </button>
        ))}
        <label className="ml-auto flex items-center gap-2">
          <input type="checkbox" checked={big} onChange={(e) => setBig(e.target.checked)} className="h-5 w-5" />
          화면 공유용 큰 글씨
        </label>
      </div>
      <p className="mt-2 text-[15px] text-ink-soft">이름 없이 숫자만 보여요. 수업 중 토론 자료로 화면에 띄워 쓰세요.</p>
      <div className="dossier mt-3 p-5">
        <DistributionChart scenes={chapter.scenes} stats={stats} big={big} />
      </div>
    </div>
  );
}

/* ─────────────── 성찰·선언문 ─────────────── */

interface Prompt {
  id: string;
  title: string;
  text: string;
}

export function allPrompts(): Prompt[] {
  const list: Prompt[] = [];
  for (const c of CHAPTERS) {
    c.reflection.questions.forEach((q, i) =>
      list.push({ id: q.id, title: `CH${c.no} AI 연결 질문 ${i + 1}`, text: q.text }),
    );
    list.push({ id: c.wrapupId, title: `CH${c.no} 마음 돌아보기`, text: c.kselFocus.question });
  }
  list.push({ id: 'declaration', title: '나의 AI 윤리 실천 선언문', text: '선언문' });
  return list;
}

export function answerOf(s: StudentRecord, id: string): string {
  if (id === 'declaration') {
    const d = s.declaration;
    if (!d) return '';
    return `나는 AI를 사용할 때 ${d.keep}을(를) 지키겠습니다. 왜냐하면 냉전 시대의 ${d.era}에서 ${d.lesson}을(를) 배웠기 때문입니다.${d.free ? `\n${d.free}` : ''}`;
  }
  return s.answers[id] ?? '';
}

function WritingTab({ cls, students, highlights }: { cls: ClassRecord; students: StudentRecord[]; highlights: Record<string, true> }) {
  const prompts = allPrompts();
  const [pid, setPid] = useState(prompts[0].id);
  const [onlyStar, setOnlyStar] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const prompt = prompts.find((p) => p.id === pid)!;
  const rows = students
    .map((s) => ({ s, text: answerOf(s, pid), key: `${s.number}:${pid}` }))
    .filter((r) => r.text && (!onlyStar || highlights[r.key]));

  const toggle = async (key: string) => {
    const next = { ...highlights };
    if (next[key]) delete next[key];
    else next[key] = true;
    try {
      await setHighlights(cls.id, next);
    } catch (e) {
      setError(friendlyError(e));
    }
  };

  const starCount = Object.keys(highlights).length;
  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-end gap-3">
        <label className="flex flex-col gap-1">
          <span className="font-bold">질문 고르기</span>
          <select value={pid} onChange={(e) => setPid(e.target.value)} className="min-h-12 rounded-md border-2 border-line bg-white px-2 text-[16px]">
            {prompts.map((p) => (
              <option key={p.id} value={p.id}>
                {p.title}
              </option>
            ))}
          </select>
        </label>
        <label className="flex min-h-12 items-center gap-2">
          <input type="checkbox" checked={onlyStar} onChange={(e) => setOnlyStar(e.target.checked)} className="h-5 w-5" />
          ⭐ 하이라이트만
        </label>
        <LinkButton to={`/teacher/class/${cls.id}/present`} className="ml-auto">
          📽️ 발표 모드 (⭐ {starCount}개)
        </LinkButton>
      </div>
      {prompt.id !== 'declaration' && <p className="rounded bg-paper-dark px-3 py-2">{prompt.text}</p>}
      {error && <Notice tone="error">{error}</Notice>}
      {rows.length === 0 ? (
        <p className="text-ink-soft">아직 답변이 없어요.</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {rows.map(({ s, text, key }) => (
            <li key={key} className={`dossier flex gap-3 p-4 ${highlights[key] ? 'border-2 border-[#b8860b]' : ''}`}>
              <button
                type="button"
                aria-pressed={!!highlights[key]}
                aria-label={`${s.number}번 답변 하이라이트`}
                onClick={() => void toggle(key)}
                className="h-11 w-11 shrink-0 rounded-md border border-line bg-white text-2xl"
              >
                {highlights[key] ? '⭐' : '☆'}
              </button>
              <div>
                <p className="text-[15px] font-bold text-ink-soft">
                  {s.number}번 {s.nickname}
                </p>
                <p className="whitespace-pre-wrap">{text}</p>
              </div>
            </li>
          ))}
        </ul>
      )}
      <p className="text-[15px] text-ink-soft">발표에 쓰기 전에 학생에게 공개해도 되는지 먼저 물어봐 주세요.</p>
    </div>
  );
}

/* ─────────────── 학급 관리 ─────────────── */

function ManageTab({ cls, students }: { cls: ClassRecord; students: StudentRecord[] }) {
  const nav = useNavigate();
  const [target, setTarget] = useState<StudentRecord | null>(null);
  const [tempPin, setTempPin] = useState<{ number: number; pin: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [delStep, setDelStep] = useState<0 | 1 | 2>(0);
  const [confirmName, setConfirmName] = useState('');

  const downloadCsv = () => {
    const blob = new Blob([buildCsv(students)], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const d = new Date();
    a.download = `${cls.name}_냉전의목격자_${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const doReset = async () => {
    if (!target) return;
    setBusy(true);
    setError(null);
    try {
      const pin = await resetStudentPin(cls.id, target);
      setTempPin({ number: target.number, pin });
      setTarget(null);
    } catch (e) {
      setError(friendlyError(e));
    } finally {
      setBusy(false);
    }
  };

  const doDelete = async () => {
    setBusy(true);
    setError(null);
    try {
      await deleteClassCompletely(cls.id, cls.code);
      nav('/teacher', { replace: true });
    } catch (e) {
      setError(friendlyError(e));
      setBusy(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {error && <Notice tone="error">{error}</Notice>}

      <section className="dossier p-5">
        <h2 className="typewriter text-lg font-bold">📥 CSV 내보내기</h2>
        <p>번호·닉네임·감정·선택·성찰 답변·선언문을 엑셀에서 열 수 있는 표로 내려받아요. (평가·기록용)</p>
        <Button className="mt-3" onClick={downloadCsv} disabled={students.length === 0}>
          CSV 내려받기 ({students.length}명)
        </Button>
      </section>

      <section className="dossier p-5">
        <h2 className="typewriter text-lg font-bold">🔑 학생 PIN 초기화</h2>
        <p>PIN을 잊은 학생이 있으면 초기화하세요. 새 임시 PIN이 나오고, 학생은 ‘다른 기기에서 이어 해요’로 들어오면 돼요. 기록은 그대로 남아요.</p>
        {students.length === 0 ? (
          <p className="mt-2 text-ink-soft">아직 학생이 없어요.</p>
        ) : (
          <ul className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {students.map((s) => (
              <li key={s.id} className="flex items-center justify-between gap-2 rounded-md border border-line bg-white px-3 py-2">
                <span>
                  <strong>{s.number}번</strong> {s.nickname}
                </span>
                <Button variant="secondary" className="min-h-10 px-3 text-[15px]" onClick={() => setTarget(s)}>
                  PIN 초기화
                </Button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="dossier border-2 border-stamp p-5">
        <h2 className="typewriter text-lg font-bold text-stamp">🗑️ 학급 삭제 (데이터 파기)</h2>
        <p>학기가 끝나면 학급을 삭제해 학생 기록을 모두 지우세요. 선택·성찰·선언문이 모두 사라지며 되돌릴 수 없어요. 필요하면 먼저 CSV를 내려받으세요.</p>
        <Button variant="danger" className="mt-3" onClick={() => setDelStep(1)}>
          학급 삭제하기
        </Button>
      </section>

      <Modal open={!!target} onClose={() => setTarget(null)} title="PIN을 초기화할까요?">
        <p>
          <strong>
            {target?.number}번 {target?.nickname}
          </strong>{' '}
          학생의 PIN을 새 임시 PIN으로 바꿔요. 지금 쓰던 기기에서는 다시 들어와야 해요.
        </p>
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={() => setTarget(null)} disabled={busy}>
            취소
          </Button>
          <Button onClick={doReset} disabled={busy}>
            {busy ? '바꾸는 중…' : '초기화'}
          </Button>
        </div>
      </Modal>

      <Modal open={!!tempPin} onClose={() => setTempPin(null)} title="새 임시 PIN">
        <p>{tempPin?.number}번 학생에게 알려 주세요. 이 창을 닫으면 다시 볼 수 없어요.</p>
        <p className="typewriter text-center text-6xl font-bold tracking-[0.3em]">{tempPin?.pin}</p>
        <p className="text-[15px] text-ink-soft">학생: 첫 화면 → 학생으로 들어가기 → ‘다른 기기에서 이어 해요’ → 학급 코드 · 번호 · 이 PIN</p>
        <Button onClick={() => setTempPin(null)}>확인했어요</Button>
      </Modal>

      <Modal open={delStep === 1} onClose={() => setDelStep(0)} title="정말 학급을 삭제할까요? (1/2)">
        <p>
          「{cls.name}」의 학생 {students.length}명 기록이 <strong>모두 지워지고 되돌릴 수 없어요.</strong>
        </p>
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={() => setDelStep(0)}>
            취소
          </Button>
          <Button
            variant="danger"
            onClick={() => {
              setConfirmName('');
              setDelStep(2);
            }}
          >
            계속
          </Button>
        </div>
      </Modal>
      <Modal open={delStep === 2} onClose={() => setDelStep(0)} title="마지막 확인 (2/2)">
        <TextInput label={`확인을 위해 학급 이름 「${cls.name}」을 그대로 써 주세요.`} value={confirmName} onChange={setConfirmName} />
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={() => setDelStep(0)} disabled={busy}>
            취소
          </Button>
          <Button variant="danger" onClick={doDelete} disabled={busy || confirmName.trim() !== cls.name}>
            {busy ? '삭제하는 중…' : '영구 삭제'}
          </Button>
        </div>
      </Modal>
    </div>
  );
}
