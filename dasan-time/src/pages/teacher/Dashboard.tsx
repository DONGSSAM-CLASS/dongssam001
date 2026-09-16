import { useMemo, useState } from 'react';
import { CircleCheck, CircleDashed, Minus, Plus, Users } from 'lucide-react';
import { useAuth } from '../../app/AuthContext';
import { indexSubmissions, useTeacher } from '../../app/TeacherContext';
import { createClass } from '../../lib/db';
import { EmptyState, ErrorNotice, Loading } from '../../components/States';
import { ACTIVITY_IDS, ACTIVITY_LABEL, SESSIONS, type ActivityId } from '../../content/lessons';
import type { Submission } from '../../lib/types';

/** 진행 현황표의 열 묶음 (차시별) */
const COLUMN_GROUPS = SESSIONS.map((s) => ({
  key: s.key,
  title: s.title,
  color: s.color,
  activities: s.activities,
}));

export default function Dashboard() {
  const { teacher } = useAuth();
  const { classes, cls, students, submissions, loading } = useTeacher();
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [detail, setDetail] = useState<Submission | null>(null);

  const index = useMemo(() => indexSubmissions(submissions), [submissions]);

  const summary = useMemo(() => {
    const submittedByActivity = new Map<ActivityId, number>();
    submissions
      .filter((s) => s.status === 'submitted')
      .forEach((s) => submittedByActivity.set(s.activityId, (submittedByActivity.get(s.activityId) ?? 0) + 1));

    const finishers = students.filter((st) =>
      (['home_w1', 'home_w2', 'home_w3', 'home_w4'] as ActivityId[]).every(
        (id) => index.get(`${st.uid}_${id}`)?.status === 'submitted',
      ),
    ).length;

    return { submittedByActivity, finishers };
  }, [submissions, students, index]);

  if (loading) return <Loading />;

  async function handleCreate() {
    if (!teacher || !name.trim()) return;
    setError('');
    try {
      await createClass(teacher, name.trim());
      setName('');
      setCreating(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : '학급을 만들지 못했어요.');
    }
  }

  if (classes.length === 0) {
    return (
      <div className="flex flex-col gap-4">
        <h1 className="text-2xl font-extrabold">대시보드</h1>
        <EmptyState
          title="아직 만든 학급이 없어요"
          description="먼저 학급을 하나 만들어 주세요. 학급을 만들면 6자리 학급 코드가 자동으로 생겨요."
          icon={<Users className="h-10 w-10 opacity-40" aria-hidden />}
          action={
            <div className="flex flex-wrap items-center justify-center gap-2">
              <input
                className="input input-bordered rounded-2xl"
                placeholder="3학년 2반"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
              <button
                type="button"
                className="btn btn-primary gap-1 rounded-2xl"
                disabled={!name.trim()}
                onClick={() => void handleCreate()}
              >
                <Plus className="h-4 w-4" aria-hidden />
                학급 만들기
              </button>
            </div>
          }
        />
        {error && <ErrorNotice message={error} />}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-2xl font-extrabold">대시보드</h1>
        <button
          type="button"
          className="btn btn-outline btn-sm gap-1 rounded-2xl"
          onClick={() => setCreating((v) => !v)}
        >
          {creating ? <Minus className="h-4 w-4" aria-hidden /> : <Plus className="h-4 w-4" aria-hidden />}
          학급 추가
        </button>
      </div>

      {creating && (
        <div className="card rounded-2xl bg-base-100 shadow-sm">
          <div className="card-body flex-row flex-wrap items-center gap-2 p-4">
            <input
              className="input input-bordered grow rounded-2xl"
              placeholder="3학년 2반"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            <button
              type="button"
              className="btn btn-primary rounded-2xl"
              disabled={!name.trim()}
              onClick={() => void handleCreate()}
            >
              만들기
            </button>
          </div>
        </div>
      )}
      {error && <ErrorNotice message={error} />}

      {/* 요약 카드 */}
      <div className="stats stats-vertical w-full rounded-2xl bg-base-100 shadow-sm sm:stats-horizontal">
        <div className="stat">
          <div className="stat-title">가입 학생</div>
          <div className="stat-value text-primary">{students.length}명</div>
        </div>
        <div className="stat">
          <div className="stat-title">3차시 출입증 제출</div>
          <div className="stat-value text-accent">
            {summary.submittedByActivity.get('s3_a5') ?? 0}명
          </div>
          <div className="stat-desc">
            {students.length > 0
              ? `${Math.round(((summary.submittedByActivity.get('s3_a5') ?? 0) / students.length) * 100)}%`
              : '—'}
          </div>
        </div>
        <div className="stat">
          <div className="stat-title">4주 자기점검 완주</div>
          <div className="stat-value text-success">{summary.finishers}명</div>
          <div className="stat-desc">
            {students.length > 0
              ? `${Math.round((summary.finishers / students.length) * 100)}%`
              : '—'}
          </div>
        </div>
      </div>

      {/* 차시별 제출률 */}
      <section className="card rounded-2xl bg-base-100 shadow-sm">
        <div className="card-body gap-3 p-4">
          <h2 className="card-title text-base">활동별 제출률</h2>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {ACTIVITY_IDS.map((id) => {
              const count = summary.submittedByActivity.get(id) ?? 0;
              const pct = students.length > 0 ? Math.round((count / students.length) * 100) : 0;
              return (
                <div key={id} className="rounded-2xl bg-base-200 p-3">
                  <p className="text-xs font-semibold">{ACTIVITY_LABEL[id]}</p>
                  <progress className="progress progress-primary mt-1 w-full" value={pct} max={100} />
                  <p className="mt-1 text-xs opacity-70">
                    {count}/{students.length}명 · {pct}%
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 진행 현황표 */}
      <section className="card rounded-2xl bg-base-100 shadow-sm">
        <div className="card-body gap-3 p-4">
          <h2 className="card-title text-base">진행 현황표</h2>
          {students.length === 0 ? (
            <EmptyState
              title="아직 가입한 학생이 없어요"
              description={`학생들에게 학급 코드 ${cls?.code ?? ''} 를 알려 주세요. '수업 진행' 화면에서 크게 띄울 수 있어요.`}
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="table table-pin-rows table-pin-cols table-xs">
                <thead>
                  <tr>
                    <th className="bg-base-100">학생</th>
                    {COLUMN_GROUPS.flatMap((g) =>
                      g.activities.map((id) => (
                        <th key={id} className="whitespace-nowrap text-xs">
                          {shortLabel(id)}
                        </th>
                      )),
                    )}
                  </tr>
                </thead>
                <tbody>
                  {students.map((st) => (
                    <tr key={st.uid}>
                      <th className="whitespace-nowrap bg-base-100">
                        {st.number}. {st.name}
                      </th>
                      {COLUMN_GROUPS.flatMap((g) =>
                        g.activities.map((id) => {
                          const sub = index.get(`${st.uid}_${id}`);
                          const state = !sub
                            ? 'none'
                            : sub.status === 'submitted'
                              ? 'done'
                              : 'draft';
                          return (
                            <td key={id}>
                              <button
                                type="button"
                                className="btn btn-ghost btn-xs rounded-2xl p-1"
                                aria-label={`${st.name} · ${ACTIVITY_LABEL[id]} 상세 보기`}
                                disabled={!sub}
                                onClick={() => sub && setDetail(sub)}
                              >
                                <StatusBadge state={state} />
                              </button>
                            </td>
                          );
                        }),
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <p className="text-xs opacity-70">
            <StatusBadge state="none" /> 미시작 · <StatusBadge state="draft" /> 작성 중 ·{' '}
            <StatusBadge state="done" /> 제출
          </p>
        </div>
      </section>

      {/* 칸을 누르면 뜨는 상세 보기 */}
      {detail && (
        <dialog className="modal modal-open" aria-label="제출물 상세 보기">
          <div className="modal-box max-w-2xl rounded-2xl">
            <h3 className="text-lg font-bold">{ACTIVITY_LABEL[detail.activityId]}</h3>
            <p className="mb-3 text-sm opacity-70">
              {students.find((s) => s.uid === detail.ownerUid)?.name ?? '학생'} ·{' '}
              {detail.status === 'submitted' ? '제출' : '작성 중'}
            </p>
            <SubmissionBody submission={detail} />
            <div className="modal-action">
              <button type="button" className="btn rounded-2xl" onClick={() => setDetail(null)}>
                닫기
              </button>
            </div>
          </div>
          <button type="button" className="modal-backdrop" onClick={() => setDetail(null)}>
            닫기
          </button>
        </dialog>
      )}
    </div>
  );
}

function shortLabel(id: ActivityId): string {
  const label = ACTIVITY_LABEL[id];
  const part = label.split('·').pop()?.trim() ?? label;
  return part.length > 8 ? `${part.slice(0, 8)}…` : part;
}

export function StatusBadge({ state }: { state: 'none' | 'draft' | 'done' }) {
  if (state === 'done') {
    return (
      <span className="badge badge-success badge-sm gap-0.5 rounded-2xl">
        <CircleCheck className="h-3 w-3" aria-hidden />
        제출
      </span>
    );
  }
  if (state === 'draft') {
    return (
      <span className="badge badge-warning badge-sm gap-0.5 rounded-2xl">
        <CircleDashed className="h-3 w-3" aria-hidden />
        작성
      </span>
    );
  }
  return <span className="badge badge-ghost badge-sm rounded-2xl">—</span>;
}

/** 제출물 안의 값을 사람이 읽을 수 있게 펼쳐 준다. */
export function SubmissionBody({ submission }: { submission: Submission }) {
  const entries = Object.entries(submission.data);
  if (entries.length === 0) return <p className="opacity-70">아직 적은 내용이 없어요.</p>;
  return (
    <dl className="flex flex-col gap-2">
      {entries.map(([key, value]) => (
        <div key={key} className="rounded-2xl bg-base-200 p-3">
          <dt className="text-xs font-bold opacity-70">{key}</dt>
          <dd className="whitespace-pre-wrap break-words text-sm">{renderValue(value)}</dd>
        </div>
      ))}
    </dl>
  );
}

export function renderValue(value: unknown): string {
  if (value === null || value === undefined) return '—';
  if (typeof value === 'boolean') return value ? '예' : '아니요';
  if (Array.isArray(value)) {
    return value
      .map((v) => (typeof v === 'object' && v !== null ? Object.values(v).filter(Boolean).join(' / ') : String(v)))
      .filter(Boolean)
      .join(', ');
  }
  if (typeof value === 'object') {
    return Object.entries(value as Record<string, unknown>)
      .map(([k, v]) => `${k}: ${renderValue(v)}`)
      .join('\n');
  }
  return String(value);
}
