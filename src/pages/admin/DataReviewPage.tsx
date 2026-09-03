import { useEffect, useMemo, useState } from 'react';
import { collection, doc, getDocs, serverTimestamp, setDoc } from 'firebase/firestore';
import { Link } from 'react-router-dom';
import { dataset } from '@/data';
import { db } from '@/lib/firebase';
import { formatYear, REGION_LABELS } from '@/lib/history';
import { useAuthStore } from '@/store/authStore';
import type { DataReviewDoc, ReviewStatus } from '@/types/firestore';

type Kind = 'polity' | 'figure' | 'place' | 'event';
const KIND_LABEL: Record<Kind, string> = { polity: '왕조·국가', figure: '인물', place: '장소', event: '사건' };
const STATUS_LABEL: Record<ReviewStatus, string> = { pending: '대기', approved: '검수 완료', needs_fix: '수정 필요' };
const STATUS_STYLE: Record<ReviewStatus, string> = {
  pending: 'bg-slate-700 text-slate-200',
  approved: 'bg-emerald-700 text-emerald-50',
  needs_fix: 'bg-amber-700 text-amber-50',
};

interface Item {
  kind: Kind;
  id: string;
  name: string;
  detail: string;
  approximate: boolean;
  note: string;
  sources: string[];
  subjects: string[];
}

function buildItems(): Item[] {
  const out: Item[] = [];
  for (const p of dataset.polities)
    out.push({ kind: 'polity', id: p.id, name: p.name_ko, detail: `${REGION_LABELS[p.region]} · ${formatYear(p.start_year)}~${formatYear(p.end_year)} · 수도 ${p.capital || '—'}`, approximate: p.is_approximate, note: p.note, sources: p.sources, subjects: p.textbook_appearance });
  for (const f of dataset.figures)
    out.push({ kind: 'figure', id: f.id, name: f.name_ko, detail: `${formatYear(f.birth_year)}~${formatYear(f.death_year)} · ${f.one_liner_ko}`, approximate: f.is_approximate, note: f.note, sources: f.sources, subjects: f.textbook_appearance });
  for (const p of dataset.places)
    out.push({ kind: 'place', id: p.id, name: p.name_ko, detail: `${p.type} · ${p.coords[0].toFixed(2)}, ${p.coords[1].toFixed(2)}`, approximate: false, note: p.note ?? '', sources: [], subjects: p.textbook_appearance ?? [] });
  for (const e of dataset.events)
    out.push({ kind: 'event', id: e.id, name: e.name_ko, detail: formatYear(e.year), approximate: false, note: e.note ?? '', sources: [], subjects: e.textbook_appearance });
  return out;
}

/** 검수 이력 한 줄 (Date.now 는 컴포넌트 밖에서 호출한다) */
function historyEntry(status: ReviewStatus, note: string, reviewerUid: string) {
  return { status, note, reviewerUid, at: Date.now() };
}

/** 데이터 검수/관리 (관리자) — 항목별 검수 상태와 수정 이력 */
export default function DataReviewPage() {
  const profile = useAuthStore((s) => s.profile);
  const isAdmin = useAuthStore((s) => s.isAdmin);
  const [reviews, setReviews] = useState<Record<string, DataReviewDoc>>({});
  const [kind, setKind] = useState<Kind | 'all'>('polity');
  const [status, setStatus] = useState<ReviewStatus | 'all'>('all');
  const [onlyApprox, setOnlyApprox] = useState(false);
  const [q, setQ] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const items = useMemo(() => buildItems(), []);

  useEffect(() => {
    let alive = true;
    void (async () => {
      try {
        const snap = await getDocs(collection(db, 'data_reviews'));
        if (!alive) return;
        setReviews(Object.fromEntries(snap.docs.map((d) => [d.id, d.data() as DataReviewDoc])));
      } catch (e) {
        if (alive) setError((e as Error).message);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return items.filter((it) => {
      if (kind !== 'all' && it.kind !== kind) return false;
      const r = reviews[`${it.kind}_${it.id}`];
      const st = r?.status ?? 'pending';
      if (status !== 'all' && st !== status) return false;
      if (onlyApprox && !it.approximate) return false;
      if (needle && !`${it.name}${it.id}${it.detail}`.toLowerCase().includes(needle)) return false;
      return true;
    });
  }, [items, reviews, kind, status, onlyApprox, q]);

  const counts = useMemo(() => {
    const c = { total: items.length, approved: 0, needs_fix: 0, pending: 0, approximate: 0 };
    for (const it of items) {
      const st = reviews[`${it.kind}_${it.id}`]?.status ?? 'pending';
      c[st] += 1;
      if (it.approximate) c.approximate += 1;
    }
    return c;
  }, [items, reviews]);

  const setReview = async (it: Item, next: ReviewStatus, note: string) => {
    if (!profile) return;
    setBusy(true);
    setError(null);
    const id = `${it.kind}_${it.id}`;
    const prev = reviews[id];
    const payload: DataReviewDoc = {
      kind: it.kind,
      itemId: it.id,
      status: next,
      note,
      reviewerUid: profile.uid,
      updatedAt: serverTimestamp(),
      history: [...(prev?.history ?? []), historyEntry(next, note, profile.uid)].slice(-20),
    };
    try {
      await setDoc(doc(db, 'data_reviews', id), payload);
      setReviews((p) => ({ ...p, [id]: payload }));
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  if (!profile) return null;

  return (
    <main className="min-h-full p-6 max-w-6xl mx-auto">
      <header className="flex items-center gap-3 flex-wrap">
        <Link to="/teacher" className="btn-icon">←</Link>
        <h1 className="text-2xl font-bold">🛠 데이터 검수</h1>
        <span className="text-sm text-slate-400">
          전체 {counts.total} · 검수 완료 {counts.approved} · 수정 필요 {counts.needs_fix} · 대기 {counts.pending} · 추정치 표시 {counts.approximate}
        </span>
      </header>
      {!isAdmin && <p className="mt-3 rounded-xl bg-amber-900/40 border border-amber-700/50 px-3 py-2 text-sm">읽기 전용입니다. 검수 상태를 바꾸려면 관리자 권한이 필요합니다(README 의 최초 관리자 지정 참고).</p>}
      {error && <p role="alert" className="mt-3 text-sm text-red-300">{error}</p>}

      <div className="mt-4 flex flex-wrap gap-2 items-end">
        <label className="flex flex-col gap-1 text-xs">종류
          <select value={kind} onChange={(e) => setKind(e.target.value as Kind | 'all')} className="rounded-lg bg-slate-900 border border-slate-600 px-2 py-1">
            <option value="all">전체</option>
            {(Object.keys(KIND_LABEL) as Kind[]).map((k) => <option key={k} value={k}>{KIND_LABEL[k]}</option>)}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-xs">검수 상태
          <select value={status} onChange={(e) => setStatus(e.target.value as ReviewStatus | 'all')} className="rounded-lg bg-slate-900 border border-slate-600 px-2 py-1">
            <option value="all">전체</option>
            {(Object.keys(STATUS_LABEL) as ReviewStatus[]).map((s) => <option key={s} value={s}>{STATUS_LABEL[s]}</option>)}
          </select>
        </label>
        <label className="flex items-center gap-1 text-xs">
          <input type="checkbox" checked={onlyApprox} onChange={(e) => setOnlyApprox(e.target.checked)} className="accent-amber-400" />
          추정치·개략 범위만
        </label>
        <label className="flex flex-col gap-1 text-xs flex-1 min-w-[12rem]">검색
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="이름·id·설명" className="rounded-lg bg-slate-900 border border-slate-600 px-2 py-1" />
        </label>
        <span className="text-xs text-slate-400">{filtered.length}개 표시</span>
      </div>

      <ul className="mt-4 space-y-2">
        {filtered.slice(0, 200).map((it) => {
          const r = reviews[`${it.kind}_${it.id}`];
          const st: ReviewStatus = r?.status ?? 'pending';
          return (
            <li key={`${it.kind}_${it.id}`} className="rounded-2xl bg-slate-800/60 border border-slate-700 p-3">
              <div className="flex items-start gap-2 flex-wrap">
                <span className={`rounded px-1.5 py-0.5 text-[11px] ${STATUS_STYLE[st]}`}>{STATUS_LABEL[st]}</span>
                <span className="rounded bg-slate-700 px-1.5 py-0.5 text-[11px]">{KIND_LABEL[it.kind]}</span>
                <h2 className="font-bold">{it.name}</h2>
                <code className="text-[11px] text-slate-400">{it.id}</code>
                {it.approximate && <span className="rounded bg-amber-900/60 px-1.5 py-0.5 text-[11px] text-amber-100">추정치</span>}
                {it.subjects.map((s) => <span key={s} className="rounded bg-slate-700/60 px-1.5 py-0.5 text-[11px]">{s}</span>)}
              </div>
              <p className="mt-1 text-sm text-slate-300">{it.detail}</p>
              {it.note && <p className="mt-1 text-xs text-amber-200">note: {it.note}</p>}
              {it.sources.length > 0 && <p className="mt-1 text-xs text-slate-400">출처: {it.sources.join(' · ')}</p>}
              {r?.note && <p className="mt-1 text-xs text-sky-200">검수 메모: {r.note}</p>}
              {r?.history?.length ? (
                <details className="mt-1">
                  <summary className="text-xs text-slate-400 cursor-pointer">수정 이력 {r.history.length}건</summary>
                  <ul className="mt-1 text-[11px] text-slate-400 space-y-0.5">
                    {r.history.slice().reverse().map((h, i) => (
                      <li key={i}>{new Date(h.at).toLocaleString('ko-KR')} · {STATUS_LABEL[h.status]} {h.note && `· ${h.note}`}</li>
                    ))}
                  </ul>
                </details>
              ) : null}
              {isAdmin && (
                <div className="mt-2 flex flex-wrap gap-1">
                  <button type="button" disabled={busy} className="rounded-lg bg-emerald-700 px-2 py-1 text-xs font-semibold disabled:opacity-50" onClick={() => void setReview(it, 'approved', '')}>검수 완료</button>
                  <button type="button" disabled={busy} className="rounded-lg bg-amber-700 px-2 py-1 text-xs font-semibold disabled:opacity-50"
                    onClick={() => { const n = prompt('무엇을 고쳐야 하나요?', r?.note ?? ''); if (n !== null) void setReview(it, 'needs_fix', n); }}>수정 필요</button>
                  <button type="button" disabled={busy} className="btn-icon text-xs" onClick={() => void setReview(it, 'pending', '')}>대기로</button>
                </div>
              )}
            </li>
          );
        })}
      </ul>
      {filtered.length > 200 && <p className="mt-3 text-sm text-slate-400">앞의 200개만 표시했습니다. 검색이나 필터를 좁혀 주세요.</p>}
    </main>
  );
}
