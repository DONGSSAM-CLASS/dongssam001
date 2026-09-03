import { useEffect, useRef, useState } from 'react';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { Link } from 'react-router-dom';
import { db } from '@/lib/firebase';
import { formatYear } from '@/lib/history';
import { useAuthStore } from '@/store/authStore';
import type { StudentWorkDoc } from '@/types/firestore';

/** 학생 내 기록: 세션별 핀·루트 목록 + PNG 내보내기 (html2canvas, 클라이언트 처리) */
export default function StudentRecordsPage() {
  const profile = useAuthStore((s) => s.profile);
  const [works, setWorks] = useState<(StudentWorkDoc & { id: string })[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);
  const sheet = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!profile || profile.role !== 'student') return;
    getDocs(query(collection(db, 'student_work'), where('classId', '==', profile.classId), where('number', '==', profile.number)))
      .then((snap) => setWorks(snap.docs.map((d) => ({ id: d.id, ...(d.data() as StudentWorkDoc) }))))
      .catch((e) => setError((e as Error).message));
  }, [profile]);

  const exportPng = async () => {
    if (!sheet.current) return;
    setExporting(true);
    try {
      const { default: html2canvas } = await import('html2canvas');
      const canvas = await html2canvas(sheet.current, { backgroundColor: '#0b1220', scale: 2 });
      canvas.toBlob((blob) => {
        if (!blob) return;
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `history-globe-${profile?.displayName ?? 'student'}.png`;
        a.click();
        URL.revokeObjectURL(url);
      });
    } finally {
      setExporting(false);
    }
  };

  if (!profile || profile.role !== 'student') return null;
  return (
    <main className="min-h-full p-6 max-w-3xl mx-auto">
      <header className="flex items-center gap-3">
        <h1 className="text-2xl font-bold">📒 내 탐색 기록</h1>
        <div className="ml-auto flex gap-2 text-sm">
          <button type="button" className="btn-icon" onClick={() => void exportPng()} disabled={exporting}>{exporting ? '만드는 중…' : '🖼 PNG로 내보내기'}</button>
          <Link to="/student" className="btn-icon">← 홈</Link>
        </div>
      </header>
      {error && <p className="text-sm text-red-300 mt-2">{error}</p>}
      <div ref={sheet} className="mt-4 rounded-2xl bg-slate-900 p-4 border border-slate-700">
        <p className="text-sm text-slate-300">{profile.nickname ?? profile.displayName} ({profile.number}번)</p>
        {works === null ? <p className="text-slate-400 text-sm mt-2">불러오는 중…</p> : works.length === 0 ? (
          <p className="text-slate-400 text-sm mt-2">아직 수업 세션에서 저장한 기록이 없습니다.</p>
        ) : (
          works.map((w) => (
            <section key={w.id} className="mt-4">
              <h2 className="font-semibold text-amber-300">세션 {w.sessionId}</h2>
              <h3 className="mt-2 text-sm font-semibold">📍 핀 ({w.pins.length})</h3>
              <table className="mt-1 w-full text-xs">
                <thead className="text-left text-slate-400"><tr><th className="py-1">연대</th><th>장소</th><th>좌표</th><th>메모</th></tr></thead>
                <tbody>
                  {w.pins.map((p) => (
                    <tr key={p.id} className="border-t border-slate-800"><td className="py-1 whitespace-nowrap">{formatYear(p.year)}</td><td>{p.name}</td><td className="whitespace-nowrap">{p.lat.toFixed(2)}, {p.lon.toFixed(2)}</td><td>{p.memo}</td></tr>
                  ))}
                </tbody>
              </table>
              {w.routes.length > 0 && (
                <>
                  <h3 className="mt-3 text-sm font-semibold">🧭 루트 ({w.routes.length})</h3>
                  <ul className="mt-1 text-xs space-y-1">
                    {w.routes.map((r) => {
                      const names = r.pinIds.map((id) => w.pins.find((p) => p.id === id)?.name ?? '?');
                      return <li key={r.id} className="border-t border-slate-800 pt-1"><span className="font-semibold">{r.title}</span> — {names.join(' → ')} · 총 {r.totalKm.toLocaleString()} km {r.description && <span className="text-slate-400">({r.description})</span>}</li>;
                    })}
                  </ul>
                </>
              )}
            </section>
          ))
        )}
      </div>
    </main>
  );
}
