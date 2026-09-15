export default function Step0Question({ caseData, state, onChange }) {
  const { options, prompt, selfQuestionHint } = caseData.questionStage;
  const chosen = state.chosenOptionId;

  return (
    <div className="space-y-5">
      <section className="card-file">
        <h2 className="text-xl font-bold">0단계 · 탐구 질문 다듬기</h2>
        <p className="mt-1 text-sm text-ink-soft">
          역사 탐구는 자료를 모으는 데서가 아니라 <strong>질문을 만드는 데서</strong> 출발한다.
          같은 사건을 두고도 어떤 질문을 던지느냐에 따라 찾아야 할 자료가 달라진다.
        </p>
        <p className="mt-3 leading-reading">{prompt}</p>

        <ul className="mt-4 space-y-2">
          {options.map((opt) => {
            const selected = chosen === opt.id;
            return (
              <li key={opt.id}>
                <button
                  type="button"
                  onClick={() => onChange((prev) => ({ ...prev, chosenOptionId: opt.id }))}
                  className={[
                    'w-full rounded-sm border p-3 text-left transition-colors duration-150',
                    selected
                      ? 'border-ink bg-ink/5'
                      : 'border-kraft-dark bg-white/70 hover:bg-kraft-light',
                  ].join(' ')}
                >
                  <span className="block leading-reading">{opt.text}</span>
                  {chosen ? (
                    <span
                      className={[
                        'mt-2 block rounded-sm px-2 py-1 text-sm',
                        opt.good ? 'bg-ink text-kraft-light' : 'bg-alert/10 text-alert',
                      ].join(' ')}
                    >
                      <strong>{opt.good ? '탐구할 수 있는 질문' : '탐구하기 어려운 질문'}</strong> —{' '}
                      {opt.why}
                    </span>
                  ) : null}
                </button>
              </li>
            );
          })}
        </ul>

        {chosen ? (
          <p className="mt-3 rounded-sm bg-kraft-dark/25 p-3 text-sm leading-reading">
            네 질문을 모두 비교해 보자. <strong>좋은 탐구 질문은 옳은 답이 정해진 질문이 아니라,
            어떤 자료를 보면 되는지가 보이는 질문이다.</strong>
          </p>
        ) : null}
      </section>

      <section className="card-file">
        <label htmlFor="my-question" className="block text-lg font-bold">
          이제 내 질문을 한 줄로 써 보자
        </label>
        <p className="mt-1 text-sm text-ink-soft">{selfQuestionHint}</p>
        <textarea
          id="my-question"
          value={state.myQuestion}
          onChange={(e) => {
            const { value } = e.target;
            onChange((prev) => ({ ...prev, myQuestion: value }));
          }}
          rows={3}
          placeholder="나의 탐구 질문"
          className="mt-3 w-full rounded-sm border border-kraft-dark bg-white/80 p-3 leading-reading"
        />
        <p className="mt-2 text-sm text-ink-soft">
          이 질문은 마지막 탐정 리포트에 그대로 실린다. 6단계까지 마친 뒤 처음 질문이 어떻게
          달라졌는지 다시 살펴보자.
        </p>
      </section>
    </div>
  );
}
