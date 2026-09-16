import { Link, useParams } from 'react-router-dom';
import { ClipboardList, Lock } from 'lucide-react';
import { useData } from '../../app/DataContext';
import { useActivity } from '../../lib/useActivity';
import ActivityShell from '../../components/ActivityShell';
import { Loading } from '../../components/States';
import { surveyQuestions, UI_TEXT } from '../../content/lessons';

/** 사전·사후 마음 점검. 같은 문항으로 두 번 답한다. */
export default function SurveyPage() {
  const { kind } = useParams<{ kind: string }>();
  const surveyKind: 'pre' | 'post' = kind === 'post' ? 'post' : 'pre';
  const { cls, loading } = useData();
  const draft = useActivity(surveyKind);
  const values = draft.values as Record<string, string>;
  const questions = surveyQuestions(surveyKind);

  if (loading || !cls) return <Loading />;
  if (cls.sessions[surveyKind] === 'locked') {
    return (
      <div className="card rounded-2xl bg-base-100 shadow-sm">
        <div className="card-body items-center gap-3 text-center">
          <Lock className="h-10 w-10 opacity-50" aria-hidden />
          <p className="text-lg font-bold">{UI_TEXT.locked}</p>
          <Link to=".." relative="path" className="btn btn-ghost rounded-2xl">
            돌아가기
          </Link>
        </div>
      </div>
    );
  }

  const canSubmit = questions.every((q) => Boolean(values[q.id]));

  return (
    <div className="flex flex-col gap-5">
      <header>
        <p className="badge badge-info rounded-2xl">{surveyKind === 'pre' ? '사전' : '사후'} 점검</p>
        <h1 className="mt-2 text-2xl font-extrabold">마음 점검</h1>
        <p className="mt-1 opacity-80">
          정답이 없는 질문이에요. 지금 내 모습에 가장 가까운 것을 골라요.
        </p>
      </header>

      <ActivityShell
        title={surveyKind === 'pre' ? '수업을 시작하기 전에' : '4주를 마치고'}
        icon={<ClipboardList className="h-5 w-5 text-info" aria-hidden />}
        intro="이 답은 학급 전체 비율로만 쓰이고, 개인 답은 선생님만 볼 수 있어요."
        draft={draft}
        canSubmit={canSubmit}
      >
        {questions.map((q, i) => (
          <fieldset key={q.id} className="rounded-2xl bg-base-200 p-4">
            <legend className="px-1 font-bold">
              {i + 1}. {q.label}
            </legend>
            <div className="flex flex-wrap gap-2">
              {q.options.map((opt) => (
                <button
                  key={opt}
                  type="button"
                  className={`btn btn-sm h-auto min-h-11 rounded-2xl ${
                    values[q.id] === opt ? 'btn-info' : 'btn-outline'
                  }`}
                  aria-pressed={values[q.id] === opt}
                  disabled={draft.locked}
                  onClick={() => draft.setValue(q.id, opt)}
                >
                  {opt}
                </button>
              ))}
            </div>
          </fieldset>
        ))}
      </ActivityShell>
    </div>
  );
}
