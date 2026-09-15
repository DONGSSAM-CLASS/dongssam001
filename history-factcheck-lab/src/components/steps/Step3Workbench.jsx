import { useState } from 'react';

import SourceCard, { SourceListItem } from '../SourceCard.jsx';
import { getSource } from '../../lib/cases.js';

const STAGE_KEYS = ['sourcing', 'contextualization', 'corroboration'];

function isCorrectAnswer(question, value) {
  if (value == null || value === '') return false;
  if (question.type === 'choice') return Number(value) === question.answerIndex;
  const text = String(value).replace(/\s+/g, '').toLowerCase();
  if (text.length < 2) return false;
  return (question.acceptKeywords ?? []).some((kw) =>
    text.includes(kw.replace(/\s+/g, '').toLowerCase()),
  );
}

function QuestionBlock({ question, state, onChange }) {
  const [draft, setDraft] = useState(
    question.type === 'short' ? (state.answers[question.id] ?? '') : '',
  );
  const attempts = state.attempts[question.id] ?? 0;
  const correct = Boolean(state.correct[question.id]);
  const revealed = Boolean(state.revealed[question.id]);

  function submit(value) {
    const ok = isCorrectAnswer(question, value);
    onChange((prev) => {
      const nextAttempts = (prev.attempts[question.id] ?? 0) + 1;
      return {
        ...prev,
        answers: { ...prev.answers, [question.id]: value },
        attempts: { ...prev.attempts, [question.id]: nextAttempts },
        correct: { ...prev.correct, [question.id]: ok },
        // 2회 오답 후 해설 공개
        revealed: {
          ...prev.revealed,
          [question.id]: prev.revealed[question.id] || ok || nextAttempts >= 2,
        },
      };
    });
  }

  const settled = correct || revealed;

  return (
    <li className="rounded-sm border border-kraft-dark bg-white/70 p-3">
      <p className="font-bold leading-reading">{question.text}</p>

      {question.type === 'choice' ? (
        <ul className="mt-2 space-y-1.5">
          {question.options.map((opt, i) => {
            const picked = Number(state.answers[question.id]) === i;
            const isAnswer = i === question.answerIndex;
            return (
              <li key={opt}>
                <button
                  type="button"
                  disabled={correct}
                  onClick={() => submit(i)}
                  className={[
                    'w-full rounded-sm border px-3 py-2 text-left text-sm leading-reading transition-colors duration-150',
                    settled && isAnswer
                      ? 'border-ink bg-ink text-kraft-light'
                      : picked
                        ? 'border-alert bg-alert/10'
                        : 'border-kraft-dark bg-white hover:bg-kraft-light',
                    correct ? 'cursor-default' : '',
                  ].join(' ')}
                >
                  {opt}
                </button>
              </li>
            );
          })}
        </ul>
      ) : (
        <div className="mt-2">
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            rows={2}
            placeholder="한 문장으로 적어 보자"
            className="w-full rounded-sm border border-kraft-dark bg-white p-2 text-sm leading-reading"
          />
          <button type="button" onClick={() => submit(draft)} className="btn-quiet mt-2 text-sm">
            답 제출하기
          </button>
        </div>
      )}

      {attempts > 0 && !correct && !revealed ? (
        <div className="mt-2 rounded-sm bg-kraft-dark/30 p-2 text-sm leading-reading">
          <p className="font-bold">다시 한 번 — 자료의 이 부분을 보자</p>
          <p className="mt-1">{question.hint}</p>
          <p className="mt-1 text-xs text-ink-soft">
            (한 번 더 시도하면 해설이 열린다. 시도 {attempts}회)
          </p>
        </div>
      ) : null}

      {correct ? (
        <p className="mt-2 rounded-sm bg-ink/10 p-2 text-sm leading-reading">
          <span className="font-bold">확인됨 — </span>
          {question.explanation}
        </p>
      ) : revealed ? (
        <p className="mt-2 rounded-sm bg-alert/10 p-2 text-sm leading-reading">
          <span className="font-bold">해설 — </span>
          {question.explanation}
        </p>
      ) : null}

      {question.type === 'short' && settled ? (
        <p className="mt-1 text-xs text-ink-soft">
          단답형은 정해진 한 가지 답만 맞는 문제가 아니다. 해설과 내 답을 견주어 보자.
        </p>
      ) : null}
    </li>
  );
}

export default function Step3Workbench({ caseData, state, onChange }) {
  const [selectedSourceId, setSelectedSourceId] = useState(caseData.sources[0]?.id ?? null);
  const [mobileTab, setMobileTab] = useState('viewer');
  const [zoom, setZoom] = useState(1);

  const selected = getSource(caseData, selectedSourceId);
  const stages = STAGE_KEYS.map((k) => caseData.workbench?.[k]).filter(Boolean);

  const listPane = (
    <div className="space-y-2">
      <p className="text-sm font-bold">사료 목록 ({caseData.sources.length}건)</p>
      {caseData.sources.map((s) => (
        <SourceListItem
          key={s.id}
          source={s}
          active={s.id === selectedSourceId}
          onSelect={(id) => {
            setSelectedSourceId(id);
            setMobileTab('viewer');
          }}
        />
      ))}
    </div>
  );

  const viewerPane = (
    <div>
      <div className="no-print mb-2 flex items-center gap-2 text-sm">
        <span className="font-bold">본문 크기</span>
        <button
          type="button"
          onClick={() => setZoom((z) => Math.max(0.9, Number((z - 0.15).toFixed(2))))}
          className="btn-quiet px-2 py-0.5 text-sm"
          aria-label="본문 작게"
        >
          －
        </button>
        <span>{Math.round(zoom * 100)}%</span>
        <button
          type="button"
          onClick={() => setZoom((z) => Math.min(1.9, Number((z + 0.15).toFixed(2))))}
          className="btn-quiet px-2 py-0.5 text-sm"
          aria-label="본문 크게"
        >
          ＋
        </button>
      </div>
      <div style={{ fontSize: `${zoom}rem` }}>
        <SourceCard source={selected} />
      </div>
    </div>
  );

  const questionPane = (
    <div className="space-y-4">
      {stages.map((stage, idx) => (
        <section key={STAGE_KEYS[idx]} className="card-file">
          <h3 className="text-lg font-bold">{stage.label}</h3>
          <p className="mt-1 text-sm text-ink-soft leading-reading">{stage.guide}</p>
          {stage.sourceId ? (
            <button
              type="button"
              onClick={() => {
                setSelectedSourceId(stage.sourceId);
                setMobileTab('viewer');
              }}
              className="btn-quiet mt-2 text-sm"
            >
              이 단계의 자료 {stage.sourceId} 열기
            </button>
          ) : null}
          {stage.sourceIds ? (
            <p className="mt-2 text-sm text-ink-soft">
              견주어 볼 자료: {stage.sourceIds.join(', ')}
            </p>
          ) : null}
          <ol className="mt-3 space-y-3">
            {stage.questions.map((q) => (
              <QuestionBlock key={q.id} question={q} state={state} onChange={onChange} />
            ))}
          </ol>
        </section>
      ))}

      {caseData.interpretations?.length ? (
        <section className="card-file border-l-4 border-l-alert">
          <h3 className="text-lg font-bold">이 주제에는 서로 다른 해석이 있다</h3>
          <p className="mt-1 text-sm leading-reading text-ink-soft">
            아래 해석 가운데 무엇이 &lsquo;정답&rsquo;인지 고르는 것이 이 수업의 목표가 아니다.
            각 해석이 <strong>어떤 자료에 기대고 있는지</strong>를 말할 수 있는 것이 목표다.
          </p>
          <ul className="mt-3 space-y-3">
            {caseData.interpretations.map((it) => (
              <li key={it.label} className="rounded-sm bg-kraft-dark/25 p-3">
                <p className="font-bold">
                  {it.label}. {it.claim}
                </p>
                <p className="mt-1 text-sm leading-reading">
                  <span className="font-bold">기대는 자료: </span>
                  {it.basis}
                </p>
                {it.sourceIds?.length ? (
                  <p className="mt-1 text-xs text-ink-soft">관련 자료: {it.sourceIds.join(', ')}</p>
                ) : null}
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );

  return (
    <div className="space-y-4">
      <section className="card-file">
        <h2 className="text-xl font-bold">3단계 · 사료 검증 워크벤치</h2>
        <p className="mt-1 text-sm leading-reading text-ink-soft">
          역사학자가 자료를 읽을 때 쓰는 세 가지 질문을 그대로 따라가 보자.{' '}
          <strong>출처 확인 → 맥락화 → 교차검증</strong>. 틀려도 정답을 바로 알려 주지 않는다.
          먼저 자료의 어느 대목을 다시 봐야 하는지 알려 줄 것이다.
        </p>
      </section>

      {/* 모바일: 탭 전환 */}
      <div className="no-print flex gap-1 lg:hidden">
        {[
          { key: 'list', label: '사료 목록' },
          { key: 'viewer', label: '자료 보기' },
          { key: 'questions', label: '검증 질문' },
        ].map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setMobileTab(t.key)}
            aria-pressed={mobileTab === t.key}
            className={[
              'flex-1 rounded-sm border px-2 py-2 text-sm transition-colors duration-150',
              mobileTab === t.key
                ? 'border-ink bg-ink text-kraft-light'
                : 'border-kraft-dark bg-white/70',
            ].join(' ')}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="lg:hidden">
        {mobileTab === 'list' ? listPane : null}
        {mobileTab === 'viewer' ? viewerPane : null}
        {mobileTab === 'questions' ? questionPane : null}
      </div>

      {/* 데스크톱: 3분할 */}
      <div className="hidden gap-4 lg:grid lg:grid-cols-[minmax(0,14rem)_minmax(0,1.3fr)_minmax(0,1.2fr)]">
        <div>{listPane}</div>
        <div>{viewerPane}</div>
        <div>{questionPane}</div>
      </div>
    </div>
  );
}
