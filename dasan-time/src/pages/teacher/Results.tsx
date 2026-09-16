import { useMemo, useState } from 'react';
import { MessageSquareHeart, NotebookText, Save } from 'lucide-react';
import { indexSubmissions, useTeacher } from '../../app/TeacherContext';
import { saveEvaluation, savePraise } from '../../lib/db';
import { EmptyState, ErrorNotice, Loading } from '../../components/States';
import { SubmissionBody } from './Dashboard';
import { ACTIVITY_IDS, ACTIVITY_LABEL, RUBRIC, SESSIONS, type ActivityId } from '../../content/lessons';
import type { Evaluation } from '../../lib/types';

const GRADES: Evaluation['grade'][] = ['상', '중', '하'];

export default function Results() {
  const { cls, students, submissions, evaluations, loading } = useTeacher();
  const [selected, setSelected] = useState<string>('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const subIndex = useMemo(() => indexSubmissions(submissions), [submissions]);
  const evalIndex = useMemo(() => {
    const map = new Map<string, Evaluation>();
    evaluations.forEach((e) => map.set(e.id, e));
    return map;
  }, [evaluations]);

  if (loading) return <Loading />;
  if (!cls) return <EmptyState title="학급을 먼저 골라 주세요" description="대시보드에서 학급을 만들어 주세요." />;
  if (students.length === 0) {
    return (
      <EmptyState
        title="아직 가입한 학생이 없어요"
        description={`학생들에게 학급 코드 ${cls.code} 를 알려 주세요.`}
      />
    );
  }

  const student = students.find((s) => s.uid === selected) ?? students[0];

  async function run(fn: () => Promise<unknown>, done: string) {
    setError('');
    setNotice('');
    try {
      await fn();
      setNotice(done);
    } catch (err) {
      setError(err instanceof Error ? err.message : '저장하지 못했어요.');
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <h1 className="text-2xl font-extrabold">학생 결과물</h1>

      <label className="form-control max-w-xs">
        <span className="label-text mb-1 font-bold">학생 고르기</span>
        <select
          className="select select-bordered rounded-2xl"
          value={student.uid}
          onChange={(e) => setSelected(e.target.value)}
        >
          {students.map((s) => (
            <option key={s.uid} value={s.uid}>
              {s.number}. {s.name}
            </option>
          ))}
        </select>
      </label>

      {error && <ErrorNotice message={error} />}
      {notice && (
        <div className="alert alert-success rounded-2xl" role="status">
          <span>{notice}</span>
        </div>
      )}

      {/* 차시별 평가 입력 */}
      <section className="card rounded-2xl bg-base-100 shadow-sm">
        <div className="card-body gap-4 p-4">
          <h2 className="card-title text-base">차시별 교사 평가</h2>
          <p className="text-sm opacity-70">
            평가 등급과 메모는 학생에게 보이지 않아요. 칭찬 한 줄만 학생 화면에 나타나요.
          </p>
          {SESSIONS.filter((s) => ['s1', 's2', 's3'].includes(s.key)).map((session) => {
            const rubric = RUBRIC.find((r) => r.sessions.includes(session.title.slice(0, 3)));
            const mainActivity = session.activities[0];
            return (
              <EvalRow
                key={session.key}
                title={session.title}
                rubricLabel={rubric?.formal ?? ''}
                current={evalIndex.get(`${student.uid}_${mainActivity}`)}
                praise={subIndex.get(`${student.uid}_${mainActivity}`)?.praise ?? ''}
                onSaveEval={(grade, memo) =>
                  void run(
                    () => saveEvaluation(cls.id, student.uid, mainActivity, grade, memo),
                    '평가를 저장했어요.',
                  )
                }
                onSavePraise={(praise) =>
                  void run(
                    () => savePraise(cls.id, student.uid, mainActivity, praise),
                    '칭찬 한 줄을 저장했어요. 학생 화면에 바로 보여요.',
                  )
                }
              />
            );
          })}
        </div>
      </section>

      {/* 시간순 결과물 */}
      <section className="card rounded-2xl bg-base-100 shadow-sm">
        <div className="card-body gap-4 p-4">
          <h2 className="card-title text-base">
            <NotebookText className="h-5 w-5 text-primary" aria-hidden />
            {student.name} 학생의 결과물
          </h2>
          {ACTIVITY_IDS.map((id: ActivityId) => {
            const sub = subIndex.get(`${student.uid}_${id}`);
            return (
              <div key={id} className="rounded-2xl border border-base-300 p-3">
                <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                  <p className="font-bold">{ACTIVITY_LABEL[id]}</p>
                  <span
                    className={`badge rounded-2xl ${
                      sub?.status === 'submitted' ? 'badge-success' : sub ? 'badge-warning' : 'badge-ghost'
                    }`}
                  >
                    {sub?.status === 'submitted' ? '제출' : sub ? '작성 중' : '미시작'}
                  </span>
                </div>
                {sub ? <SubmissionBody submission={sub} /> : <p className="text-sm opacity-60">아직 시작하지 않았어요.</p>}
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}

function EvalRow({
  title,
  rubricLabel,
  current,
  praise,
  onSaveEval,
  onSavePraise,
}: {
  title: string;
  rubricLabel: string;
  current?: Evaluation;
  praise: string;
  onSaveEval: (grade: Evaluation['grade'], memo: string) => void;
  onSavePraise: (praise: string) => void;
}) {
  const [grade, setGrade] = useState<Evaluation['grade']>(current?.grade ?? '');
  const [memo, setMemo] = useState(current?.memo ?? '');
  const [praiseText, setPraiseText] = useState(praise);

  return (
    <div className="rounded-2xl bg-base-200 p-4">
      <p className="font-bold">{title}</p>
      {rubricLabel && <p className="text-xs opacity-70">평가 기준: {rubricLabel}</p>}

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <span className="text-sm font-semibold">등급</span>
        {GRADES.map((g) => (
          <button
            key={g}
            type="button"
            className={`btn btn-sm rounded-2xl ${grade === g ? 'btn-primary' : 'btn-outline'}`}
            aria-pressed={grade === g}
            onClick={() => setGrade(g)}
          >
            {g}
          </button>
        ))}
      </div>

      <textarea
        className="textarea textarea-bordered mt-3 w-full rounded-2xl"
        rows={2}
        placeholder="교사 메모 (학생에게 보이지 않아요)"
        aria-label={`${title} 교사 메모`}
        value={memo}
        onChange={(e) => setMemo(e.target.value)}
      />
      <button
        type="button"
        className="btn btn-outline btn-sm mt-2 gap-1 rounded-2xl"
        onClick={() => onSaveEval(grade, memo)}
      >
        <Save className="h-4 w-4" aria-hidden />
        평가 저장
      </button>

      <div className="mt-4 border-t border-base-300 pt-3">
        <p className="flex items-center gap-1 text-sm font-semibold">
          <MessageSquareHeart className="h-4 w-4 text-success" aria-hidden />
          학생에게 보이는 칭찬 한 줄
        </p>
        <textarea
          className="textarea textarea-bordered mt-2 w-full rounded-2xl"
          rows={2}
          placeholder="예) 사료에서 근거를 정확히 찾아 적었어요. 아주 잘했어요!"
          aria-label={`${title} 칭찬 한 줄`}
          value={praiseText}
          onChange={(e) => setPraiseText(e.target.value)}
        />
        <button
          type="button"
          className="btn btn-success btn-sm mt-2 gap-1 rounded-2xl"
          onClick={() => onSavePraise(praiseText)}
        >
          <Save className="h-4 w-4" aria-hidden />
          칭찬 보내기
        </button>
      </div>
    </div>
  );
}
