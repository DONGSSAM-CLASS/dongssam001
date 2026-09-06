import { useSearchParams } from 'react-router-dom';
import { useData } from '../data/DataContext';
import { useSettings } from '../settings/SettingsContext';
import { unitPath } from '../lib/units';
import UnitTree from '../components/UnitTree';
import ItemCard from '../components/ItemCard';
import MiddleBridgePanel from '../components/MiddleBridgePanel';

/** 단원 트리 탐색 + 문항 카드 (기능 1, 3). 선택 단원은 URL(?unit=)로 공유 가능. */
export default function ExplorePage() {
  const { unitById, itemsForUnit } = useData();
  const { middleMode } = useSettings();
  const [params, setParams] = useSearchParams();
  const selectedId = params.get('unit');

  const select = (unitId: string) => {
    const next = new URLSearchParams(params);
    next.set('unit', unitId);
    setParams(next, { replace: true });
  };

  const selected = selectedId ? unitById.get(selectedId) : null;
  const items = selectedId ? itemsForUnit(selectedId, { verifiedOnly: true }) : [];

  return (
    <div className="grid gap-4 md:grid-cols-[300px_1fr]">
      <aside className="rounded-lg border bg-white p-2">
        <h2 className="px-2 py-1 text-xs font-semibold uppercase tracking-wide text-slate-400">
          단원 트리
        </h2>
        <UnitTree selectedId={selectedId} onSelect={select} verifiedOnly />
      </aside>

      <section>
        {!selected ? (
          <div className="flex h-40 items-center justify-center rounded-lg border border-dashed bg-white text-slate-400">
            왼쪽에서 단원을 선택하세요.
          </div>
        ) : (
          <div>
            <div className="mb-3">
              <p className="text-xs text-slate-500">{unitPath(unitById, selected.unit.id)}</p>
              <h1 className="text-xl font-bold text-slate-900">{selected.unit.title}</h1>
              {selected.unit.keywords && selected.unit.keywords.length > 0 && (
                <div className="mt-1 flex flex-wrap gap-1">
                  {selected.unit.keywords.map((k) => (
                    <span key={k} className="rounded bg-slate-100 px-1.5 py-0.5 text-xs text-slate-600">
                      #{k}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {middleMode ? (
              <MiddleBridgePanel unitId={selected.unit.id} />
            ) : items.length === 0 ? (
              <div className="rounded-lg border border-dashed bg-white p-6 text-center text-sm text-slate-400">
                이 단원에서 출제된(검수 완료) 기출이 아직 없습니다.
              </div>
            ) : (
              <>
                <p className="mb-2 text-sm text-slate-500">기출 주제 {items.length}건</p>
                <div className="grid gap-2 sm:grid-cols-2">
                  {items.map((it) => (
                    <ItemCard key={it.itemId} item={it} />
                  ))}
                </div>
              </>
            )}
          </div>
        )}
      </section>
    </div>
  );
}
