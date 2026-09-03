import { useEffect, useMemo, useRef, useState } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { Link, useParams } from 'react-router-dom';
import { db } from '@/lib/firebase';
import { DEFAULT_TRAVEL_RATES, formatYear } from '@/lib/history';
import { generateWorksheet, KIND_LABELS, newWorksheetItem, type WorksheetMeta } from '@/lib/worksheet';
import { buildStandaloneHtml } from '@/lib/worksheetHtml';
import { updateSession } from '@/lib/sessionService';
import { useAuthStore } from '@/store/authStore';
import type { ClassDoc, SessionDoc, WorksheetItem } from '@/types/firestore';

const KINDS = Object.keys(KIND_LABELS) as WorksheetItem['kind'][];

/** 활동지 생성·편집·다운로드 (서버 없이 브라우저에서만 처리) */
export default function WorksheetPage() {
  const { sessionId = '' } = useParams();
  const profile = useAuthStore((s) => s.profile);
  const [session, setSession] = useState<(SessionDoc & { id: string }) | null>(null);
  const [cls, setCls] = useState<ClassDoc | null>(null);
  const [items, setItems] = useState<WorksheetItem[]>([]);
  const [withAnswers, setWithAnswers] = useState(true);
  const [withInputs, setWithInputs] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const previewRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    if (!profile || profile.role !== 'teacher') return;
    let alive = true;
    void (async () => {
      try {
        const snap = await getDoc(doc(db, 'sessions', sessionId));
        if (!snap.exists()) throw new Error('세션을 찾을 수 없습니다.');
        const s = { id: snap.id, ...(snap.data() as SessionDoc) };
        const c = await getDoc(doc(db, 'classes', s.classId)).catch(() => null);
        if (!alive) return;
        setSession(s);
        setCls(c && c.exists() ? (c.data() as ClassDoc) : null);
        setItems(
          s.worksheet?.length
            ? // 예전에 저장된 활동지에 중복 id 가 있을 수 있어 불러올 때 정리한다
              s.worksheet.map((it, i) => ({ ...it, id: `${it.id}_${i}` }))
            : generateWorksheet({
                title: s.title,
                standards: s.achievementStandards ?? [],
                yearRange: s.yearRange,
                focusYear: s.focusYear,
                polityIds: s.highlightPolities ?? [],
                figureIds: s.highlightFigures ?? [],
                rates: (c?.data() as ClassDoc | undefined)?.settings ?? DEFAULT_TRAVEL_RATES,
              }),
        );
      } catch (e) {
        if (alive) setError((e as Error).message);
      }
    })();
    return () => {
      alive = false;
    };
  }, [sessionId, profile]);

  const meta: WorksheetMeta = useMemo(
    () => ({
      title: session?.title ?? '활동지',
      standards: session?.achievementStandards ?? [],
      yearRange: session?.yearRange ?? [0, 100],
      focusYear: session?.focusYear ?? 0,
      className: cls?.name,
      schoolName: profile?.role === 'teacher' ? profile.schoolName : undefined,
      teacherName: profile?.displayName,
    }),
    [session, cls, profile],
  );

  // 미리보기는 iframe 으로 띄운다 — 앱의 Tailwind 스타일이 섞이지 않아 내려받은 파일·인쇄 결과와 똑같이 보인다
  const previewHtml = useMemo(() => buildStandaloneHtml(items, meta, { withInputs, withAnswers }), [items, meta, withInputs, withAnswers]);

  const regenerate = () => {
    if (!session) return;
    setItems(
      generateWorksheet({
        title: session.title,
        standards: session.achievementStandards ?? [],
        yearRange: session.yearRange,
        focusYear: session.focusYear,
        polityIds: session.highlightPolities ?? [],
        figureIds: session.highlightFigures ?? [],
        rates: cls?.settings ?? DEFAULT_TRAVEL_RATES,
      }),
    );
    setStatus('성취기준·강조 항목을 바탕으로 다시 만들었습니다.');
  };

  const save = async () => {
    setBusy(true);
    setError(null);
    try {
      await updateSession(sessionId, { worksheet: items });
      setStatus('세션에 활동지를 저장했습니다.');
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const download = (content: string, filename: string, type: string) => {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    // 일부 브라우저는 문서에 붙어 있어야 download 속성(파일 이름)을 적용한다
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  const downloadHtml = () => {
    download(buildStandaloneHtml(items, meta, { withInputs: true, withAnswers: false }), `${meta.title}-활동지.html`, 'text/html;charset=utf-8');
    setStatus('HTML 파일을 내려받았습니다. 인터넷 없이 열 수 있고 학생이 직접 입력할 수 있습니다.');
  };

  /** 인쇄 창을 새로 열어 A4 규칙이 적용된 활동지만 인쇄한다(브라우저의 "PDF로 저장" 사용) */
  const printPdf = () => {
    const w = window.open('', '_blank', 'width=900,height=1000');
    if (!w) {
      setError('팝업이 차단되었습니다. 브라우저에서 팝업을 허용해 주세요.');
      return;
    }
    w.document.write(buildStandaloneHtml(items, meta, { withInputs: false, withAnswers: false }).replace('<div class="toolbar">', '<div class="toolbar" style="display:none">'));
    w.document.close();
    w.addEventListener('load', () => {
      w.focus();
      w.print();
    });
  };

  /** 보조 경로: html2pdf.js(jsPDF + html2canvas)로 바로 PDF 파일 저장 */
  const savePdfFile = async () => {
    const target = previewRef.current?.contentDocument?.querySelector('.sheet');
    if (!target) return;
    setBusy(true);
    setStatus('PDF를 만드는 중입니다…');
    try {
      const { default: html2pdf } = await import('html2pdf.js');
      await html2pdf()
        .set({
          margin: 0,
          filename: `${meta.title}-활동지.pdf`,
          image: { type: 'jpeg', quality: 0.96 },
          html2canvas: { scale: 2, useCORS: true, backgroundColor: '#ffffff' },
          jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
          pagebreak: { mode: ['css', 'legacy'] },
        })
        .from(target)
        .save();
      setStatus('PDF 파일을 내려받았습니다.');
    } catch (e) {
      setError(`PDF 생성 실패: ${(e as Error).message}. 대신 "인쇄 / PDF로 저장"을 사용해 주세요.`);
    } finally {
      setBusy(false);
    }
  };

  const patch = (id: string, p: Partial<WorksheetItem>) => setItems((prev) => prev.map((it) => (it.id === id ? { ...it, ...p } : it)));
  const move = (i: number, d: -1 | 1) =>
    setItems((prev) => {
      const next = [...prev];
      const j = i + d;
      if (j < 0 || j >= next.length) return prev;
      [next[i], next[j]] = [next[j], next[i]];
      return next;
    });

  if (error && !session) return <main className="p-6"><p className="text-red-300">{error}</p><Link to="/teacher" className="underline">← 대시보드</Link></main>;

  return (
    <main className="min-h-full p-4 lg:p-6">
      <header className="flex items-center gap-3 flex-wrap max-w-7xl mx-auto">
        <Link to={session ? `/teacher/classes/${session.classId}` : '/teacher'} className="btn-icon">←</Link>
        <h1 className="text-2xl font-bold">📄 활동지</h1>
        <span className="text-sm text-slate-400">{session?.title} · {session && `${formatYear(session.yearRange[0])}~${formatYear(session.yearRange[1])}`}</span>
        <div className="ml-auto flex flex-wrap gap-2 text-sm">
          <button type="button" className="btn-icon" onClick={regenerate}>🔄 다시 생성</button>
          <button type="button" className="btn-icon" disabled={busy} onClick={() => void save()}>💾 세션에 저장</button>
          <button type="button" className="rounded-lg bg-amber-400 text-slate-900 px-3 py-1.5 font-bold" onClick={printPdf}>🖨 인쇄 / PDF로 저장</button>
          <button type="button" className="btn-icon" disabled={busy} onClick={() => void savePdfFile()}>📥 PDF 파일</button>
          <button type="button" className="btn-icon" onClick={downloadHtml}>📥 HTML</button>
        </div>
      </header>
      {error && <p role="alert" className="mt-2 text-sm text-red-300 max-w-7xl mx-auto">{error}</p>}
      {status && <p className="mt-2 text-sm text-emerald-300 max-w-7xl mx-auto" aria-live="polite">{status}</p>}

      <div className="mt-4 grid gap-4 lg:grid-cols-[22rem_1fr] max-w-7xl mx-auto">
        <section aria-labelledby="editor" className="rounded-2xl bg-slate-800/60 border border-slate-700 p-3">
          <h2 id="editor" className="text-lg font-semibold">문항 편집</h2>
          <div className="mt-1 flex flex-wrap gap-2 text-xs">
            <label className="flex items-center gap-1"><input type="checkbox" checked={withAnswers} onChange={(e) => setWithAnswers(e.target.checked)} className="accent-amber-400" />교사용 정답 표시(미리보기)</label>
            <label className="flex items-center gap-1"><input type="checkbox" checked={withInputs} onChange={(e) => setWithInputs(e.target.checked)} className="accent-amber-400" />입력칸으로 보기</label>
          </div>
          <ul className="mt-3 space-y-2 max-h-[60vh] overflow-y-auto pr-1">
            {items.map((it, i) => (
              <li key={it.id} className="rounded-xl bg-slate-900/60 border border-slate-700 p-2">
                <div className="flex items-center gap-1 text-xs">
                  <span className="rounded bg-slate-700 px-1.5 py-0.5">{i + 1}. {KIND_LABELS[it.kind]}</span>
                  <button type="button" className="btn-icon ml-auto text-xs" aria-label="위로" onClick={() => move(i, -1)}>▲</button>
                  <button type="button" className="btn-icon text-xs" aria-label="아래로" onClick={() => move(i, 1)}>▼</button>
                  <button type="button" className="btn-icon text-xs" aria-label="삭제" onClick={() => setItems((p) => p.filter((x) => x.id !== it.id))}>✕</button>
                </div>
                <textarea
                  className="mt-1 w-full rounded bg-slate-800 border border-slate-600 px-2 py-1 text-xs"
                  rows={it.kind === 'objective' ? 4 : 2}
                  value={it.prompt}
                  aria-label={`${KIND_LABELS[it.kind]} 문항`}
                  onChange={(e) => patch(it.id, { prompt: e.target.value })}
                />
              </li>
            ))}
          </ul>
          <div className="mt-2 flex flex-wrap gap-1">
            {KINDS.map((k) => (
              <button key={k} type="button" className="rounded-lg bg-slate-700 px-2 py-1 text-xs hover:bg-slate-600" onClick={() => setItems((p) => [...p, newWorksheetItem(k)])}>
                ＋ {KIND_LABELS[k]}
              </button>
            ))}
          </div>
        </section>

        <section aria-labelledby="preview" className="min-w-0">
          <h2 id="preview" className="sr-only">미리보기</h2>
          <iframe
            ref={previewRef}
            title="활동지 미리보기"
            srcDoc={previewHtml}
            className="w-full h-[78vh] rounded-2xl bg-white border border-slate-700"
          />
        </section>
      </div>
    </main>
  );
}
