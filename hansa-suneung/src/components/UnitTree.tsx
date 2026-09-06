import { useState } from 'react';
import type { Unit } from '../types/schema';
import { useData } from '../data/DataContext';
import { descendantIds } from '../lib/units';

interface Props {
  selectedId: string | null;
  onSelect: (unitId: string) => void;
  /** 학생 화면이면 검수 완료 문항만 카운트 */
  verifiedOnly?: boolean;
}

/** 좌측 대·중·소단원 아코디언 트리 (기능 1). 각 단원에 출제 문항 수를 배지로 표시. */
export default function UnitTree({ selectedId, onSelect, verifiedOnly = true }: Props) {
  const { curriculum } = useData();
  if (curriculum.units.length === 0) {
    return (
      <p className="p-3 text-sm text-slate-500">
        단원 트리가 아직 등록되지 않았습니다. (curriculum.json)
      </p>
    );
  }
  return (
    <ul className="text-sm">
      {curriculum.units.map((u) => (
        <TreeNode
          key={u.id}
          unit={u}
          depth={0}
          selectedId={selectedId}
          onSelect={onSelect}
          verifiedOnly={verifiedOnly}
        />
      ))}
    </ul>
  );
}

function TreeNode({
  unit,
  depth,
  selectedId,
  onSelect,
  verifiedOnly,
}: {
  unit: Unit;
  depth: number;
} & Props) {
  const { items } = useData();
  const [open, setOpen] = useState(depth === 0);
  const hasChildren = !!unit.children?.length;

  const targetIds = new Set(descendantIds(unit));
  const count = items.filter(
    (it) => (!verifiedOnly || it.verified) && it.unitIds.some((u) => targetIds.has(u)),
  ).length;

  const isSelected = selectedId === unit.id;

  return (
    <li>
      <div
        className={`flex items-center gap-1 rounded-md ${
          isSelected ? 'bg-blue-50 ring-1 ring-blue-300' : 'hover:bg-slate-50'
        }`}
        style={{ paddingLeft: depth * 14 }}
      >
        {hasChildren ? (
          <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            className="flex h-6 w-6 shrink-0 items-center justify-center text-slate-400"
            aria-label={open ? '접기' : '펼치기'}
          >
            {open ? '▾' : '▸'}
          </button>
        ) : (
          <span className="w-6 shrink-0" />
        )}
        <button
          type="button"
          onClick={() => onSelect(unit.id)}
          className="flex flex-1 items-center justify-between gap-2 py-1.5 pr-2 text-left"
        >
          <span
            className={`${
              unit.level === '대단원'
                ? 'font-semibold text-slate-800'
                : unit.level === '중단원'
                  ? 'font-medium text-slate-700'
                  : 'text-slate-600'
            }`}
          >
            {unit.title}
          </span>
          {count > 0 && (
            <span className="shrink-0 rounded-full bg-blue-100 px-1.5 text-xs font-medium text-blue-700">
              {count}
            </span>
          )}
        </button>
      </div>
      {hasChildren && open && (
        <ul>
          {unit.children!.map((c) => (
            <TreeNode
              key={c.id}
              unit={c}
              depth={depth + 1}
              selectedId={selectedId}
              onSelect={onSelect}
              verifiedOnly={verifiedOnly}
            />
          ))}
        </ul>
      )}
    </li>
  );
}
