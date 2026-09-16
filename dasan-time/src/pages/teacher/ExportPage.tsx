import { useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import JSZip from 'jszip';
import { FileDown, FileText, Package, Printer } from 'lucide-react';
import { indexSubmissions, useTeacher } from '../../app/TeacherContext';
import { downloadBlob, elementToPdfBlob, safeFileName } from '../../lib/pdf';
import StudentReport from '../../report/StudentReport';
import ActivityReport from '../../report/ActivityReport';
import { EmptyState, ErrorNotice, Loading } from '../../components/States';
import { ACTIVITY_IDS, ACTIVITY_LABEL, type ActivityId } from '../../content/lessons';
import type { Evaluation } from '../../lib/types';

export default function ExportPage() {
  const { cls, students, submissions, evaluations, loading } = useTeacher();
  const [includeUsage, setIncludeUsage] = useState(false);
  const [targetUid, setTargetUid] = useState('');
  const [activityId, setActivityId] = useState<ActivityId>('s2_a4_3');
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState({ done: 0, total: 0 });
  const [error, setError] = useState('');

  // 화면 밖에 두고 캡처만 한다. display:none 이면 캡처되지 않으므로 화면 왼쪽 밖으로 보낸다.
  const studentRef = useRef<HTMLDivElement>(null);
  const activityRef = useRef<HTMLDivElement>(null);

  const subIndex = useMemo(() => indexSubmissions(submissions), [submissions]);
  const evalIndex = useMemo(() => {
    const map = new Map<string, Evaluation>();
    evaluations.forEach((e) => map.set(e.id, e));
    return map;
  }, [evaluations]);

  if (loading) return <Loading />;
  if (!cls) return <EmptyState title="학급을 먼저 골라 주세요" description="대시보드에서 학급을 만들어 주세요." />;
  if (students.length === 0) {
    return (
      <EmptyState
        title="아직 가입한 학생이 없어요"
        description={`학생들에게 학급 코드 ${cls.code} 를 알려 주세요.`}
      />
    );
  }

  const target = students.find((s) => s.uid === targetUid) ?? students[0];
  // 위 가드를 지난 뒤의 학급. 함수 선언이 위로 끌어올려지면서 좁혀진 타입을 잃지 않도록 따로 잡아 둔다.
  const klass = cls;

  /** 화면에 그려진 리포트가 실제로 바뀔 시간을 준 뒤 캡처한다. */
  function nextPaint(): Promise<void> {
    return new Promise((resolve) =>
      requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
    );
  }

  async function exportOne() {
    if (!studentRef.current) return;
    setBusy(true);
    setError('');
    try {
      await nextPaint();
      const blob = await elementToPdfBlob(studentRef.current);
      downloadBlob(blob, safeFileName(`${target.number}_${target.name}_다산의시간.pdf`));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'PDF 를 만들지 못했어요.');
    } finally {
      setBusy(false);
    }
  }

  async function exportAll() {
    setBusy(true);
    setError('');
    setProgress({ done: 0, total: students.length });
    try {
      const zip = new JSZip();
      for (const st of students) {
        setTargetUid(st.uid);
        await nextPaint();
        if (!studentRef.current) continue;
        const blob = await elementToPdfBlob(studentRef.current);
        zip.file(safeFileName(`${st.number}_${st.name}_다산의시간.pdf`), blob);
        setProgress((p) => ({ ...p, done: p.done + 1 }));
      }
      const out = await zip.generateAsync({ type: 'blob' });
      downloadBlob(out, safeFileName(`${klass.name}_다산의시간_학급전체.zip`));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'ZIP 을 만들지 못했어요.');
    } finally {
      setBusy(false);
      setProgress({ done: 0, total: 0 });
    }
  }

  async function exportActivity() {
    if (!activityRef.current) return;
    setBusy(true);
    setError('');
    try {
      await nextPaint();
      const blob = await elementToPdfBlob(activityRef.current);
      downloadBlob(blob, safeFileName(`${klass.name}_${ACTIVITY_LABEL[activityId]}.pdf`));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'PDF 를 만들지 못했어요.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <h1 className="text-2xl font-extrabold">PDF 내보내기</h1>
      <p className="text-sm opacity-70">
        생활기록부를 쓰실 때 참고하실 수 있도록 학생 기록을 모아 드려요.
      </p>

      {error && <ErrorNotice message={error} />}

      <label className="label w-fit cursor-pointer justify-start gap-3 rounded-2xl bg-base-100 px-4 shadow-sm">
        <input
          type="checkbox"
          className="checkbox checkbox-primary"
          checked={includeUsage}
          onChange={(e) => setIncludeUsage(e.target.checked)}
        />
        <span className="label-text font-semibold">사용 시간 숫자 포함 (기본값: 제외)</span>
      </label>

      {busy && progress.total > 0 && (
        <div className="card rounded-2xl bg-base-100 shadow-sm">
          <div className="card-body gap-2 p-4">
            <p className="font-semibold">
              만드는 중이에요… {progress.done} / {progress.total}
            </p>
            <progress
              className="progress progress-primary w-full"
              value={progress.done}
              max={progress.total}
            />
          </div>
        </div>
      )}

      {/* 개인 포트폴리오 */}
      <section className="card rounded-2xl bg-base-100 shadow-sm">
        <div className="card-body gap-3 p-4">
          <h2 className="card-title text-base">
            <FileText className="h-5 w-5 text-primary" aria-hidden />
            학생 개인 포트폴리오
          </h2>
          <div className="flex flex-wrap items-end gap-2">
            <label className="form-control">
              <span className="label-text mb-1 font-bold">학생</span>
              <select
                className="select select-bordered rounded-2xl"
                value={target.uid}
                onChange={(e) => setTargetUid(e.target.value)}
              >
                {students.map((s) => (
                  <option key={s.uid} value={s.uid}>
                    {s.number}. {s.name}
                  </option>
                ))}
              </select>
            </label>
            <button
              type="button"
              className="btn btn-primary gap-2 rounded-2xl"
              disabled={busy}
              onClick={() => void exportOne()}
            >
              <FileDown className="h-4 w-4" aria-hidden />
              PDF 저장
            </button>
          </div>
        </div>
      </section>

      {/* 학급 전체 ZIP */}
      <section className="card rounded-2xl bg-base-100 shadow-sm">
        <div className="card-body gap-3 p-4">
          <h2 className="card-title text-base">
            <Package className="h-5 w-5 text-secondary" aria-hidden />
            학급 전체 내보내기 (ZIP)
          </h2>
          <p className="text-sm opacity-70">
            학생 {students.length}명의 PDF 를 만들어 ZIP 한 개로 받아요. 학생 수가 많으면 시간이 조금
            걸려요.
          </p>
          <button
            type="button"
            className="btn btn-secondary w-fit gap-2 rounded-2xl"
            disabled={busy}
            onClick={() => void exportAll()}
          >
            <Package className="h-4 w-4" aria-hidden />
            ZIP 으로 받기
          </button>
        </div>
      </section>

      {/* 활동별 모아 보기 */}
      <section className="card rounded-2xl bg-base-100 shadow-sm">
        <div className="card-body gap-3 p-4">
          <h2 className="card-title text-base">
            <FileText className="h-5 w-5 text-accent" aria-hidden />
            활동별 모아 보기
          </h2>
          <div className="flex flex-wrap items-end gap-2">
            <label className="form-control">
              <span className="label-text mb-1 font-bold">활동</span>
              <select
                className="select select-bordered rounded-2xl"
                value={activityId}
                onChange={(e) => setActivityId(e.target.value as ActivityId)}
              >
                {ACTIVITY_IDS.map((id) => (
                  <option key={id} value={id}>
                    {ACTIVITY_LABEL[id]}
                  </option>
                ))}
              </select>
            </label>
            <button
              type="button"
              className="btn btn-accent gap-2 rounded-2xl"
              disabled={busy}
              onClick={() => void exportActivity()}
            >
              <FileDown className="h-4 w-4" aria-hidden />
              PDF 저장
            </button>
          </div>
        </div>
      </section>

      {/* 가정 안내문 */}
      <section className="card rounded-2xl bg-base-100 shadow-sm">
        <div className="card-body gap-3 p-4">
          <h2 className="card-title text-base">
            <Printer className="h-5 w-5 text-success" aria-hidden />
            가정 안내문 인쇄
          </h2>
          <Link to={`/teacher/letter/${cls.id}`} className="btn btn-outline w-fit rounded-2xl">
            안내문 열기
          </Link>
        </div>
      </section>

      {/*
        캡처 원본. 화면에는 보이지 않지만 실제로 그려져 있어야 html2canvas-pro 가 읽을 수 있다.
        display:none 대신 화면 밖으로 밀어 둔다.
      */}
      <div aria-hidden className="pointer-events-none fixed left-[-10000px] top-0">
        <StudentReport
          ref={studentRef}
          cls={cls}
          student={target}
          submissions={subIndex}
          evaluations={evalIndex}
          includeUsageNumbers={includeUsage}
        />
        <ActivityReport
          ref={activityRef}
          cls={cls}
          activityId={activityId}
          students={students}
          submissions={subIndex}
          includeUsageNumbers={includeUsage}
        />
      </div>
    </div>
  );
}
