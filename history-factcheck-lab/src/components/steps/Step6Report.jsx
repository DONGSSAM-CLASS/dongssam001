import { useRef } from 'react';

import rubric from '../../data/rubric.json';
import { ERROR_TYPES, VERDICT_CHOICES } from '../../lib/cases.js';
import { scoreApa, scoreSentences, scoreWorkbench } from '../../lib/scoring.js';

function verdictLabel(key) {
  return VERDICT_CHOICES.find((c) => c.key === key)?.label ?? '미판정';
}

/** 결과 카드를 PNG로 저장한다. 외부 라이브러리 없이 SVG foreignObject → canvas 경로를 쓴다. */
async function saveAsPng(node, filename) {
  const { width } = node.getBoundingClientRect();
  const height = node.scrollHeight;
  const clone = node.cloneNode(true);
  clone.setAttribute('xmlns', 'http://www.w3.org/1999/xhtml');

  // 렌더링에 쓰인 스타일을 인라인으로 옮겨 붙인다(외부 CSS는 SVG 안에서 적용되지 않는다).
  const cssText = Array.from(document.styleSheets)
    .map((sheet) => {
      try {
        return Array.from(sheet.cssRules)
          .map((r) => r.cssText)
          .join('\n');
      } catch {
        return '';
      }
    })
    .join('\n');

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">
    <foreignObject width="100%" height="100%">
      <div xmlns="http://www.w3.org/1999/xhtml" style="width:${width}px;background:#f5efe1;">
        <style>${cssText}</style>
        ${new XMLSerializer().serializeToString(clone)}
      </div>
    </foreignObject>
  </svg>`;

  const blob = new Blob([svg], { type: 'image/svg+xml;charset=utf-8' });
  const url = URL.createObjectURL(blob);

  try {
    const img = new Image();
    await new Promise((resolve, reject) => {
      img.onload = resolve;
      img.onerror = () => reject(new Error('이미지 변환 실패'));
      img.src = url;
    });
    const scale = Math.min(2, window.devicePixelRatio || 1);
    const canvas = document.createElement('canvas');
    canvas.width = width * scale;
    canvas.height = height * scale;
    const ctx = canvas.getContext('2d');
    ctx.scale(scale, scale);
    ctx.fillStyle = '#f5efe1';
    ctx.fillRect(0, 0, width, height);
    ctx.drawImage(img, 0, 0);
    const link = document.createElement('a');
    link.download = filename;
    link.href = canvas.toDataURL('image/png');
    link.click();
    return true;
  } finally {
    URL.revokeObjectURL(url);
  }
}

export default function Step6Report({ caseData, caseState, state, onChange, studentName }) {
  const cardRef = useRef(null);

  const sentences = scoreSentences(caseData, caseState);
  const workbench = scoreWorkbench(caseData, caseState);
  const apa = scoreApa(caseState);
  const chosenOption = caseData.questionStage.options.find(
    (o) => o.id === caseState.step0?.chosenOptionId,
  );

  function setRubric(axisId, levelKey) {
    onChange((prev) => ({
      ...prev,
      rubric: { ...prev.rubric, [axisId]: levelKey },
      completedAt: Date.now(),
    }));
  }

  async function handlePng() {
    try {
      await saveAsPng(cardRef.current, `역사탐정리포트_${caseData.id}.png`);
    } catch {
      window.alert(
        'PNG 저장에 실패했습니다. 기기가 지원하지 않는 경우일 수 있어요. 대신 "인쇄하기"를 눌러 PDF로 저장해 보세요.',
      );
    }
  }

  return (
    <div className="space-y-5">
      <section className="card-file no-print">
        <h2 className="text-xl font-bold">6단계 · 탐정 리포트</h2>
        <p className="mt-1 text-sm leading-reading text-ink-soft">
          아래 루브릭 네 축으로 스스로를 평가한 뒤, 결과 카드를 인쇄하거나 이미지로 저장하자.
        </p>
      </section>

      <section className="card-file no-print">
        <h3 className="text-lg font-bold">루브릭 자기평가</h3>
        <p className="mt-1 text-xs text-ink-soft">{rubric.source}</p>
        <div className="mt-4 space-y-4">
          {rubric.axes.map((axis, i) => (
            <div key={axis.id}>
              <p className="font-bold">
                {i + 1}. {axis.title}
              </p>
              <p className="text-xs text-ink-soft">{axis.basis}</p>
              <ul className="mt-2 space-y-1.5">
                {rubric.levels.map((level) => {
                  const picked = state.rubric?.[axis.id] === level.key;
                  return (
                    <li key={level.key}>
                      <button
                        type="button"
                        onClick={() => setRubric(axis.id, level.key)}
                        aria-pressed={picked}
                        className={[
                          'w-full rounded-sm border px-3 py-2 text-left text-sm leading-reading transition-colors duration-150',
                          picked
                            ? 'border-ink bg-ink text-kraft-light'
                            : 'border-kraft-dark bg-white/70 hover:bg-kraft-light',
                        ].join(' ')}
                      >
                        <span className="font-bold">{level.label} · </span>
                        {axis.descriptors[level.key]}
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/* 결과 카드 (인쇄·PNG 대상) */}
      <section ref={cardRef} className="card-file">
        <header className="border-b-2 border-ink pb-2">
          <p className="text-xs tracking-widest text-ink-soft">역사탐정 프로젝트 · 사건 종결 보고서</p>
          <h3 className="mt-1 text-xl font-bold leading-snug">{caseData.title}</h3>
          <p className="mt-1 text-sm text-ink-soft">
            {caseData.period} · 성취기준 {caseData.curriculum.standards.join(', ')}
            {studentName ? ` · 탐정 ${studentName}` : ''}
          </p>
        </header>

        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <div className="rounded-sm bg-kraft-dark/30 p-3 text-center">
            <p className="text-xs font-bold">문장 판정 정확도</p>
            <p className="text-2xl font-bold">{sentences.percent}%</p>
            <p className="text-xs text-ink-soft">
              {sentences.correct} / {sentences.total} 문장
            </p>
          </div>
          <div className="rounded-sm bg-kraft-dark/30 p-3 text-center">
            <p className="text-xs font-bold">사료 검증</p>
            <p className="text-2xl font-bold">{workbench.percent}%</p>
            <p className="text-xs text-ink-soft">
              {workbench.correct} / {workbench.total} 문항
            </p>
          </div>
          <div className="rounded-sm bg-kraft-dark/30 p-3 text-center">
            <p className="text-xs font-bold">출처 기재 (APA)</p>
            <p className="text-2xl font-bold">{apa.best}점</p>
            <p className="text-xs text-ink-soft">시도 {apa.attempts}회</p>
          </div>
        </div>

        <div className="mt-4">
          <p className="text-sm font-bold">나의 탐구 질문</p>
          <p className="mt-1 leading-reading">
            {caseState.step0?.myQuestion?.trim() || '(아직 쓰지 않음)'}
          </p>
          {chosenOption ? (
            <p className="mt-1 text-xs text-ink-soft">
              고른 보기: {chosenOption.text} ({chosenOption.good ? '탐구 가능' : '탐구하기 어려움'})
            </p>
          ) : null}
        </div>

        <div className="mt-4">
          <p className="text-sm font-bold">문장별 판정</p>
          <ul className="mt-1 space-y-1 text-sm">
            {caseData.aiResponse.sentences.map((s) => {
              const d = sentences.detail.find((x) => x.no === s.no);
              return (
                <li key={s.no} className="flex flex-wrap items-baseline gap-x-2">
                  <span className="font-bold">{s.no}.</span>
                  <span className={d?.isCorrect ? '' : 'text-alert'}>
                    내 판정 {verdictLabel(d?.got)} / 자료 판정 {verdictLabel(d?.expected)}
                  </span>
                  {s.errorType ? (
                    <span className="rounded-sm bg-alert px-1.5 py-0.5 text-xs text-white">
                      {ERROR_TYPES[s.errorType]?.label}
                    </span>
                  ) : null}
                </li>
              );
            })}
          </ul>
        </div>

        <div className="mt-4">
          <p className="text-sm font-bold">세 줄 출처 메모</p>
          <ol className="mt-1 list-decimal space-y-0.5 pl-5 text-sm leading-reading">
            {(caseState.step5?.memo ?? []).map((m, i) => (
              <li key={caseData.memoPrompts[i]}>{m?.trim() || '(비어 있음)'}</li>
            ))}
          </ol>
        </div>

        <div className="mt-4">
          <p className="text-sm font-bold">나의 서사</p>
          <p className="mt-1 whitespace-pre-wrap leading-reading">
            {caseState.step5?.narrative?.trim() || '(아직 쓰지 않음)'}
          </p>
        </div>

        <div className="mt-4">
          <p className="text-sm font-bold">루브릭 자기평가</p>
          <ul className="mt-1 space-y-1 text-sm leading-reading">
            {rubric.axes.map((axis, i) => {
              const key = state.rubric?.[axis.id];
              const level = rubric.levels.find((l) => l.key === key);
              return (
                <li key={axis.id}>
                  <span className="font-bold">
                    {i + 1}. {axis.title}:{' '}
                  </span>
                  {level ? level.label : '(미평가)'}
                </li>
              );
            })}
          </ul>
        </div>

        {caseData.contested ? (
          <p className="mt-4 border-t border-kraft-dark pt-2 text-xs leading-reading text-ink-soft">
            이 사건은 연구자들 사이에서도 해석이 갈리는 주제다. 이 리포트의 점수는 &lsquo;정답을 맞힌
            정도&rsquo;가 아니라 &lsquo;자료를 따져 본 과정&rsquo;의 기록이다.
          </p>
        ) : null}
      </section>

      <div className="no-print flex flex-wrap gap-2">
        <button type="button" onClick={() => window.print()} className="btn-primary">
          인쇄하기 (PDF 저장)
        </button>
        <button type="button" onClick={handlePng} className="btn-quiet">
          PNG 이미지로 저장
        </button>
      </div>
    </div>
  );
}
