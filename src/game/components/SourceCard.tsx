import { useState } from 'react';
import { BookOpenText, ChevronDown, Quote } from 'lucide-react';
import type { Level, Source } from '../types';

/**
 * 사료 카드 — 원문(낡은 문서 느낌) + 중·고 수준별 해석본 + APA 출처.
 * 요구사항 3: 실제 사료의 원문, 학생 눈높이 해석본, 인물 대사 밑 APA 출처 표기.
 */
export function SourceCard({ source, level }: { source: Source; level: Level }) {
  const [open, setOpen] = useState(true);
  return (
    <figure className="rounded-box border border-primary/30 bg-base-200/70 overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center gap-2 px-4 py-2 text-left"
        aria-expanded={open}
      >
        <BookOpenText className="size-4 text-primary" aria-hidden />
        <span className="badge badge-sm badge-primary badge-outline">{source.kind}</span>
        <span className="text-sm font-semibold text-base-content/90">사료 살펴보기</span>
        <ChevronDown className={`ml-auto size-4 transition-transform ${open ? 'rotate-180' : ''}`} aria-hidden />
      </button>

      {open && (
        <div className="space-y-3 px-4 pb-4">
          {/* 원문 */}
          <div className="source-original relative rounded-md p-4 leading-relaxed">
            <Quote className="absolute right-3 top-3 size-5 opacity-30" aria-hidden />
            <div className="mb-1 text-[11px] font-bold uppercase tracking-wider opacity-70">원문(발췌)</div>
            <p className="whitespace-pre-line text-[15px]" style={{ wordBreak: 'keep-all' }}>
              {source.original}
            </p>
          </div>

          {/* 해석본 */}
          <div className="rounded-md bg-base-300/60 p-4">
            <div className="mb-1 text-[11px] font-bold uppercase tracking-wider text-secondary">
              쉬운 해석 {level === 'high' ? '(고등)' : '(중등)'}
            </div>
            <p className="text-[15px] leading-relaxed text-base-content/90" style={{ wordBreak: 'keep-all' }}>
              {source.interpretation[level]}
            </p>
          </div>

          {/* APA 출처 */}
          <figcaption className="border-t border-primary/20 pt-2">
            <div className="text-[11px] font-bold uppercase tracking-wider text-primary/80">출처 (APA)</div>
            <p className="mt-0.5 text-[13px] italic text-base-content/70" style={{ wordBreak: 'keep-all' }}>
              {source.citationApa}
            </p>
            {source.note && (
              <p className="mt-1 text-[11px] text-base-content/50" style={{ wordBreak: 'keep-all' }}>
                ※ {source.note}
              </p>
            )}
          </figcaption>
        </div>
      )}
    </figure>
  );
}
