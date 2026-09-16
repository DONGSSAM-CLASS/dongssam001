import { ChevronLeft, ChevronRight } from 'lucide-react';

/**
 * 차시 안에서 '한 화면에 한 활동'을 보여 주기 위한 단계 이동 막대.
 * daisyUI steps 로 지금 어디인지 보여 주고, 아래에 이전·다음 버튼을 둔다.
 */
export default function StepNav({
  steps,
  current,
  onChange,
  color = 'primary',
}: {
  steps: string[];
  current: number;
  onChange: (next: number) => void;
  color?: 'primary' | 'secondary' | 'accent' | 'success' | 'info';
}) {
  const stepColor = {
    primary: 'step-primary',
    secondary: 'step-secondary',
    accent: 'step-accent',
    success: 'step-success',
    info: 'step-info',
  }[color];

  return (
    <nav className="no-print" aria-label="활동 단계">
      <ul className="steps steps-horizontal w-full overflow-x-auto text-xs">
        {steps.map((label, i) => (
          <li key={label} className={`step ${i <= current ? stepColor : ''}`}>
            <button
              type="button"
              className="px-1 py-1 text-xs"
              aria-current={i === current ? 'step' : undefined}
              onClick={() => onChange(i)}
            >
              {label}
            </button>
          </li>
        ))}
      </ul>
      <div className="mt-4 flex items-center justify-between gap-2">
        <button
          type="button"
          className="btn btn-ghost gap-1 rounded-2xl"
          disabled={current === 0}
          onClick={() => onChange(current - 1)}
        >
          <ChevronLeft className="h-4 w-4" aria-hidden />
          이전
        </button>
        <button
          type="button"
          className="btn btn-ghost gap-1 rounded-2xl"
          disabled={current >= steps.length - 1}
          onClick={() => onChange(current + 1)}
        >
          다음
          <ChevronRight className="h-4 w-4" aria-hidden />
        </button>
      </div>
    </nav>
  );
}
