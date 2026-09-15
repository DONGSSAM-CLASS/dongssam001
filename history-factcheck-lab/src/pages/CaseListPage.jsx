import { Link, useParams } from 'react-router-dom';

import NotFoundPage from './NotFoundPage.jsx';
import { useProgress } from '../hooks/useProgress.jsx';
import { TRACKS, getCasesByTrack } from '../lib/cases.js';
import { completedSteps, isCaseComplete } from '../lib/scoring.js';

function Difficulty({ level }) {
  return (
    <span title={`난이도 ${level} / 3`}>
      {'●'.repeat(level)}
      <span className="opacity-30">{'●'.repeat(Math.max(0, 3 - level))}</span>
    </span>
  );
}

export default function CaseListPage() {
  const { track } = useParams();
  const { getCaseState } = useProgress();
  const meta = TRACKS[track];

  if (!meta) return <NotFoundPage />;

  const cases = getCasesByTrack(track);

  return (
    <div className="space-y-5">
      <header>
        <h1 className="text-2xl font-bold">{meta.label} 사건부</h1>
        <p className="mt-1 leading-reading text-ink-soft">{meta.blurb}</p>
      </header>

      {cases.length === 0 ? (
        <p className="card-file">아직 등록된 사건이 없다.</p>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2">
          {cases.map((c) => {
            const state = getCaseState(c.id);
            const done = completedSteps(c, state);
            const complete = isCaseComplete(c, state);
            return (
              <li key={c.id}>
                <Link
                  to={`/learn/${c.id}/0`}
                  className="card-file block h-full transition-colors duration-150 hover:bg-kraft-light"
                >
                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    <span className="rounded-sm border border-ink px-2 py-0.5 font-bold">
                      {c.type === 'figure' ? '인물' : '사건'}
                    </span>
                    <span className="text-ink-soft">{c.period}</span>
                    {complete ? (
                      <span className="ml-auto rounded-sm bg-ink px-2 py-0.5 font-bold text-kraft-light">
                        완료
                      </span>
                    ) : done.length > 0 ? (
                      <span className="ml-auto rounded-sm bg-kraft-dark px-2 py-0.5 font-bold">
                        {done.length} / 7 단계
                      </span>
                    ) : null}
                  </div>

                  <h2 className="mt-2 text-lg font-bold leading-snug">{c.title}</h2>

                  <dl className="mt-3 grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-sm text-ink-soft">
                    <dt className="font-bold">난이도</dt>
                    <dd>
                      <Difficulty level={c.difficulty} />
                    </dd>
                    <dt className="font-bold">소요 시간</dt>
                    <dd>약 {c.estimatedMinutes}분</dd>
                    <dt className="font-bold">성취기준</dt>
                    <dd>{c.curriculum.standards.join(', ')}</dd>
                    <dt className="font-bold">심어 둔 오류</dt>
                    <dd>
                      {c.aiResponse.sentences.filter((s) => s.errorType).length}건 (직접 찾아보자)
                    </dd>
                  </dl>

                  {c.contested ? (
                    <p className="mt-3 rounded-sm border border-alert/40 bg-alert/5 p-2 text-xs leading-reading">
                      해석이 갈리는 주제다. 하나의 정답을 고르는 것이 아니라, 각 해석이 어떤 자료에
                      기대고 있는지를 살핀다.
                    </p>
                  ) : null}

                  <div className="mt-3 h-2 w-full overflow-hidden rounded-sm bg-kraft-dark/40">
                    <div
                      className="h-full bg-ink"
                      style={{ width: `${Math.round((done.length / 7) * 100)}%` }}
                    />
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
