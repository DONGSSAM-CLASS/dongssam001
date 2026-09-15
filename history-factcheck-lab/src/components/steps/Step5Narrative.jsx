const HEDGE_WORDS = ['보인다', '전해진다', '견해', '해석', '추정', '가능성', '알려져', '한다는'];
const CERTAINTY_WORDS = ['무조건', '절대', '모두', '전부', '100%', '틀림없', '분명히'];

export default function Step5Narrative({ caseData, state, onChange }) {
  const memo = state.memo ?? ['', '', ''];
  const narrative = state.narrative ?? '';

  const sentenceCount = narrative
    .split(/[.!?。]\s*/)
    .map((s) => s.trim())
    .filter(Boolean).length;

  const citesSource = caseData.sources.some(
    (s) =>
      narrative.includes(s.id) ||
      (s.title && narrative.includes(s.title.slice(0, 6))) ||
      (s.author && s.author.length > 2 && narrative.includes(s.author)),
  );
  const usesHedge = HEDGE_WORDS.some((w) => narrative.includes(w));
  const usesCertainty = CERTAINTY_WORDS.some((w) => narrative.includes(w));

  function setMemo(idx, value) {
    onChange((prev) => {
      const next = [...(prev.memo ?? ['', '', ''])];
      next[idx] = value;
      return { ...prev, memo: next };
    });
  }

  return (
    <div className="space-y-5">
      <section className="card-file">
        <h2 className="text-xl font-bold">5단계 · 세 줄 출처 메모</h2>
        <p className="mt-1 text-sm leading-reading text-ink-soft">
          자료 한 건을 골라, 아래 세 줄을 채워 보자. 이 세 줄이 채워지지 않는 자료는 아직 근거로 쓸
          준비가 안 된 자료다.
        </p>
        <div className="mt-4 space-y-3">
          {caseData.memoPrompts.map((prompt, i) => (
            <div key={prompt}>
              <label htmlFor={`memo-${i}`} className="block text-sm font-bold">
                {prompt}
              </label>
              <textarea
                id={`memo-${i}`}
                value={memo[i] ?? ''}
                onChange={(e) => setMemo(i, e.target.value)}
                rows={2}
                className="mt-1 w-full rounded-sm border border-kraft-dark bg-white/80 p-2 leading-reading"
              />
            </div>
          ))}
        </div>
      </section>

      <section className="card-file">
        <h2 className="text-xl font-bold">나의 서사</h2>
        <p className="mt-2 leading-reading">{caseData.narrativePrompt}</p>
        <textarea
          id="narrative"
          value={narrative}
          onChange={(e) => {
            const { value } = e.target;
            onChange((prev) => ({ ...prev, narrative: value }));
          }}
          rows={8}
          placeholder="검증한 자료를 근거로 삼아 써 보자."
          className="mt-3 w-full rounded-sm border border-kraft-dark bg-white/80 p-3 leading-reading"
        />

        <div className="mt-3 rounded-sm bg-kraft-dark/25 p-3 text-sm">
          <p className="font-bold">스스로 점검</p>
          <ul className="mt-1 space-y-1">
            <li>
              {sentenceCount >= 3 && sentenceCount <= 5 ? '✓' : '·'} 3~5문장으로 썼는가 (현재{' '}
              {sentenceCount}문장)
            </li>
            <li>
              {citesSource ? '✓' : '·'} 자료를 한 건 이상 근거로 들었는가 (자료 번호나 제목을 적으면
              확인된다)
            </li>
            <li>
              {usesHedge ? '✓' : '·'} 확실한 것과 확실하지 않은 것을 구별해 썼는가 (&lsquo;~로 보인다&rsquo;,
              &lsquo;~는 견해가 있다&rsquo;)
            </li>
            <li>
              {usesCertainty ? '⚠' : '✓'} 근거보다 앞서 나간 단정적인 표현을 쓰지 않았는가
              {usesCertainty ? ' — 지나친 단정 표현이 보인다. 자료가 거기까지 말해 주는지 확인해 보자.' : ''}
            </li>
          </ul>
          <p className="mt-2 text-xs text-ink-soft">
            이 점검은 글자를 기계적으로 찾아본 결과일 뿐 채점이 아니다. 최종 판단은 스스로, 그리고
            친구·선생님과 함께 한다.
          </p>
        </div>
      </section>
    </div>
  );
}
