import type { Scene } from '../types/content';
import type { ChoiceId } from '../types/db';
import { percent, totalOf, type ChoiceStats } from '../lib/stats';

/** 장면별 선택 분포 막대그래프 (이름 없이 숫자만) */
export function DistributionChart({
  scenes,
  stats,
  mine,
  big = false,
}: {
  scenes: Scene[];
  stats: ChoiceStats;
  /** 학생 화면: 내 선택 표시 */
  mine?: Record<string, ChoiceId>;
  /** 교사 화면 공유용 큰 글씨 */
  big?: boolean;
}) {
  return (
    <div className="flex flex-col gap-6">
      {scenes.map((scene) => {
        const row = stats[scene.id];
        const total = totalOf(row);
        return (
          <section key={scene.id} aria-label={`장면 ${scene.no} 선택 분포`}>
            <h4 className={`font-bold ${big ? 'text-[22px]' : 'text-[17px]'}`}>
              장면 {scene.no}. {scene.title}
              <span className="ml-2 text-[15px] font-normal text-ink-soft">({total}명 응답)</span>
            </h4>
            <p className={`text-ink-soft ${big ? 'text-[18px]' : 'text-[15px]'}`}>{scene.question}</p>
            <ul className="mt-2 flex flex-col gap-2">
              {scene.choices.map((c) => {
                const n = row?.[c.id] ?? 0;
                const p = percent(n, total);
                const isMine = mine?.[scene.id] === c.id;
                return (
                  <li key={c.id}>
                    <div className={`flex flex-wrap items-baseline justify-between gap-x-3 ${big ? 'text-[20px]' : 'text-[16px]'}`}>
                      <span>
                        {c.label}
                        {isMine && (
                          <span className="ml-2 rounded bg-ch-900 px-1.5 text-[14px] font-bold text-white">내 선택</span>
                        )}
                      </span>
                      <span className="typewriter font-bold">
                        {n}명 · {p}%
                      </span>
                    </div>
                    <div className={`mt-1 w-full overflow-hidden rounded bg-paper-dark ${big ? 'h-6' : 'h-4'}`} aria-hidden="true">
                      <div className="h-full rounded bg-ch-600 transition-[width] duration-500" style={{ width: `${p}%` }} />
                    </div>
                  </li>
                );
              })}
            </ul>
          </section>
        );
      })}
    </div>
  );
}
