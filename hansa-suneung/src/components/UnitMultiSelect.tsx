import { useMemo, useState } from 'react';
import { useData } from '../data/DataContext';
import { unitPath } from '../lib/units';

/** 단원 다중 선택(체크박스 + 검색). 검수 화면에서 문항의 unitIds 를 지정할 때 사용. */
export default function UnitMultiSelect({
  value,
  onChange,
}: {
  value: string[];
  onChange: (ids: string[]) => void;
}) {
  const { curriculum, unitById } = useData();
  const [q, setQ] = useState('');

  const options = useMemo(() => {
    const list = Array.from(unitById.values()).map((f) => ({
      id: f.unit.id,
      level: f.unit.level,
      label: unitPath(unitById, f.unit.id),
    }));
    const kw = q.trim();
    return kw ? list.filter((o) => o.label.includes(kw) || o.id.includes(kw)) : list;
  }, [unitById, q, curriculum]);

  const toggle = (id: string) => {
    onChange(value.includes(id) ? value.filter((v) => v !== id) : [...value, id]);
  };

  return (
    <div className="rounded-md border">
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="단원 검색…"
        className="w-full border-b px-2 py-1.5 text-sm outline-none"
      />
      <div className="max-h-52 overflow-y-auto p-1 text-sm">
        {options.map((o) => (
          <label
            key={o.id}
            className="flex cursor-pointer items-start gap-2 rounded px-1.5 py-1 hover:bg-slate-50"
          >
            <input
              type="checkbox"
              checked={value.includes(o.id)}
              onChange={() => toggle(o.id)}
              className="mt-0.5 h-4 w-4 shrink-0 accent-blue-600"
            />
            <span className={o.level === '대단원' ? 'font-semibold' : 'text-slate-700'}>
              {o.label}
            </span>
          </label>
        ))}
        {options.length === 0 && (
          <p className="px-2 py-2 text-xs text-slate-400">일치하는 단원이 없습니다.</p>
        )}
      </div>
    </div>
  );
}
