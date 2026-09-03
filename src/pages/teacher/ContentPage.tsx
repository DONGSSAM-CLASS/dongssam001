import { useMemo, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { dataset } from '@/data';
import { formatYear, REGION_LABELS } from '@/lib/history';
import { useMergedDataset } from '@/lib/mergedData';
import { deleteOverride, saveOverride, watchOverrides } from '@/lib/overridesService';
import { useAuthStore } from '@/store/authStore';
import { useOverridesStore } from '@/store/overridesStore';
import { useEffect } from 'react';
import type { OverrideKind } from '@/types/firestore';
import type { Region } from '@/types/history';

const KIND_LABEL: Record<OverrideKind, string> = { polity: '왕조·국가', figure: '인물', place: '장소' };

/**
 * 교사 콘텐츠 관리 — 기본 데이터는 보호되고, 여기서 만든 수정본은 그 교사의 학급에만 적용된다.
 */
export default function ContentPage() {
  const profile = useAuthStore((s) => s.profile);
  const overrides = useOverridesStore((s) => s.overrides);
  const merged = useMergedDataset();
  const [kind, setKind] = useState<OverrideKind>('polity');
  const [targetId, setTargetId] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  // 새 항목 입력값
  const [name, setName] = useState('');
  const [summary, setSummary] = useState('');
  const [startYear, setStartYear] = useState('');
  const [endYear, setEndYear] = useState('');
  const [lat, setLat] = useState('');
  const [lon, setLon] = useState('');
  const [region, setRegion] = useState<Region>('east_asia');

  const uid = profile?.uid;
  useEffect(() => {
    if (!uid) return;
    return watchOverrides(uid);
  }, [uid]);

  const baseList = useMemo(() => {
    if (kind === 'polity') return dataset.polities.map((p) => ({ id: p.id, label: `${p.name_ko} (${formatYear(p.start_year)}~${formatYear(p.end_year)})` }));
    if (kind === 'figure') return dataset.figures.map((f) => ({ id: f.id, label: `${f.name_ko} (${formatYear(f.birth_year)}~${formatYear(f.death_year)})` }));
    return dataset.places.map((p) => ({ id: p.id, label: p.name_ko }));
  }, [kind]);

  const act = async (fn: () => Promise<unknown>, msg: string) => {
    if (!uid) return;
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      await fn();
      setNotice(msg);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const addNew = async (e: FormEvent) => {
    e.preventDefault();
    if (!uid || !name.trim()) return;
    const id = `custom_${Date.now().toString(36)}`;
    const coords: [number, number] = [Number(lat) || 0, Number(lon) || 0];
    const data =
      kind === 'polity'
        ? {
            name_ko: name.trim(), name_en: name.trim(), region, start_year: Number(startYear) || 0, end_year: Number(endYear) || 0,
            capital: '', centroid: coords, area_polygon: [], radius_km: 300, is_approximate: true,
            summary_ko: summary.trim(), textbook_appearance: [], achievement_standards: [], sources: ['교사 추가 자료'], note: '교사가 추가한 항목입니다.',
          }
        : kind === 'figure'
          ? {
              name_ko: name.trim(), name_en: name.trim(), birth_year: Number(startYear) || 0, death_year: Number(endYear) || 0,
              is_approximate: true, polity_id: null, activity_location: coords, activity_years: [Number(startYear) || 0, Number(endYear) || 0],
              one_liner_ko: summary.trim(), textbook_appearance: [], achievement_standards: [], sources: ['교사 추가 자료'], note: '교사가 추가한 항목입니다.',
            }
          : {
              name_ko: name.trim(), name_en: name.trim(), coords, type: 'site',
              era_names: [{ from: Number(startYear) || -3000, to: Number(endYear) || 9999, name_ko: name.trim() }],
              note: '교사가 추가한 항목입니다.',
            };
    await act(() => saveOverride(uid, kind, id, 'add', data), `${KIND_LABEL[kind]} "${name}"을(를) 우리 학급 자료에 추가했습니다.`);
    setName('');
    setSummary('');
  };

  if (!profile || profile.role !== 'teacher') return null;

  return (
    <main className="min-h-full p-6 max-w-5xl mx-auto">
      <header className="flex items-center gap-3 flex-wrap">
        <Link to="/teacher" className="btn-icon">←</Link>
        <h1 className="text-2xl font-bold">🧩 우리 학급 자료</h1>
        <span className="text-sm text-slate-400">기본 데이터는 그대로 두고, 여기서 고친 내용은 선생님 학급에만 적용됩니다.</span>
      </header>
      {error && <p role="alert" className="mt-3 text-sm text-red-300">{error}</p>}
      {notice && <p className="mt-3 text-sm text-emerald-300">{notice}</p>}

      <section className="mt-5" aria-labelledby="cur">
        <h2 id="cur" className="text-lg font-semibold">적용 중인 수정본 ({overrides.length})</h2>
        {overrides.length === 0 ? (
          <p className="mt-1 text-sm text-slate-400">아직 없습니다. 아래에서 기본 자료를 숨기거나 새 자료를 추가해 보세요.</p>
        ) : (
          <table className="mt-2 w-full text-sm">
            <thead className="text-left text-xs text-slate-400"><tr><th className="py-1">종류</th><th>대상</th><th>동작</th><th className="text-right">관리</th></tr></thead>
            <tbody>
              {overrides.map((o) => (
                <tr key={o.id} className="border-t border-slate-800">
                  <td className="py-1.5">{KIND_LABEL[o.kind]}</td>
                  <td>{String((o.data as { name_ko?: string }).name_ko ?? o.targetId)}</td>
                  <td>{o.op === 'add' ? '추가' : o.op === 'edit' ? '수정' : '숨김'}</td>
                  <td className="text-right">
                    <button type="button" className="btn-icon text-xs" disabled={busy} onClick={() => void act(() => deleteOverride(profile.uid, o.kind, o.targetId), '수정본을 되돌렸습니다.')}>되돌리기</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      <div className="mt-6 grid gap-5 md:grid-cols-2">
        <section aria-labelledby="edit-base" className="rounded-2xl bg-slate-800/60 border border-slate-700 p-4">
          <h2 id="edit-base" className="text-lg font-semibold">기본 자료 고치기 · 숨기기</h2>
          <div className="mt-2 flex gap-1 text-xs">
            {(Object.keys(KIND_LABEL) as OverrideKind[]).map((k) => (
              <button key={k} type="button" onClick={() => { setKind(k); setTargetId(''); }} aria-pressed={kind === k}
                className={`rounded-lg px-2 py-1 ${kind === k ? 'bg-amber-400 text-slate-900 font-bold' : 'bg-slate-700 hover:bg-slate-600'}`}>{KIND_LABEL[k]}</button>
            ))}
          </div>
          <label className="mt-2 flex flex-col gap-1 text-sm">항목 고르기
            <select value={targetId} onChange={(e) => setTargetId(e.target.value)} className="rounded-xl bg-slate-900 px-3 py-2 border border-slate-600">
              <option value="">선택…</option>
              {baseList.map((b) => <option key={b.id} value={b.id}>{b.label}</option>)}
            </select>
          </label>
          {targetId && (
            <div className="mt-2 flex flex-col gap-2">
              <label className="flex flex-col gap-1 text-sm">설명 바꾸기 (비우면 그대로)
                <textarea value={summary} onChange={(e) => setSummary(e.target.value)} rows={3} className="rounded-xl bg-slate-900 px-3 py-2 border border-slate-600 text-xs" placeholder="우리 반 수업에 맞춘 설명을 적어 주세요" />
              </label>
              <div className="flex gap-2">
                <button type="button" disabled={busy || !summary.trim()} className="rounded-xl bg-sky-500 text-slate-900 px-3 py-2 text-sm font-bold disabled:opacity-50"
                  onClick={() => void act(() => saveOverride(profile.uid, kind, targetId, 'edit', kind === 'figure' ? { one_liner_ko: summary.trim() } : { summary_ko: summary.trim() }), '설명을 우리 학급용으로 바꿨습니다.')}>
                  설명 바꾸기
                </button>
                <button type="button" disabled={busy} className="rounded-xl bg-slate-700 px-3 py-2 text-sm hover:bg-slate-600"
                  onClick={() => void act(() => saveOverride(profile.uid, kind, targetId, 'hide', {}), '우리 학급 지구본에서 숨겼습니다.')}>
                  숨기기
                </button>
              </div>
            </div>
          )}
        </section>

        <section aria-labelledby="add-new" className="rounded-2xl bg-slate-800/60 border border-slate-700 p-4">
          <h2 id="add-new" className="text-lg font-semibold">새 자료 추가</h2>
          <form onSubmit={addNew} className="mt-2 flex flex-col gap-2">
            <label className="flex flex-col gap-1 text-sm">이름
              <input value={name} onChange={(e) => setName(e.target.value)} maxLength={40} className="rounded-xl bg-slate-900 px-3 py-2 border border-slate-600" placeholder={kind === 'place' ? '예: 우리 고장 유적' : '예: 우리 지역 인물'} />
            </label>
            <label className="flex flex-col gap-1 text-sm">한 줄 설명
              <input value={summary} onChange={(e) => setSummary(e.target.value)} maxLength={120} className="rounded-xl bg-slate-900 px-3 py-2 border border-slate-600" />
            </label>
            <div className="flex gap-2">
              <label className="flex flex-col gap-1 text-sm flex-1">{kind === 'figure' ? '출생' : '시작'} 연도
                <input value={startYear} onChange={(e) => setStartYear(e.target.value)} className="rounded-xl bg-slate-900 px-3 py-2 border border-slate-600" placeholder="-221" />
              </label>
              <label className="flex flex-col gap-1 text-sm flex-1">{kind === 'figure' ? '사망' : '끝'} 연도
                <input value={endYear} onChange={(e) => setEndYear(e.target.value)} className="rounded-xl bg-slate-900 px-3 py-2 border border-slate-600" placeholder="1453" />
              </label>
            </div>
            <div className="flex gap-2">
              <label className="flex flex-col gap-1 text-sm flex-1">위도
                <input value={lat} onChange={(e) => setLat(e.target.value)} className="rounded-xl bg-slate-900 px-3 py-2 border border-slate-600" placeholder="37.5" />
              </label>
              <label className="flex flex-col gap-1 text-sm flex-1">경도
                <input value={lon} onChange={(e) => setLon(e.target.value)} className="rounded-xl bg-slate-900 px-3 py-2 border border-slate-600" placeholder="127.0" />
              </label>
            </div>
            {kind === 'polity' && (
              <label className="flex flex-col gap-1 text-sm">문화권
                <select value={region} onChange={(e) => setRegion(e.target.value as Region)} className="rounded-xl bg-slate-900 px-3 py-2 border border-slate-600">
                  {(Object.keys(REGION_LABELS) as Region[]).map((r) => <option key={r} value={r}>{REGION_LABELS[r]}</option>)}
                </select>
              </label>
            )}
            <button type="submit" disabled={busy || !name.trim()} className="rounded-xl bg-amber-400 text-slate-900 px-4 py-2 font-bold disabled:opacity-50">＋ 우리 학급 자료로 추가</button>
            <p className="text-[11px] text-slate-400">추가한 자료는 "개략적 범위"로 표시되고, 출처는 "교사 추가 자료"로 기록됩니다. 현재 우리 학급 지구본에는 왕조 {merged.polities.length} · 인물 {merged.figures.length} · 장소 {merged.places.length}개가 보입니다.</p>
          </form>
        </section>
      </div>
    </main>
  );
}
