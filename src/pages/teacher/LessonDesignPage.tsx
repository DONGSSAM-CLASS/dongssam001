import { useEffect, useMemo, useState } from 'react';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { db } from '@/lib/firebase';
import { dataset, figureById, polityById, standardByCode, YEAR_MAX, YEAR_MIN } from '@/data';
import { formatYear, parseYearInput, REGION_LABELS } from '@/lib/history';
import { midYear, recommendFromStandards, SUBJECT_GROUPS, SUBJECT_SUBLABEL, unitsOf } from '@/lib/standards';
import { createSession, DEFAULT_SESSION_LAYERS } from '@/lib/sessionService';
import { useAuthStore } from '@/store/authStore';
import type { ClassDoc, LayerKey } from '@/types/firestore';

type ClassRow = ClassDoc & { id: string };
const LAYER_LABELS: Record<LayerKey, string> = {
  polities: '왕조·국가 영역',
  figures: '인물 마커',
  places: '주요 도시·유적',
  routes: '교역로',
  modernBorders: '현대 국경선',
};

/**
 * 수업 설계: 학교급 → 과목 → 단원 → 성취기준 선택 → 연대·왕조·인물 자동 추천 → 세션 저장/배포
 */
export default function LessonDesignPage() {
  const profile = useAuthStore((s) => s.profile);
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [classes, setClasses] = useState<ClassRow[]>([]);
  const [classId, setClassId] = useState(params.get('classId') ?? '');
  const [groupIdx, setGroupIdx] = useState(0);
  const [openUnit, setOpenUnit] = useState<string | null>(null);
  const [selected, setSelected] = useState<string[]>([]);
  const [title, setTitle] = useState('');
  // 교사가 제목을 직접 고치기 전까지는 성취기준 선택에 따라 제안 제목을 계속 갱신한다
  const [titleTouched, setTitleTouched] = useState(false);
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [focus, setFocus] = useState('');
  const [layers, setLayers] = useState<Record<LayerKey, boolean>>({ ...DEFAULT_SESSION_LAYERS });
  const [polities, setPolities] = useState<string[]>([]);
  const [figures, setFigures] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const uid = profile?.uid;
  useEffect(() => {
    if (!uid) return;
    getDocs(query(collection(db, 'classes'), where('teacherId', '==', uid)))
      .then((snap) => {
        const rows = snap.docs.map((d) => ({ id: d.id, ...(d.data() as ClassDoc) })).filter((c) => !c.archived);
        setClasses(rows);
        setClassId((cur) => cur || rows[0]?.id || '');
      })
      .catch((e) => setError((e as Error).message));
  }, [uid]);

  // 교사의 학교급에 맞는 과목 그룹을 먼저 보여준다 (렌더 중 파생 상태 갱신 패턴)
  const [syncedUid, setSyncedUid] = useState<string | null>(null);
  if (profile?.role === 'teacher' && syncedUid !== profile.uid) {
    setSyncedUid(profile.uid);
    const idx = SUBJECT_GROUPS.findIndex((g) => g.level === profile.schoolLevel);
    if (idx >= 0) setGroupIdx(idx);
  }

  const group = SUBJECT_GROUPS[groupIdx];
  const units = useMemo(() => unitsOf(group.subjects), [group]);
  const rec = useMemo(() => recommendFromStandards(selected), [selected]);

  /** 성취기준을 고르면 연대·왕조·인물을 자동으로 채운다(교사가 이어서 손댈 수 있음) */
  const toggle = (code: string) => {
    const next = selected.includes(code) ? selected.filter((c) => c !== code) : [...selected, code];
    setSelected(next);
    const r = recommendFromStandards(next);
    if (r.yearRange) {
      setFrom(String(r.yearRange[0]));
      setTo(String(r.yearRange[1]));
      setFocus(String(midYear(r.yearRange)));
    }
    setPolities(r.polityIds);
    setFigures(r.figureIds);
    if (!titleTouched) {
      const s = next.length ? standardByCode.get(next[0]) : null;
      setTitle(s ? `${s.unit.replace(/^\(\d+\)\s*/, '')} — ${r.yearRange ? `${formatYear(r.yearRange[0])}~${formatYear(r.yearRange[1])}` : '탐색'}` : '');
    }
  };
  const yearFrom = parseYearInput(from);
  const yearTo = parseYearInput(to);
  const focusYear = parseYearInput(focus);
  const valid = classId && title.trim() && yearFrom !== null && yearTo !== null && focusYear !== null && yearFrom <= yearTo && focusYear >= yearFrom && focusYear <= yearTo;

  const save = async (publish: boolean) => {
    if (!uid || !valid) return;
    setBusy(true);
    setError(null);
    try {
      const id = await createSession(uid, {
        classId,
        title,
        yearRange: [Math.max(YEAR_MIN, yearFrom!), Math.min(YEAR_MAX, yearTo!)],
        focusYear: focusYear!,
        layers,
        highlightPolities: polities,
        highlightFigures: figures,
        achievementStandards: selected,
        worksheet: [],
        status: publish ? 'open' : 'draft',
      });
      navigate(`/teacher/globe/${id}`);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  if (!profile || profile.role !== 'teacher') return null;

  return (
    <main className="min-h-full p-6 max-w-6xl mx-auto">
      <header className="flex items-center gap-3 flex-wrap">
        <Link to="/teacher" className="btn-icon">←</Link>
        <h1 className="text-2xl font-bold">✏️ 수업 설계</h1>
        <span className="text-sm text-slate-400">성취기준을 고르면 연대·왕조·인물이 자동으로 채워집니다.</span>
      </header>
      {error && <p role="alert" className="mt-3 text-sm text-red-300">{error}</p>}

      <div className="mt-5 grid gap-5 lg:grid-cols-2">
        <section aria-labelledby="std" className="rounded-2xl bg-slate-800/60 border border-slate-700 p-4">
          <h2 id="std" className="text-lg font-semibold">1. 성취기준 선택</h2>
          <div role="tablist" className="mt-2 flex flex-wrap gap-1 text-xs">
            {SUBJECT_GROUPS.map((g, i) => (
              <button key={g.label} type="button" role="tab" aria-selected={i === groupIdx} onClick={() => { setGroupIdx(i); setOpenUnit(null); }}
                className={`rounded-lg px-2 py-1 ${i === groupIdx ? 'bg-amber-400 text-slate-900 font-bold' : 'bg-slate-700 hover:bg-slate-600'}`}>
                {g.label}
              </button>
            ))}
          </div>
          <ul className="mt-3 space-y-1 max-h-[26rem] overflow-y-auto pr-1">
            {units.map((u) => {
              const key = `${u.subject}|${u.unit}`;
              const open = openUnit === key;
              const chosen = u.standards.filter((s) => selected.includes(s.code)).length;
              return (
                <li key={key} className="rounded-xl bg-slate-900/60 border border-slate-700">
                  <button type="button" aria-expanded={open} onClick={() => setOpenUnit(open ? null : key)} className="w-full text-left px-3 py-2 flex items-center gap-2">
                    <span className="text-slate-400 text-xs">{open ? '▾' : '▸'}</span>
                    <span className="text-sm font-semibold flex-1">{u.unit}</span>
                    {group.subjects.length > 1 && <span className="text-[10px] text-slate-500">{u.subject} {SUBJECT_SUBLABEL[u.subject]}</span>}
                    {chosen > 0 && <span className="rounded bg-amber-400 text-slate-900 text-[10px] px-1.5 font-bold">{chosen}</span>}
                  </button>
                  {open && (
                    <ul className="px-3 pb-2 space-y-1">
                      {u.standards.map((s) => (
                        <li key={s.code}>
                          <label className="flex gap-2 items-start text-xs cursor-pointer">
                            <input type="checkbox" checked={selected.includes(s.code)} onChange={() => toggle(s.code)} className="mt-0.5 accent-amber-400" />
                            <span><span className="font-mono text-amber-300">{s.code}</span> {s.text}
                              {s.suggested_year_range && <span className="text-slate-500"> · {formatYear(s.suggested_year_range[0])}~{formatYear(s.suggested_year_range[1])}</span>}
                            </span>
                          </label>
                        </li>
                      ))}
                    </ul>
                  )}
                </li>
              );
            })}
          </ul>
          {rec.withoutRange.length > 0 && (
            <p className="mt-2 text-[11px] text-slate-400">연대가 지정되지 않은 성취기준: {rec.withoutRange.join(', ')} — 연대는 직접 정해 주세요.</p>
          )}
        </section>

        <section aria-labelledby="compose" className="rounded-2xl bg-slate-800/60 border border-slate-700 p-4">
          <h2 id="compose" className="text-lg font-semibold">2. 수업 세션 구성</h2>
          <div className="mt-2 grid gap-3">
            <label className="flex flex-col gap-1 text-sm">세션 제목
              <input value={title} onChange={(e) => { setTitle(e.target.value); setTitleTouched(true); }} maxLength={60} className="rounded-xl bg-slate-900 px-3 py-2 border border-slate-600" placeholder="예: 1200년의 세계" />
            </label>
            <label className="flex flex-col gap-1 text-sm">학급
              <select value={classId} onChange={(e) => setClassId(e.target.value)} className="rounded-xl bg-slate-900 px-3 py-2 border border-slate-600">
                {classes.length === 0 && <option value="">학급을 먼저 만들어 주세요</option>}
                {classes.map((c) => <option key={c.id} value={c.id}>{c.name} ({c.code})</option>)}
              </select>
            </label>
            <div className="flex gap-2 flex-wrap">
              <label className="flex flex-col gap-1 text-sm">시작 연대
                <input value={from} onChange={(e) => setFrom(e.target.value)} placeholder="-221" className="w-28 rounded-xl bg-slate-900 px-3 py-2 border border-slate-600" />
              </label>
              <label className="flex flex-col gap-1 text-sm">끝 연대
                <input value={to} onChange={(e) => setTo(e.target.value)} placeholder="1453" className="w-28 rounded-xl bg-slate-900 px-3 py-2 border border-slate-600" />
              </label>
              <label className="flex flex-col gap-1 text-sm">시작 시 연대
                <input value={focus} onChange={(e) => setFocus(e.target.value)} placeholder="1200" className="w-28 rounded-xl bg-slate-900 px-3 py-2 border border-slate-600" />
              </label>
            </div>
            <fieldset>
              <legend className="text-sm mb-1">표시 레이어</legend>
              <div className="flex flex-wrap gap-2 text-xs">
                {(Object.keys(LAYER_LABELS) as LayerKey[]).map((k) => (
                  <label key={k} className={`rounded-lg px-2 py-1 border cursor-pointer ${layers[k] ? 'bg-amber-400 text-slate-900 border-amber-300 font-semibold' : 'bg-slate-900 border-slate-600'}`}>
                    <input type="checkbox" className="sr-only" checked={layers[k]} onChange={() => setLayers((p) => ({ ...p, [k]: !p[k] }))} />
                    {LAYER_LABELS[k]}
                  </label>
                ))}
              </div>
            </fieldset>

            <div>
              <h3 className="text-sm font-semibold">강조 국가 ({polities.length})</h3>
              <ul className="mt-1 flex flex-wrap gap-1">
                {polities.map((id) => {
                  const p = polityById.get(id);
                  return (
                    <li key={id}>
                      <button type="button" onClick={() => setPolities((x) => x.filter((v) => v !== id))} className="rounded bg-slate-700 px-2 py-0.5 text-xs hover:bg-red-800" title="클릭하면 제외">
                        {p?.name_ko ?? id} <span className="text-slate-400">{p && REGION_LABELS[p.region]}</span> ✕
                      </button>
                    </li>
                  );
                })}
                {polities.length === 0 && <li className="text-xs text-slate-500">성취기준을 고르면 자동으로 추천됩니다.</li>}
              </ul>
              <select className="mt-1 w-full rounded-lg bg-slate-900 border border-slate-600 px-2 py-1 text-xs" value="" aria-label="강조 국가 추가"
                onChange={(e) => { if (e.target.value) setPolities((p) => (p.includes(e.target.value) ? p : [...p, e.target.value])); }}>
                <option value="">＋ 국가 추가…</option>
                {dataset.polities.map((p) => <option key={p.id} value={p.id}>{p.name_ko} ({formatYear(p.start_year)}~{formatYear(p.end_year)})</option>)}
              </select>
            </div>

            <div>
              <h3 className="text-sm font-semibold">강조 인물 ({figures.length})</h3>
              <ul className="mt-1 flex flex-wrap gap-1">
                {figures.map((id) => (
                  <li key={id}>
                    <button type="button" onClick={() => setFigures((x) => x.filter((v) => v !== id))} className="rounded bg-amber-900/60 px-2 py-0.5 text-xs hover:bg-red-800" title="클릭하면 제외">
                      {figureById.get(id)?.name_ko ?? id} ✕
                    </button>
                  </li>
                ))}
                {figures.length === 0 && <li className="text-xs text-slate-500">성취기준을 고르면 자동으로 추천됩니다.</li>}
              </ul>
              <select className="mt-1 w-full rounded-lg bg-slate-900 border border-slate-600 px-2 py-1 text-xs" value="" aria-label="강조 인물 추가"
                onChange={(e) => { if (e.target.value) setFigures((p) => (p.includes(e.target.value) ? p : [...p, e.target.value])); }}>
                <option value="">＋ 인물 추가…</option>
                {dataset.figures.map((f) => <option key={f.id} value={f.id}>{f.name_ko} ({formatYear(f.birth_year)}~{formatYear(f.death_year)})</option>)}
              </select>
            </div>

            <div className="flex gap-2">
              <button type="button" disabled={!valid || busy} onClick={() => void save(false)} className="flex-1 rounded-xl bg-slate-700 px-4 py-2 font-bold disabled:opacity-50">초안으로 저장</button>
              <button type="button" disabled={!valid || busy} onClick={() => void save(true)} className="flex-1 rounded-xl bg-amber-400 text-slate-900 px-4 py-2 font-bold disabled:opacity-50">저장하고 학급에 배포</button>
            </div>
            {!valid && <p className="text-xs text-slate-400">학급·제목·연대(시작 ≤ 시작 시 연대 ≤ 끝)를 모두 채우면 저장할 수 있습니다.</p>}
          </div>
        </section>
      </div>
    </main>
  );
}
