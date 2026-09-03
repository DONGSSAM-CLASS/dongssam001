/**
 * 설정 연대·과목 필터에 따라 지구본에 표시할 데이터를 메모리에서 필터링한다 (Firestore 읽기 없음).
 */
import { useMemo } from 'react';
import { dataset } from '@/data';
import { figureActiveIn, polityActiveIn } from '@/lib/history';
import { useGlobeStore } from '@/store/globeStore';
import type { Figure, Polity, Subject } from '@/types/history';

function matchesSubject(tags: Subject[] | undefined, filter: Subject | 'all', textbookOnly: boolean) {
  if (!textbookOnly) return true;
  if (!tags || tags.length === 0) return false;
  if (filter === 'all') return true;
  return tags.includes(filter);
}

export function useVisiblePolities(): Polity[] {
  const year = useGlobeStore((s) => s.year);
  const filter = useGlobeStore((s) => s.textbookFilter);
  const textbookOnly = useGlobeStore((s) => s.textbookOnly);
  return useMemo(
    () => dataset.polities.filter((p) => polityActiveIn(p, year) && matchesSubject(p.textbook_appearance, filter, textbookOnly)),
    [year, filter, textbookOnly],
  );
}

export function useVisibleFigures(): Figure[] {
  const year = useGlobeStore((s) => s.year);
  const filter = useGlobeStore((s) => s.textbookFilter);
  const textbookOnly = useGlobeStore((s) => s.textbookOnly);
  return useMemo(
    () => dataset.figures.filter((f) => figureActiveIn(f, year) && matchesSubject(f.textbook_appearance, filter, textbookOnly)),
    [year, filter, textbookOnly],
  );
}
