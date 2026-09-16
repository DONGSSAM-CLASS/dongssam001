import { useState } from 'react';
import { CircleHelp } from 'lucide-react';
import { GLOSSARY, type GlossaryKey } from '../content/glossary';

/**
 * 어려운 낱말 옆에 붙이는 뜻 풀이 말풍선.
 * 색만으로 알려 주지 않도록 물음표 아이콘과 점선 밑줄을 함께 쓴다.
 */
export default function HelpTooltip({ term, children }: { term: GlossaryKey; children?: string }) {
  const [open, setOpen] = useState(false);
  const label = children ?? term;

  return (
    <span className="relative inline-flex items-center gap-0.5 align-baseline">
      <button
        type="button"
        className="inline-flex items-center gap-0.5 underline decoration-dotted decoration-2 underline-offset-4 text-primary font-semibold"
        aria-label={`${label} 뜻 풀이 보기`}
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        onBlur={() => setOpen(false)}
      >
        {label}
        <CircleHelp className="h-4 w-4 shrink-0" aria-hidden />
      </button>
      {open && (
        <span
          role="tooltip"
          className="absolute left-0 top-full z-30 mt-2 w-64 max-w-[80vw] rounded-2xl border border-primary/30 bg-base-100 p-3 text-sm font-normal text-base-content shadow-sm"
        >
          <span className="block font-bold text-primary">{term}</span>
          {GLOSSARY[term]}
        </span>
      )}
    </span>
  );
}
