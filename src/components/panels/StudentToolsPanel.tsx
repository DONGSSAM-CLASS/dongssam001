import { useState } from 'react';
import { formatYear, haversineKm, travelDays, type TravelRates } from '@/lib/history';
import { useGlobeStore, type GlobeTool } from '@/store/globeStore';
import { useWorkStore } from '@/store/workStore';

const TOOLS: { key: GlobeTool; label: string; hint: string }[] = [
  { key: 'select', label: '👆 선택', hint: '국가·인물을 클릭해 정보 보기' },
  { key: 'pin', label: '📍 핀 찍기', hint: '지구본을 클릭해 장소에 핀을 꽂기' },
  { key: 'measure', label: '📏 거리 재기', hint: '두 지점을 차례로 클릭' },
];

/** 학생 도구: 핀 · 거리 · 루트 · 저장 상태 */
export function StudentToolsPanel({ rates }: { rates: TravelRates }) {
  const tool = useGlobeStore((s) => s.tool);
  const setTool = useGlobeStore((s) => s.setTool);
  const measure = useGlobeStore((s) => s.measurePoints);
  const clearMeasure = useGlobeStore((s) => s.clearMeasure);
  const year = useGlobeStore((s) => s.year);
  const pending = useWorkStore((s) => s.pendingPin);
  const setPending = useWorkStore((s) => s.setPendingPin);
  const addPin = useWorkStore((s) => s.addPin);
  const pins = useWorkStore((s) => s.pins);
  const removePin = useWorkStore((s) => s.removePin);
  const draft = useWorkStore((s) => s.draftRoute);
  const toggleDraft = useWorkStore((s) => s.toggleDraftPin);
  const clearDraft = useWorkStore((s) => s.clearDraft);
  const addRoute = useWorkStore((s) => s.addRoute);
  const routes = useWorkStore((s) => s.routes);
  const removeRoute = useWorkStore((s) => s.removeRoute);
  const saving = useWorkStore((s) => s.saving);
  const loading = useWorkStore((s) => s.loading);
  const dirty = useWorkStore((s) => s.dirty);
  const error = useWorkStore((s) => s.error);
  const sessionId = useWorkStore((s) => s.sessionId);
  const [pinName, setPinName] = useState('');
  const [pinMemo, setPinMemo] = useState('');
  const [routeTitle, setRouteTitle] = useState('');
  const [routeDesc, setRouteDesc] = useState('');

  const km = measure.length === 2 ? haversineKm(measure[0], measure[1]) : null;
  const days = km !== null ? travelDays(km, rates) : null;
  const byId = new Map(pins.map((p) => [p.id, p]));

  return (
    <div className="pointer-events-auto flex flex-col gap-2 rounded-2xl bg-slate-900/90 backdrop-blur border border-slate-700 p-3 text-sm w-72 max-h-[48vh] overflow-y-auto">
      <div role="radiogroup" aria-label="지구본 도구" className="flex gap-1">
        {TOOLS.map((t) => (
          <button key={t.key} type="button" role="radio" aria-checked={tool === t.key} title={t.hint} onClick={() => setTool(t.key)}
            className={`flex-1 rounded-lg px-1 py-1.5 text-xs ${tool === t.key ? 'bg-amber-400 text-slate-900 font-bold' : 'bg-slate-700 hover:bg-slate-600'}`}>
            {t.label}
          </button>
        ))}
      </div>
      <p className="text-[11px] text-slate-400">{TOOLS.find((t) => t.key === tool)?.hint}</p>

      {pending && (
        <form className="rounded-xl bg-amber-900/30 border border-amber-600/50 p-2 flex flex-col gap-1" onSubmit={(e) => { e.preventDefault(); if (!pinName.trim()) return; addPin({ name: pinName.trim(), memo: pinMemo.trim(), lat: pending.lat, lon: pending.lon, year: pending.year }); setPinName(''); setPinMemo(''); }}>
          <p className="text-xs font-semibold">📍 {formatYear(pending.year)} — 새 핀</p>
          <input autoFocus className="rounded bg-slate-800 border border-slate-600 px-2 py-1 text-xs" placeholder="장소 이름 (예: 하카타)" value={pinName} onChange={(e) => setPinName(e.target.value)} aria-label="핀 이름" />
          <textarea className="rounded bg-slate-800 border border-slate-600 px-2 py-1 text-xs" rows={2} placeholder="메모 (선택)" value={pinMemo} onChange={(e) => setPinMemo(e.target.value)} aria-label="핀 메모" />
          <div className="flex gap-1 justify-end">
            <button type="button" className="btn-icon text-xs" onClick={() => setPending(null)}>취소</button>
            <button type="submit" className="rounded-lg bg-amber-400 text-slate-900 px-3 py-1 text-xs font-bold">저장</button>
          </div>
        </form>
      )}

      {tool === 'measure' && (
        <div className="rounded-xl bg-cyan-900/30 border border-cyan-600/50 p-2 text-xs" aria-label="거리 결과" aria-live="polite">
          {km === null ? (
            <p>지점 {measure.length}/2 선택됨 — 지구본을 클릭하세요.</p>
          ) : (
            <>
              <p className="text-base font-bold text-cyan-200">{Math.round(km).toLocaleString()} km <span className="text-[10px] text-slate-400 font-normal">(대권거리)</span></p>
              <p className="mt-1">🚶 도보 약 {days!.walk}일 · 🐎 말 약 {days!.horse}일 · ⛵ 범선 약 {days!.sail}일</p>
              <p className="text-[10px] text-slate-400">기준: 하루 {rates.walkKmPerDay}/{rates.horseKmPerDay}/{rates.sailKmPerDay} km (교사 설정)</p>
            </>
          )}
          <button type="button" className="btn-icon mt-1 text-xs" onClick={clearMeasure}>지우기</button>
        </div>
      )}

      <section aria-label="내 핀" className="border-t border-slate-700 pt-2">
        <h3 className="text-xs font-semibold text-slate-300">내 핀 ({loading ? '…' : pins.length}) <span className="font-normal text-slate-400">— + 를 순서대로 누르면 루트가 됩니다</span></h3>
        <ul className="mt-1 space-y-0.5 max-h-32 overflow-y-auto">
          {pins.map((p) => (
            <li key={p.id} className="flex items-center gap-1 text-xs">
              <button
                type="button"
                onClick={() => toggleDraft(p.id)}
                aria-pressed={draft.includes(p.id)}
                aria-label={`${p.name}을(를) 루트에 ${draft.includes(p.id) ? '빼기' : '넣기'}`}
                className={`shrink-0 w-5 h-5 rounded ${draft.includes(p.id) ? 'bg-amber-400 text-slate-900 font-bold' : 'bg-slate-700 hover:bg-slate-600'}`}
              >
                {draft.includes(p.id) ? draft.indexOf(p.id) + 1 : '+'}
              </button>
              <span className={`truncate flex-1 ${draft.includes(p.id) ? 'text-amber-300' : ''}`}>{formatYear(p.year)} — {p.name}</span>
              <button type="button" className="text-slate-400 hover:text-red-300" aria-label={`${p.name} 핀 삭제`} onClick={() => removePin(p.id)}>✕</button>
            </li>
          ))}
        </ul>
      </section>

      {draft.length >= 2 && (
        <form className="rounded-xl bg-orange-900/30 border border-orange-600/50 p-2 flex flex-col gap-1" onSubmit={(e) => { e.preventDefault(); addRoute(routeTitle, routeDesc); setRouteTitle(''); setRouteDesc(''); }}>
          <p className="text-xs font-semibold">🧭 루트 만들기 — {draft.map((id) => byId.get(id)?.name).join(' → ')}</p>
          <input className="rounded bg-slate-800 border border-slate-600 px-2 py-1 text-xs" placeholder="루트 제목 (예: 정화의 항해)" value={routeTitle} onChange={(e) => setRouteTitle(e.target.value)} aria-label="루트 제목" />
          <input className="rounded bg-slate-800 border border-slate-600 px-2 py-1 text-xs" placeholder="설명 (선택)" value={routeDesc} onChange={(e) => setRouteDesc(e.target.value)} aria-label="루트 설명" />
          <div className="flex gap-1 justify-end">
            <button type="button" className="btn-icon text-xs" onClick={clearDraft}>취소</button>
            <button type="submit" className="rounded-lg bg-orange-400 text-slate-900 px-3 py-1 text-xs font-bold">루트 저장</button>
          </div>
        </form>
      )}

      {routes.length > 0 && (
        <section aria-label="내 루트" className="border-t border-slate-700 pt-2">
          <h3 className="text-xs font-semibold text-slate-300">내 루트 ({routes.length})</h3>
          <ul className="mt-1 space-y-0.5">
            {routes.map((r) => (
              <li key={r.id} className="flex items-center gap-1 text-xs">
                <span className="truncate flex-1">🧭 {r.title} <span className="text-slate-400">{r.totalKm.toLocaleString()} km · {r.pinIds.length}지점</span></span>
                <button type="button" className="text-slate-400 hover:text-red-300" aria-label={`${r.title} 루트 삭제`} onClick={() => removeRoute(r.id)}>✕</button>
              </li>
            ))}
          </ul>
        </section>
      )}

      <p className="text-[10px] text-slate-400 border-t border-slate-700 pt-1" aria-live="polite">
        {error ? `⚠ 저장 오류: ${error}` : loading ? '⏳ 기록 불러오는 중…' : saving ? '저장 중…' : dirty ? '변경됨 (곧 저장)' : sessionId ? '✔ 저장됨 (수업 세션)' : '✔ 이 기기에 저장됨 (자유 탐색)'} · {formatYear(year)}
      </p>
    </div>
  );
}
