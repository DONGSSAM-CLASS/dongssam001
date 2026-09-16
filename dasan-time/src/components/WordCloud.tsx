import { Heart } from 'lucide-react';
import type { EmotionEntry } from '../lib/types';

/** 낱말이 나온 횟수를 세어 준다. 숨김 처리한 낱말은 뺀다. */
export function tallyWords(items: EmotionEntry[]): { word: string; count: number }[] {
  const map = new Map<string, number>();
  items
    .filter((i) => !i.hidden && i.word.trim())
    .forEach((i) => map.set(i.word, (map.get(i.word) ?? 0) + 1));
  return [...map.entries()]
    .map(([word, count]) => ({ word, count }))
    .sort((a, b) => b.count - a.count || a.word.localeCompare(b.word));
}

/**
 * 학급 감정 지도.
 * 많이 나온 낱말일수록 크게 보인다. 누가 골랐는지는 저장하지도, 보여 주지도 않는다.
 */
export default function WordCloud({
  items,
  big = false,
}: {
  items: EmotionEntry[];
  big?: boolean;
}) {
  const tally = tallyWords(items);
  if (tally.length === 0) {
    return (
      <div className="rounded-2xl bg-base-200 p-8 text-center">
        <Heart className="mx-auto h-8 w-8 opacity-40" aria-hidden />
        <p className="mt-2 opacity-70">아직 올라온 낱말이 없어요. 먼저 골라 볼까요?</p>
      </div>
    );
  }
  const max = tally[0].count;
  const base = big ? 1.6 : 1;

  return (
    <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 rounded-2xl bg-base-200 p-5">
      {tally.map(({ word, count }) => {
        // 가장 많이 나온 낱말을 기준으로 글자 크기를 정한다. (최소 1rem)
        const size = base * (1 + (count / max) * 1.4);
        return (
          <span
            key={word}
            className="font-bold leading-tight text-primary"
            style={{ fontSize: `${size}rem`, opacity: 0.55 + (count / max) * 0.45 }}
            title={`${count}명이 골랐어요`}
          >
            {word}
            <span className="ml-1 align-super text-xs font-normal opacity-70">{count}</span>
          </span>
        );
      })}
    </div>
  );
}
