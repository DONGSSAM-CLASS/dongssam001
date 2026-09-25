import { Award, Lock } from 'lucide-react';
import type { Principle } from '../types/content';
import { PrincipleIcon } from './icons';
import { Stamp } from './ui';

/** AI 윤리 원칙 카드 */
export function PrincipleCardView({
  principle,
  owned = true,
  animate = false,
  compact = false,
}: {
  principle: Principle;
  owned?: boolean;
  animate?: boolean;
  compact?: boolean;
}) {
  if (!owned) {
    return (
      <div
        className="flex min-h-40 flex-col items-center justify-center gap-1 rounded-box border-2 border-dashed border-base-300 bg-base-200/60 p-4 text-center text-ink-soft"
        aria-label={`${principle.name} 카드 — 아직 받지 못했어요`}
      >
        <span className="grid h-12 w-12 place-items-center rounded-full bg-base-100">
          <Lock className="h-6 w-6" aria-hidden="true" />
        </span>
        <span className="mt-1 font-bold">{principle.name}</span>
        <span className="text-[15px]">아직 받지 못했어요</span>
      </div>
    );
  }
  return (
    <article
      className={`relative flex h-full flex-col overflow-hidden rounded-box border-2 bg-white shadow-sm ${animate ? 'animate-pop' : ''}`}
      style={{ borderColor: principle.color }}
      aria-label={`원칙 카드: ${principle.name}`}
    >
      <header className="flex items-center gap-3 px-4 py-3 text-white" style={{ backgroundColor: principle.color }}>
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-white/95" style={{ color: principle.color }}>
          <PrincipleIcon id={principle.id} className="h-5 w-5" strokeWidth={2.4} />
        </span>
        <h3 className="typewriter text-[19px] font-bold">{principle.name}</h3>
      </header>
      <div className="flex flex-1 flex-col gap-2 p-4">
        <p className="text-[17px] font-medium">{principle.description}</p>
        {!compact && (
          <p className="rounded-box bg-base-200 px-3 py-2 text-[15px] text-ink-soft">
            <span className="font-bold text-ink">냉전에서 배운 점 · </span>
            {principle.coldWarLink}
          </p>
        )}
      </div>
      {animate && (
        <div className="pointer-events-none absolute right-3 bottom-3" aria-hidden="true">
          <Stamp tone="declass" animate>
            <Award className="h-4 w-4" />
            획득
          </Stamp>
        </div>
      )}
    </article>
  );
}
