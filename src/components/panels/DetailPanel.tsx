import { eventById, standardByCode } from '@/data';
import { useMergedDataset } from '@/lib/mergedData';
import { angularDistance } from '@/lib/geo';
import { formatYear, polityActiveIn, REGION_COLORS, REGION_LABELS } from '@/lib/history';
import { useGlobeStore } from '@/store/globeStore';
import type { Figure, Subject } from '@/types/history';

const SUBJECT_STYLE: Record<Subject, string> = {
  '역사①': 'bg-emerald-700/60 text-emerald-100',
  '역사②': 'bg-teal-700/60 text-teal-100',
  세계사: 'bg-indigo-700/60 text-indigo-100',
  '동아시아 역사 기행': 'bg-rose-700/60 text-rose-100',
};

function SubjectTags({ tags }: { tags: Subject[] }) {
  return (
    <ul className="flex flex-wrap gap-1" aria-label="교과서 등장 과목">
      {tags.map((t) => (
        <li key={t} className={`rounded px-1.5 py-0.5 text-[11px] ${SUBJECT_STYLE[t]}`}>{t}</li>
      ))}
    </ul>
  );
}

function Standards({ codes }: { codes: string[] }) {
  if (!codes.length) return null;
  return (
    <div>
      <h4 className="text-xs font-semibold text-slate-400 mt-3">관련 성취기준</h4>
      <ul className="mt-1 space-y-1">
        {codes.map((c) => {
          const s = standardByCode.get(c);
          return (
            <li key={c} className="text-xs leading-snug">
              <span className="font-mono text-amber-300">{c}</span> {s ? s.text : ''}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function Approx({ note }: { note: string }) {
  return (
    <p className="mt-2 rounded-lg bg-amber-900/40 border border-amber-700/50 px-2 py-1 text-[11px] text-amber-100">
      ⚠ 개략적 범위·추정치 {note && `— ${note}`}
    </p>
  );
}

/** 클릭한 왕조/인물/장소/사건의 상세 사이드 패널 */
export function DetailPanel() {
  const { polities, figures, polityById, figureById, placeById, changedIds } = useMergedDataset();
  const selection = useGlobeStore((s) => s.selection);
  const select = useGlobeStore((s) => s.select);
  const year = useGlobeStore((s) => s.year);
  const showEnglish = useGlobeStore((s) => s.showEnglish);
  const flyTo = useGlobeStore((s) => s.flyTo);
  const setYear = useGlobeStore((s) => s.setYear);
  if (!selection) return null;

  let body: React.ReactNode = null;
  let title = '';

  if (selection.kind === 'polity') {
    const p = polityById.get(selection.id);
    if (!p) return null;
    title = showEnglish ? `${p.name_ko} (${p.name_en})` : p.name_ko;
    const neighbors = polities
      .filter((q) => q.id !== p.id && polityActiveIn(q, year) && angularDistance(p.centroid, q.centroid) * 6371 < 2500)
      .sort((a, b) => angularDistance(p.centroid, a.centroid) - angularDistance(p.centroid, b.centroid))
      .slice(0, 8);
    body = (
      <>
        <div className="flex items-center gap-2 text-xs">
          <span className="inline-block h-3 w-3 rounded-sm" style={{ background: REGION_COLORS[p.region] }} aria-hidden="true" />
          <span>{REGION_LABELS[p.region]}</span>
        </div>
        <dl className="mt-2 grid grid-cols-[5rem_1fr] gap-y-1 text-sm">
          <dt className="text-slate-400">존속 기간</dt>
          <dd>{formatYear(p.start_year)} ~ {formatYear(p.end_year)}</dd>
          <dt className="text-slate-400">수도</dt>
          <dd>{p.capital}</dd>
        </dl>
        <p className="mt-2 text-sm leading-relaxed">{p.summary_ko}</p>
        {p.is_approximate && <Approx note={p.note} />}
        <div className="mt-3"><SubjectTags tags={p.textbook_appearance} /></div>
        <Standards codes={p.achievement_standards} />
        {neighbors.length > 0 && (
          <div>
            <h4 className="text-xs font-semibold text-slate-400 mt-3">같은 시기 인접 국가</h4>
            <ul className="mt-1 flex flex-wrap gap-1">
              {neighbors.map((n) => (
                <li key={n.id}>
                  <button type="button" className="rounded bg-slate-700 px-2 py-0.5 text-xs hover:bg-slate-600" onClick={() => { select({ kind: 'polity', id: n.id }); flyTo(n.centroid[0], n.centroid[1]); }}>
                    {n.name_ko}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
        <FiguresOf polityId={p.id} figures={figures} />
      </>
    );
  } else if (selection.kind === 'figure') {
    const f = figureById.get(selection.id);
    if (!f) return null;
    title = showEnglish ? `${f.name_ko} (${f.name_en})` : f.name_ko;
    const polity = f.polity_id ? polityById.get(f.polity_id) : null;
    body = (
      <>
        <dl className="mt-1 grid grid-cols-[5rem_1fr] gap-y-1 text-sm">
          <dt className="text-slate-400">생몰년</dt>
          <dd>{formatYear(f.birth_year)} ~ {formatYear(f.death_year)}{f.is_approximate && ' (추정)'}</dd>
          <dt className="text-slate-400">소속</dt>
          <dd>
            {polity ? (
              <button type="button" className="underline" onClick={() => select({ kind: 'polity', id: polity.id })}>{polity.name_ko}</button>
            ) : '—'}
          </dd>
          <dt className="text-slate-400">활동 연대</dt>
          <dd>{formatYear(f.activity_years[0])} ~ {formatYear(f.activity_years[1])}</dd>
        </dl>
        <p className="mt-2 text-sm leading-relaxed">{f.one_liner_ko}</p>
        {f.is_approximate && <Approx note={f.note} />}
        <div className="mt-3"><SubjectTags tags={f.textbook_appearance} /></div>
        <Standards codes={f.achievement_standards} />
      </>
    );
  } else if (selection.kind === 'place') {
    const pl = placeById.get(selection.id);
    if (!pl) return null;
    title = showEnglish && pl.name_en ? `${pl.name_ko} (${pl.name_en})` : pl.name_ko;
    body = (
      <>
        <p className="text-xs text-slate-400">{pl.type} · {pl.coords[0].toFixed(2)}, {pl.coords[1].toFixed(2)}</p>
        <h4 className="text-xs font-semibold text-slate-400 mt-3">시대별 이름</h4>
        <ul className="mt-1 space-y-0.5 text-sm">
          {pl.era_names.map((e) => (
            <li key={`${e.from}-${e.name_ko}`} className={e.from <= year && year < e.to ? 'font-bold text-amber-200' : ''}>
              {formatYear(e.from)} ~ {e.to >= 9999 ? '현재' : formatYear(e.to)}: {e.name_ko}
            </li>
          ))}
        </ul>
        {pl.note && <p className="mt-2 text-xs text-slate-300">{pl.note}</p>}
        {pl.textbook_appearance && <div className="mt-3"><SubjectTags tags={pl.textbook_appearance} /></div>}
      </>
    );
  } else {
    const ev = eventById.get(selection.id);
    if (!ev) return null;
    title = ev.name_ko;
    body = (
      <>
        <p className="text-sm">{formatYear(ev.year)}</p>
        {ev.note && <p className="mt-2 text-xs text-slate-300">{ev.note}</p>}
        <div className="mt-3"><SubjectTags tags={ev.textbook_appearance} /></div>
        <button type="button" className="mt-3 rounded bg-slate-700 px-2 py-1 text-xs hover:bg-slate-600" onClick={() => { setYear(ev.year); flyTo(ev.coords[0], ev.coords[1], 2.2); }}>
          이 연대·위치로 이동
        </button>
      </>
    );
  }

  return (
    <aside aria-label="상세 정보" className="pointer-events-auto w-full max-w-sm rounded-2xl bg-slate-900/90 backdrop-blur border border-slate-700 p-4 shadow-xl max-h-[70vh] overflow-y-auto">
      <div className="flex items-start justify-between gap-2">
        <h3 className="text-lg font-bold leading-tight">
          {title}
          {changedIds.has(selection.id) && <span className="ml-1 rounded bg-sky-800 px-1 py-0.5 text-[10px] align-middle">선생님 수정본</span>}
        </h3>
        <button type="button" className="btn-icon" aria-label="닫기" onClick={() => select(null)}>✕</button>
      </div>
      <div className="mt-1">{body}</div>
    </aside>
  );
}

function FiguresOf({ polityId, figures }: { polityId: string; figures: Figure[] }) {
  const select = useGlobeStore((s) => s.select);
  const setYear = useGlobeStore((s) => s.setYear);
  const figs = figures.filter((f) => f.polity_id === polityId);
  if (!figs.length) return null;
  return (
    <div>
      <h4 className="text-xs font-semibold text-slate-400 mt-3">교과서 속 인물</h4>
      <ul className="mt-1 flex flex-wrap gap-1">
        {figs.map((f) => (
          <li key={f.id}>
            <button type="button" className="rounded bg-amber-900/50 px-2 py-0.5 text-xs hover:bg-amber-800/60" onClick={() => { setYear(f.activity_years[0]); select({ kind: 'figure', id: f.id }); }}>
              {f.name_ko}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
