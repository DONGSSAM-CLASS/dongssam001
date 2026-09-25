import type { FactCard as Fact } from '../types/content';
import { Stamp } from './ui';

const KIND_LABEL = {
  context: '맥락 균형 카드',
  transparency: '투명성 카드',
  safety: '안전성 카드',
} as const;

/** “실제 역사에서는?” 사실 카드 — 기밀 해제된 문서 모양 */
export function FactCardView({ fact, animate = false }: { fact: Fact; animate?: boolean }) {
  return (
    <article
      className={`dossier relative overflow-hidden border-l-8 border-l-ch-600 px-4 pt-4 pb-3 sm:px-5 ${animate ? 'animate-unfold' : ''}`}
      aria-label={`사실 카드: ${fact.title}`}
    >
      <div className="absolute top-3 right-3" aria-hidden="true">
        <Stamp tone="declass" animate={animate} className="text-[13px]">
          해제됨
        </Stamp>
      </div>
      <p className="typewriter pr-20 text-[15px] text-ink-soft">
        실제 역사 기록{fact.dateLabel ? ` · ${fact.dateLabel}` : ''}
      </p>
      {fact.kind && (
        <p className="mt-1 inline-block rounded bg-ch-100 px-2 text-[15px] font-bold text-ch-900">{KIND_LABEL[fact.kind]}</p>
      )}
      <h4 className="typewriter mt-1 pr-16 text-[19px] font-bold text-ink">{fact.title}</h4>
      <p className="typewriter mt-2 text-[17px] leading-relaxed">{fact.body}</p>
      <p className="mt-3 border-t border-dashed border-line pt-2 text-[14px] text-ink-soft">
        출처:{' '}
        {fact.source.url ? (
          <a href={fact.source.url} target="_blank" rel="noopener noreferrer" className="underline">
            {fact.source.org}
            <span className="sr-only"> (새 창에서 열림)</span>
          </a>
        ) : (
          fact.source.org
        )}
      </p>
    </article>
  );
}
