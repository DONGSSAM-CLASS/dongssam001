export const STEP_META = [
  { no: 0, short: '질문', name: '탐구 질문 다듬기', basis: '교수·학습 (2)-(나), 평가 (2)-(라)①' },
  { no: 1, short: 'AI', name: 'AI에게 묻기', basis: '교수·학습 (2)-(마)' },
  { no: 2, short: '판정', name: '문장 판정', basis: '과정·기능 ②' },
  { no: 3, short: '검증', name: '사료 검증 워크벤치', basis: '교수·학습 (2)-(가), 과정·기능 ①' },
  { no: 4, short: '출처', name: '출처 기재', basis: '과정·기능 ③' },
  { no: 5, short: '서사', name: '세 줄 메모 + 나의 서사', basis: '과정·기능 ④, 평가 (2)-(나)' },
  { no: 6, short: '리포트', name: '탐정 리포트', basis: '평가 (2)-(다)' },
];

export default function StepIndicator({ current, done = [], onJump }) {
  return (
    <nav aria-label="학습 단계" className="no-print sticky top-0 z-10 -mx-4 bg-kraft-light/95 px-4 py-2 shadow-sm backdrop-blur">
      <ol className="flex items-stretch gap-1 overflow-x-auto">
        {STEP_META.map((step) => {
          const isCurrent = step.no === current;
          const isDone = done.includes(step.no);
          return (
            <li key={step.no} className="min-w-0 flex-1">
              <button
                type="button"
                onClick={() => onJump(step.no)}
                aria-current={isCurrent ? 'step' : undefined}
                title={`${step.no}단계 · ${step.name}`}
                className={[
                  'flex w-full flex-col items-center gap-0.5 rounded-sm border px-1 py-1.5 transition-colors duration-150',
                  isCurrent
                    ? 'border-ink bg-ink text-kraft-light'
                    : isDone
                      ? 'border-ink-soft bg-kraft-dark/50 text-ink'
                      : 'border-kraft-dark bg-white/60 text-ink-soft hover:bg-kraft-dark/30',
                ].join(' ')}
              >
                <span className="text-xs font-bold">
                  {step.no}
                  {isDone && !isCurrent ? ' ✓' : ''}
                </span>
                <span className="truncate text-[11px] leading-tight">{step.short}</span>
              </button>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
