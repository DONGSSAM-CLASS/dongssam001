import { useState } from 'react';

import { ERROR_TYPES, VERDICT_CHOICES, expectedVerdictKey } from '../../lib/cases.js';

export default function Step2Verdict({ caseData, state, onChange }) {
  const [checked, setChecked] = useState(false);
  const sentences = caseData.aiResponse.sentences;
  const picks = state.verdicts ?? {};
  const allPicked = sentences.every((s) => picks[s.no]);

  function pick(no, key) {
    onChange((prev) => ({ ...prev, verdicts: { ...prev.verdicts, [no]: key } }));
    setChecked(false);
  }

  return (
    <div className="space-y-5">
      <section className="card-file">
        <h2 className="text-xl font-bold">2단계 · 문장 판정</h2>
        <p className="mt-1 text-sm leading-reading text-ink-soft">
          답변 전체를 한 덩어리로 믿거나 버리지 말고, 문장 하나하나를 따로 판정하자. 한 답변 안에도
          확인되는 문장과 그렇지 않은 문장이 섞여 있다.
        </p>
        <dl className="mt-3 grid gap-2 text-sm sm:grid-cols-3">
          {VERDICT_CHOICES.map((c) => (
            <div key={c.key} className="rounded-sm bg-kraft-dark/25 p-2">
              <dt className="font-bold">{c.label}</dt>
              <dd>{c.hint}</dd>
            </div>
          ))}
        </dl>
      </section>

      <ol className="space-y-3">
        {sentences.map((s) => {
          const got = picks[s.no];
          const expected = expectedVerdictKey(s.verdict);
          const showResult = checked && got;
          const isCorrect = got === expected;
          const errorMeta = s.errorType ? ERROR_TYPES[s.errorType] : null;

          return (
            <li key={s.no} className="card-file">
              <p className="flex gap-2 leading-reading">
                <span className="shrink-0 font-bold text-ink-soft">{s.no}.</span>
                <span>{s.text}</span>
              </p>

              <div className="mt-3 flex flex-wrap gap-2">
                {VERDICT_CHOICES.map((c) => (
                  <button
                    key={c.key}
                    type="button"
                    onClick={() => pick(s.no, c.key)}
                    aria-pressed={got === c.key}
                    className={[
                      'rounded-sm border px-3 py-1.5 text-sm transition-colors duration-150',
                      got === c.key
                        ? 'border-ink bg-ink text-kraft-light'
                        : 'border-kraft-dark bg-white/70 hover:bg-kraft-light',
                    ].join(' ')}
                  >
                    {c.label}
                  </button>
                ))}
              </div>

              {showResult ? (
                <div
                  className={[
                    'mt-3 rounded-sm p-3 text-sm leading-reading',
                    isCorrect ? 'bg-ink/10' : 'bg-alert/10',
                  ].join(' ')}
                >
                  <p className="font-bold">
                    {isCorrect ? '판정이 자료와 맞습니다.' : '자료를 보면 다르게 판정하게 됩니다.'}
                    {errorMeta ? (
                      <span className="ml-2 rounded-sm bg-alert px-2 py-0.5 text-xs text-white">
                        {errorMeta.label}
                      </span>
                    ) : null}
                  </p>
                  <p className="mt-1">{s.explanation}</p>
                  {s.checkWith?.length ? (
                    <p className="mt-1 text-ink-soft">
                      3단계에서 확인할 자료: {s.checkWith.join(', ')}
                    </p>
                  ) : null}
                </div>
              ) : null}
            </li>
          );
        })}
      </ol>

      <div className="card-file">
        {!allPicked ? (
          <p className="text-sm text-ink-soft">모든 문장을 판정하면 확인 버튼이 열린다.</p>
        ) : null}
        <button
          type="button"
          disabled={!allPicked}
          onClick={() => setChecked(true)}
          className="btn-primary mt-2 disabled:cursor-not-allowed disabled:opacity-40"
        >
          판정 확인하기
        </button>
        {checked ? (
          <p className="mt-3 rounded-sm bg-kraft-dark/25 p-3 text-sm leading-reading">
            판정이 틀렸더라도 괜찮다. 중요한 것은 <strong>왜 그렇게 판정했는지 말할 수 있는가</strong>다.
            다음 단계에서 사료를 직접 열어 확인해 보자.
          </p>
        ) : null}
      </div>
    </div>
  );
}
