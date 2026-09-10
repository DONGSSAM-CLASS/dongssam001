import { useState } from 'react';
import { CalendarClock, ChevronDown, MapPin, ScrollText, Star, Target, Trophy } from 'lucide-react';
import type { Chapter, Level } from '../types';
import { totalPoints } from '../story';
import { BadgeIcon } from './badgeIcons';

/**
 * 오른쪽 상단 미션 상태창(요구사항 4).
 * 지금 수행 중인 미션의 시기·장소·목표와, 전체 진행률·점수·획득 배지를 한눈에 보여 준다.
 */
export function MissionStatusPanel({
  chapters,
  currentIndex,
  completedIds,
  score,
  badges,
  level,
}: {
  chapters: Chapter[];
  currentIndex: number;
  completedIds: string[];
  score: number;
  badges: string[];
  level: Level;
}) {
  const [open, setOpen] = useState(true);
  const chapter = chapters[currentIndex];
  const done = completedIds.length;
  const pct = Math.round((done / chapters.length) * 100);

  return (
    <aside
      className="pointer-events-auto w-[min(88vw,340px)] rounded-box border border-primary/40 bg-base-200/95 shadow-2xl backdrop-blur-sm"
      aria-label="미션 상태창"
    >
      <div className="flex items-center gap-2 border-b border-primary/25 px-3 py-2">
        <Target className="size-4 text-primary" aria-hidden />
        <span className="text-sm font-bold tracking-wide text-primary">미션 상태창</span>
        <span className="badge badge-xs ml-auto badge-neutral">{level === 'high' ? '고등' : '중등'}</span>
        <button
          type="button"
          className="btn btn-ghost btn-xs px-1 sm:hidden"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-label="상태창 접기/펼치기"
        >
          <ChevronDown className={`size-4 transition-transform ${open ? 'rotate-180' : ''}`} aria-hidden />
        </button>
      </div>

      <div className={`${open ? 'block' : 'hidden'} sm:block`}>
        {chapter && (
          <div className="space-y-2 px-3 py-3">
            <div className="text-[11px] font-semibold uppercase tracking-wider text-base-content/50">
              진행 미션 {chapter.order} / {chapters.length}
            </div>
            <div className="font-bold leading-snug text-base-content">{chapter.title.replace(/^제\d+장 · /, '')}</div>
            <div className="flex items-center gap-1.5 text-xs text-base-content/70">
              <CalendarClock className="size-3.5 text-secondary" aria-hidden /> {chapter.dateLabel}
            </div>
            <div className="flex items-start gap-1.5 text-xs text-base-content/70">
              <MapPin className="mt-0.5 size-3.5 shrink-0 text-secondary" aria-hidden />
              <span style={{ wordBreak: 'keep-all' }}>{chapter.place}</span>
            </div>
            <div className="rounded-md border border-secondary/30 bg-base-300/50 p-2">
              <div className="mb-0.5 flex items-center gap-1 text-[11px] font-bold text-secondary">
                <ScrollText className="size-3.5" aria-hidden /> 목표
              </div>
              <p className="text-xs leading-relaxed text-base-content/85" style={{ wordBreak: 'keep-all' }}>
                {chapter.missionObjective[level]}
              </p>
            </div>
          </div>
        )}

        {/* 진행률 */}
        <div className="px-3 pb-3">
          <div className="mb-1 flex items-center justify-between text-[11px] text-base-content/60">
            <span>전체 진행</span>
            <span>{done} / {chapters.length} 완료</span>
          </div>
          <progress className="progress progress-primary h-2 w-full" value={pct} max={100} />

          <div className="mt-3 grid grid-cols-2 gap-2">
            <div className="flex items-center gap-1.5 rounded-md bg-base-300/50 px-2 py-1.5">
              <Trophy className="size-4 text-warning" aria-hidden />
              <div className="leading-tight">
                <div className="text-[10px] text-base-content/50">점수</div>
                <div className="text-sm font-bold text-base-content">{score}<span className="text-[10px] font-normal text-base-content/50"> / {totalPoints}</span></div>
              </div>
            </div>
            <div className="flex items-center gap-1.5 rounded-md bg-base-300/50 px-2 py-1.5">
              <Star className="size-4 text-primary" aria-hidden />
              <div className="leading-tight">
                <div className="text-[10px] text-base-content/50">배지</div>
                <div className="text-sm font-bold text-base-content">{badges.length}<span className="text-[10px] font-normal text-base-content/50"> / {chapters.length}</span></div>
              </div>
            </div>
          </div>

          {/* 배지 진열 */}
          <div className="mt-2 flex flex-wrap gap-1.5">
            {chapters.map((c) => {
              const earned = badges.includes(c.badge.label);
              return (
                <span
                  key={c.id}
                  className={`tooltip inline-flex size-7 items-center justify-center rounded-full border ${
                    earned ? 'border-primary bg-primary/20 text-primary' : 'border-base-content/15 text-base-content/25'
                  }`}
                  data-tip={earned ? c.badge.label : '미획득'}
                >
                  <BadgeIcon name={c.badge.icon} className="size-3.5" />
                </span>
              );
            })}
          </div>
        </div>
      </div>
    </aside>
  );
}
