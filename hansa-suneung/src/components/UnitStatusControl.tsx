import {
  STATUS_LABEL,
  STATUS_STYLE,
  useRecords,
  type RecordStatus,
} from '../records/RecordsContext';

const ORDER: RecordStatus[] = ['done', 'unsure', 'wrong'];

/** 단원의 학습 상태(학습완료/헷갈림/오답)를 토글하는 버튼 묶음. */
export default function UnitStatusControl({ unitId }: { unitId: string }) {
  const { records, setStatus } = useRecords();
  const current = records[unitId];
  return (
    <div className="flex items-center gap-1">
      {ORDER.map((s) => {
        const active = current === s;
        return (
          <button
            key={s}
            type="button"
            onClick={() => setStatus(unitId, active ? null : s)}
            className={`rounded-md px-2 py-1 text-xs font-medium ring-1 ${
              active ? STATUS_STYLE[s] : 'bg-white text-slate-500 ring-slate-200 hover:bg-slate-50'
            }`}
            aria-pressed={active}
          >
            {STATUS_LABEL[s]}
          </button>
        );
      })}
    </div>
  );
}
