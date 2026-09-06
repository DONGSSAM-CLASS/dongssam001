import { Fragment, useMemo, useRef } from 'react';
import { useData } from '../data/DataContext';
import { flattenUnits } from '../lib/units';
import {
  STATUS_LABEL,
  useRecords,
  type RecordMap,
  type RecordStatus,
} from '../records/RecordsContext';
import UnitStatusControl from '../components/UnitStatusControl';
import { downloadText, readFileText } from '../lib/download';

/** 내 학습 기록 (기능 6). 단원별 3단계 상태 + JSON 내보내기/가져오기. localStorage 저장. */
export default function RecordsPage() {
  const { curriculum, unitById } = useData();
  const { records, clearAll, importRecords } = useRecords();
  const fileRef = useRef<HTMLInputElement>(null);

  const leaves = useMemo(
    () => flattenUnits(curriculum.units).filter((f) => !f.unit.children?.length),
    [curriculum],
  );

  const counts = useMemo(() => {
    const c: Record<RecordStatus, number> = { done: 0, unsure: 0, wrong: 0 };
    for (const s of Object.values(records)) c[s] += 1;
    return c;
  }, [records]);

  const exportJson = () =>
    downloadText('hansa-records.json', JSON.stringify(records, null, 2));

  const importJson = async (file: File) => {
    try {
      const map = JSON.parse(await readFileText(file)) as RecordMap;
      if (typeof map !== 'object' || Array.isArray(map)) throw new Error('형식 오류');
      importRecords(map);
    } catch (e) {
      alert('가져오기 실패: ' + (e instanceof Error ? e.message : String(e)));
    }
  };

  let currentTop = '';

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-xl font-bold text-slate-900">내 학습 기록</h1>
          <p className="text-sm text-slate-500">
            단원별로 학습완료·헷갈림·오답을 표시하세요. 기록은 이 브라우저에 저장됩니다(기기 이동은 내보내기/가져오기).
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={exportJson} className="rounded-md border px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50">
            JSON 내보내기
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="application/json,.json"
            className="hidden"
            onChange={(e) => e.target.files?.[0] && importJson(e.target.files[0])}
          />
          <button onClick={() => fileRef.current?.click()} className="rounded-md border px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50">
            JSON 가져오기
          </button>
          <button
            onClick={() => {
              if (confirm('모든 학습 기록을 지울까요?')) clearAll();
            }}
            className="rounded-md border border-rose-200 px-3 py-1.5 text-sm font-medium text-rose-600 hover:bg-rose-50"
          >
            전체 지우기
          </button>
        </div>
      </div>

      <div className="mb-4 flex gap-2 text-sm">
        {(['done', 'unsure', 'wrong'] as RecordStatus[]).map((s) => (
          <span key={s} className="rounded-md bg-slate-100 px-3 py-1">
            {STATUS_LABEL[s]} <b>{counts[s]}</b>
          </span>
        ))}
      </div>

      <div className="overflow-hidden rounded-lg border bg-white">
        <table className="w-full text-sm">
          <tbody>
            {leaves.map((f) => {
              const top = f.ancestors[0]?.title ?? '';
              const showGroup = top !== currentTop;
              currentTop = top;
              return (
                <Fragment key={f.unit.id}>
                  {showGroup && (
                    <tr>
                      <td colSpan={2} className="border-b bg-slate-100 px-3 py-1 text-xs font-bold text-slate-500">
                        {top}
                      </td>
                    </tr>
                  )}
                  <tr className="hover:bg-slate-50">
                    <td className="border-b px-3 py-2 text-slate-700" title={f.unit.id}>
                      {f.unit.title}
                    </td>
                    <td className="border-b px-3 py-2 text-right">
                      <div className="inline-flex">
                        <UnitStatusControl unitId={f.unit.id} />
                      </div>
                    </td>
                  </tr>
                </Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
      {unitById.size === 0 && <p className="mt-3 text-sm text-slate-400">단원 데이터가 없습니다.</p>}
    </div>
  );
}
