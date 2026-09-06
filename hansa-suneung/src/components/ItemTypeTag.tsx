import type { ItemType } from '../types/schema';

const COLORS: Record<ItemType, string> = {
  사료제시형: 'bg-amber-100 text-amber-800',
  '지도·시각자료형': 'bg-emerald-100 text-emerald-800',
  인물형: 'bg-violet-100 text-violet-800',
  '연표·순서형': 'bg-sky-100 text-sky-800',
  개념이해형: 'bg-rose-100 text-rose-800',
  기타: 'bg-slate-100 text-slate-700',
};

export default function ItemTypeTag({ type }: { type: ItemType | null }) {
  if (!type) return null;
  return (
    <span className={`rounded px-1.5 py-0.5 text-xs font-medium ${COLORS[type]}`}>
      {type}
    </span>
  );
}
