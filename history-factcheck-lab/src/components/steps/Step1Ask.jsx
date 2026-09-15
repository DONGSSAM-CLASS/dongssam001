import { useEffect, useRef, useState } from 'react';

const CHAR_INTERVAL_MS = 14;

/**
 * 1단계 · AI에게 묻기
 *
 * 여기서 '재생'되는 답변은 실시간 생성 결과가 아니라 교사가 검수한 JSON 스크립트다.
 * 타이핑 효과는 AI 채팅 UI의 느낌만 흉내 낸 연출이며, 내용은 언제 몇 번을 돌려도 같다.
 */
export default function Step1Ask({ caseData }) {
  const { prompt, sentences } = caseData.aiResponse;
  const [revealedCount, setRevealedCount] = useState(0);
  const [typedLength, setTypedLength] = useState(0);
  const [skipped, setSkipped] = useState(false);
  const timerRef = useRef(null);

  const finished = skipped || revealedCount >= sentences.length;

  useEffect(() => {
    if (skipped || revealedCount >= sentences.length) return undefined;
    const target = sentences[revealedCount].text;

    timerRef.current = window.setInterval(() => {
      setTypedLength((len) => {
        if (len >= target.length) {
          window.clearInterval(timerRef.current);
          // 다음 문장으로 넘어간다.
          window.setTimeout(() => {
            setRevealedCount((n) => n + 1);
            setTypedLength(0);
          }, 180);
          return len;
        }
        return len + 1;
      });
    }, CHAR_INTERVAL_MS);

    return () => window.clearInterval(timerRef.current);
  }, [revealedCount, sentences, skipped]);

  const visible = skipped ? sentences : sentences.slice(0, revealedCount);
  const typing = !skipped && revealedCount < sentences.length ? sentences[revealedCount] : null;

  return (
    <div className="space-y-5">
      <div
        role="note"
        className="rounded-sm border-2 border-alert bg-alert/5 p-3 text-sm leading-reading"
      >
        <strong>이 답변은 수업용으로 미리 작성된 예시입니다. 실제 AI 답변과 마찬가지로 오류가 섞여
        있습니다.</strong>{' '}
        버튼을 몇 번을 눌러도 똑같은 답변이 나옵니다. 여러분이 할 일은 답변을 외우는 것이 아니라,
        어떤 문장이 자료로 확인되는지 가려내는 것입니다.
      </div>

      <section className="card-file">
        <h2 className="text-xl font-bold">1단계 · AI에게 묻기</h2>

        <div className="mt-4 space-y-3">
          <div className="ml-auto max-w-[85%] rounded-sm bg-ink px-3 py-2 text-kraft-light">
            <p className="text-xs opacity-70">나</p>
            <p className="leading-reading">{prompt}</p>
          </div>

          <div className="max-w-[95%] rounded-sm border border-kraft-dark bg-white/80 px-3 py-2">
            <p className="text-xs text-ink-soft">AI 도우미 (수업용 시뮬레이션)</p>
            <ol className="mt-2 space-y-2">
              {visible.map((s) => (
                <li key={s.no} className="flex gap-2 leading-reading">
                  <span className="shrink-0 font-bold text-ink-soft">{s.no}.</span>
                  <span>{s.text}</span>
                </li>
              ))}
              {typing ? (
                <li className="flex gap-2 leading-reading">
                  <span className="shrink-0 font-bold text-ink-soft">{typing.no}.</span>
                  <span>
                    {typing.text.slice(0, typedLength)}
                    <span className="ml-0.5 inline-block h-4 w-2 animate-pulse bg-ink align-middle" />
                  </span>
                </li>
              ) : null}
            </ol>
          </div>
        </div>

        {!finished ? (
          <button type="button" onClick={() => setSkipped(true)} className="btn-quiet mt-4">
            건너뛰고 전체 보기
          </button>
        ) : (
          <div className="mt-4 rounded-sm bg-kraft-dark/25 p-3 text-sm leading-reading">
            <p className="font-bold">읽기 전에 한 가지</p>
            <p className="mt-1">
              답변이 매끄럽게 잘 쓰였다는 것과, 그 내용이 사실이라는 것은 전혀 다른 문제다. 문장에
              번호가 붙어 있는 이유는 다음 단계에서 <strong>한 문장씩 따로 판정</strong>하기
              위해서다.
            </p>
          </div>
        )}
      </section>
    </div>
  );
}
