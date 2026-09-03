import { useMemo, useState } from 'react';
import { dataset } from '@/data';
import { formatYear } from '@/lib/history';
import { useGlobeStore, type SelectionKind } from '@/store/globeStore';

interface Hit {
  kind: SelectionKind;
  id: string;
  label: string;
  sub: string;
  year: number;
  lat: number;
  lon: number;
}

const KIND_LABEL: Record<SelectionKind, string> = { polity: '국가', figure: '인물', place: '장소', event: '사건' };

function norm(s: string) {
  return s.toLowerCase().replace(/\s+/g, '');
}

/** 국가·인물·사건·장소 검색 → 해당 연대와 위치로 지구본 이동 */
export function SearchBox() {
  const [q, setQ] = useState('');
  const [open, setOpen] = useState(false);
  const setYear = useGlobeStore((s) => s.setYear);
  const flyTo = useGlobeStore((s) => s.flyTo);
  const select = useGlobeStore((s) => s.select);
  const year = useGlobeStore((s) => s.year);

  const index = useMemo<Hit[]>(() => {
    const hits: Hit[] = [];
    for (const p of dataset.polities) hits.push({ kind: 'polity', id: p.id, label: p.name_ko, sub: `${p.name_en} · ${formatYear(p.start_year)}~${formatYear(p.end_year)}`, year: Math.round((p.start_year + Math.min(p.end_year, 2000)) / 2), lat: p.centroid[0], lon: p.centroid[1] });
    for (const f of dataset.figures) hits.push({ kind: 'figure', id: f.id, label: f.name_ko, sub: `${f.name_en} · ${formatYear(f.birth_year)}~${formatYear(f.death_year)}`, year: f.activity_years[0], lat: f.activity_location[0], lon: f.activity_location[1] });
    for (const e of dataset.events) hits.push({ kind: 'event', id: e.id, label: e.name_ko, sub: `${e.name_en ?? ''} · ${formatYear(e.year)}`, year: e.year, lat: e.coords[0], lon: e.coords[1] });
    for (const pl of dataset.places) hits.push({ kind: 'place', id: pl.id, label: pl.name_ko, sub: `${pl.name_en ?? ''} · ${pl.era_names.map((x) => x.name_ko).join('/')}`, year: Number.NaN, lat: pl.coords[0], lon: pl.coords[1] });
    return hits;
  }, []);

  const results = useMemo(() => {
    const n = norm(q);
    if (n.length < 1) return [];
    return index
      .filter((h) => norm(h.label).includes(n) || norm(h.sub).includes(n))
      .sort((a, b) => (norm(a.label).startsWith(n) ? 0 : 1) - (norm(b.label).startsWith(n) ? 0 : 1))
      .slice(0, 12);
  }, [q, index]);

  const go = (h: Hit) => {
    if (h.kind === 'polity') {
      // 현재 연대가 존속 기간 안이면 유지, 아니면 중간 연대로 이동
      const p = dataset.polities.find((x) => x.id === h.id)!;
      if (year < p.start_year || year > p.end_year) setYear(h.year);
    } else if (!Number.isNaN(h.year)) setYear(h.year);
    flyTo(h.lat, h.lon, 2.2);
    select({ kind: h.kind, id: h.id });
    setOpen(false);
    setQ('');
  };

  return (
    <div className="relative pointer-events-auto w-64">
      <label className="sr-only" htmlFor="globe-search">국가·인물·사건·장소 검색</label>
      <input
        id="globe-search"
        role="combobox"
        aria-expanded={open && results.length > 0}
        aria-controls="globe-search-list"
        aria-autocomplete="list"
        className="w-full rounded-xl bg-slate-900/85 backdrop-blur border border-slate-600 px-3 py-2 text-sm placeholder:text-slate-500"
        placeholder="🔍 검색 (예: 고려, 살라딘, 1453)"
        value={q}
        onChange={(e) => { setQ(e.target.value); setOpen(true); }}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        onKeyDown={(e) => { if (e.key === 'Enter' && results[0]) go(results[0]); if (e.key === 'Escape') setOpen(false); }}
      />
      {open && results.length > 0 && (
        <ul id="globe-search-list" role="listbox" className="absolute z-50 mt-1 w-full max-h-72 overflow-y-auto rounded-xl bg-slate-900/95 border border-slate-600 shadow-xl text-sm">
          {results.map((h) => (
            <li key={`${h.kind}-${h.id}`} role="option" aria-selected={false}>
              <button type="button" className="w-full text-left px-3 py-1.5 hover:bg-slate-700 flex items-center gap-2" onMouseDown={(e) => e.preventDefault()} onClick={() => go(h)}>
                <span className="text-[10px] rounded bg-slate-700 px-1 shrink-0">{KIND_LABEL[h.kind]}</span>
                <span className="truncate"><span className="font-semibold">{h.label}</span> <span className="text-slate-400 text-xs">{h.sub}</span></span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
