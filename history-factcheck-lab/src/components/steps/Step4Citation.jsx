import { useState } from 'react';

import {
  FIELD_META,
  FIELD_ORDER,
  KOREAN_RULES,
  TEMPLATES,
  composeFromTarget,
  gradeCitation,
} from '../../lib/apa.js';
import { getSource } from '../../lib/cases.js';

const REVEAL_AFTER = 3;

export default function Step4Citation({ caseData, state, onChange }) {
  const target = caseData.apaTarget;
  const source = getSource(caseData, target.sourceId);
  const [result, setResult] = useState(null);
  const fields = state.fields;

  const template = TEMPLATES[target.template] ?? TEMPLATES.webdoc;
  const revealed = state.revealed || state.attempts >= REVEAL_AFTER;

  function setField(key, value) {
    onChange((prev) => ({ ...prev, fields: { ...prev.fields, [key]: value } }));
  }

  function grade() {
    const graded = gradeCitation(fields, target.components);
    setResult(graded);
    onChange((prev) => ({
      ...prev,
      attempts: prev.attempts + 1,
      bestScore: Math.max(prev.bestScore, graded.total),
      revealed: prev.revealed || graded.total === 100 || prev.attempts + 1 >= REVEAL_AFTER,
    }));
  }

  function retry() {
    setResult(null);
    onChange((prev) => ({
      ...prev,
      fields: { author: '', year: '', title: '', container: '', url: '' },
    }));
  }

  return (
    <div className="space-y-5">
      <section className="card-file">
        <h2 className="text-xl font-bold">4단계 · 출처 기재</h2>
        <p className="mt-1 text-sm leading-reading text-ink-soft">
          자료를 찾았다면 <strong>남이 그 자료를 다시 찾아갈 수 있게</strong> 적어 두어야 한다.
          그것이 출처 기재다. 아래는 APA 7판 양식이다.
        </p>
        <div className="mt-3 rounded-sm bg-kraft-dark/25 p-3">
          <p className="text-sm font-bold">{template.label} 양식</p>
          <p className="mt-1 font-mono text-sm leading-reading">{template.pattern}</p>
        </div>
        {target.note ? <p className="mt-3 text-sm leading-reading">{target.note}</p> : null}
      </section>

      <section className="card-file">
        <h3 className="text-lg font-bold">기재할 자료</h3>
        <p className="mt-1 text-sm">
          <strong>{source?.title}</strong>
        </p>
        <dl className="mt-2 grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-sm text-ink-soft">
          <dt className="font-bold">만든 이</dt>
          <dd>{source?.author}</dd>
          <dt className="font-bold">만든 때</dt>
          <dd>{source?.year}</dd>
          <dt className="font-bold">실린 곳</dt>
          <dd>{source?.site}</dd>
          <dt className="font-bold">주소</dt>
          <dd className="break-all">{source?.url ?? '—'}</dd>
        </dl>
      </section>

      <section className="card-file">
        <h3 className="text-lg font-bold">직접 적어 보기</h3>
        <p className="mt-1 text-sm text-ink-soft">
          마침표와 괄호도 직접 적는다. 구두점은 장식이 아니라 항목과 항목을 끊어 주는 기호다.
        </p>

        <div className="mt-4 space-y-3">
          {FIELD_ORDER.map((key) => {
            const meta = FIELD_META[key];
            const fieldResult = result?.perField[key];
            return (
              <div key={key}>
                <label htmlFor={`apa-${key}`} className="block text-sm font-bold">
                  {meta.label}
                  {fieldResult ? (
                    <span
                      className={[
                        'ml-2 rounded-sm px-2 py-0.5 text-xs',
                        fieldResult.ok ? 'bg-ink text-kraft-light' : 'bg-alert text-white',
                      ].join(' ')}
                    >
                      {fieldResult.points} / {fieldResult.maxPoints}점
                    </span>
                  ) : null}
                </label>
                <input
                  id={`apa-${key}`}
                  type="text"
                  value={fields[key]}
                  onChange={(e) => setField(key, e.target.value)}
                  placeholder={meta.placeholder}
                  className={[
                    'mt-1 w-full rounded-sm border bg-white/80 p-2',
                    fieldResult && !fieldResult.ok ? 'border-alert' : 'border-kraft-dark',
                  ].join(' ')}
                />
                <p className="mt-1 text-xs text-ink-soft">{meta.help}</p>
                {fieldResult && !fieldResult.ok ? (
                  <ul className="mt-1 space-y-0.5 text-sm text-alert">
                    {fieldResult.content.state !== 'exact' ? (
                      <li>· {fieldResult.content.message}</li>
                    ) : null}
                    {fieldResult.punctuation.message ? (
                      <li>· {fieldResult.punctuation.message}</li>
                    ) : null}
                  </ul>
                ) : null}
              </div>
            );
          })}
        </div>

        <div className="mt-4 rounded-sm border border-kraft-dark bg-white/60 p-3">
          <p className="text-xs font-bold text-ink-soft">지금까지 적은 것을 이어 붙이면</p>
          <p className="mt-1 break-all font-mono text-sm leading-reading">
            {FIELD_ORDER.map((k) => fields[k]?.trim())
              .filter(Boolean)
              .join(' ') || '(아직 비어 있음)'}
          </p>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <button type="button" onClick={grade} className="btn-primary">
            채점하기
          </button>
          {result ? (
            <button type="button" onClick={retry} className="btn-quiet">
              다시 입력해 보기
            </button>
          ) : null}
          <span className="self-center text-sm text-ink-soft">
            시도 {state.attempts}회 · 최고 {state.bestScore}점
          </span>
        </div>
      </section>

      {result ? (
        <section className="card-file">
          <h3 className="text-lg font-bold">
            채점 결과 {result.total} / 100점
          </h3>
          <div className="mt-2 h-3 w-full overflow-hidden rounded-sm bg-kraft-dark/40">
            <div
              className="h-full bg-ink transition-[width] duration-300"
              style={{ width: `${result.total}%` }}
            />
          </div>
          <p className="mt-3 text-sm leading-reading">
            {result.total === 100
              ? '모든 항목이 정확하다. 이제 이 출처만 보고도 누구든 같은 자료를 찾아갈 수 있다.'
              : '틀린 곳이 있다는 말은 아직 남이 이 자료를 못 찾는다는 뜻이다. 위 항목별 안내를 보고 고쳐 보자.'}
          </p>
        </section>
      ) : null}

      {revealed ? (
        <section className="card-file border-l-4 border-l-ink">
          <h3 className="text-lg font-bold">정답 예시</h3>
          <p className="mt-2 break-all font-mono text-sm leading-reading">
            {target.correctFormat || composeFromTarget(target.components)}
          </p>
          <p className="mt-2 text-sm text-ink-soft">
            베껴 쓰고 끝내지 말고, <strong>다시 입력해 보기</strong>를 눌러 보지 않고 적어 보자.
          </p>
        </section>
      ) : null}

      <section className="card-file">
        <h3 className="text-lg font-bold">한국어 자료를 적을 때</h3>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-sm leading-reading">
          {KOREAN_RULES.map((rule) => (
            <li key={rule}>{rule}</li>
          ))}
        </ul>
        <details className="mt-3">
          <summary className="cursor-pointer text-sm font-bold">다른 자료 유형의 양식 보기</summary>
          <ul className="mt-2 space-y-1.5 text-sm">
            {Object.values(TEMPLATES).map((t) => (
              <li key={t.label}>
                <span className="font-bold">{t.label}: </span>
                <span className="font-mono">{t.pattern}</span>
              </li>
            ))}
          </ul>
        </details>
      </section>
    </div>
  );
}
