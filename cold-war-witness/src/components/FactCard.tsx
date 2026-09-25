import { ExternalLink, FileSearch, LockOpen } from 'lucide-react';
import type { FactCard as Fact } from '../types/content';
import { Stamp } from './ui';

const KIND_LABEL = {
  context: '맥락 균형 카드',
  transparency: '투명성 카드',
  safety: '안전성 카드',
} as const;

/** “실제 역사에서는?” 사실 카드 */
export function FactCardView({ fact, animate = false }: { fact: Fact; animate?: boolean }) {
  return (
    <article
      className={`dossier relative overflow-hidden border-l-8 border-l-ch-600 px-4 pt-4 pb-3 sm:px-5 ${animate ? 'animate-unfold' : ''}`}
      aria-label={`사실 카드: ${fact.title}`}
    >
      <div className="absolute top-3 right-3" aria-hidden="true">
        <Stamp tone="declass" animate={animate} className="text-[13px]">
          <LockOpen className="h-3.5 w-3.5" />
          해제
        </Stamp>
      </div>
      <p className="flex items-center gap-1.5 pr-20 text-[15px] font-medium text-ch-600">
        <FileSearch className="h-4 w-4" aria-hidden="true" />
        실제 역사 기록{fact.dateLabel ? ` · ${fact.dateLabel}` : ''}
      </p>
      {fact.kind && <p className="badge mt-2 h-auto border-0 bg-ch-100 py-1 text-[14px] font-bold text-ch-900">{KIND_LABEL[fact.kind]}</p>}
      <h4 className="typewriter mt-1 pr-16 text-[19px] font-bold text-ink">{fact.title}</h4>
      <p className="mt-2 text-[17px] leading-relaxed">{fact.body}</p>
      <p className="mt-3 border-t border-dashed border-base-300 pt-2 text-[14px] text-ink-soft">
        출처:{' '}
        {fact.source.url ? (
          <a href={fact.source.url} target="_blank" rel="noopener noreferrer" className="link inline-flex items-center gap-1">
            {fact.source.org}
            <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
            <span className="sr-only"> (새 창에서 열림)</span>
          </a>
        ) : (
          fact.source.org
        )}
      </p>
    </article>
  );
}
