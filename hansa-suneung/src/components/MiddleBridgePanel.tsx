import { useData } from '../data/DataContext';
import { descendantIds } from '../lib/units';

/**
 * 중학생 모드 패널 (기능 9).
 * 선택한 고교 단원과 연결된 중학교 단원의 bridgeSummary·키워드만 보여준다.
 * 수능 문항 세부(문항번호·유형 등)는 감춘다.
 */
export default function MiddleBridgePanel({ unitId }: { unitId: string }) {
  const { unitById, middleSchoolMap } = useData();
  const f = unitById.get(unitId);
  if (!f) return null;

  // 선택 단원의 조상+자기+자손 id 집합과 겹치는 중학교 연결 항목을 찾는다.
  const related = new Set<string>([
    ...f.ancestors.map((a) => a.id),
    ...descendantIds(f.unit),
  ]);
  const entries = middleSchoolMap.filter((m) => m.hsUnitIds.some((id) => related.has(id)));

  if (entries.length === 0) {
    return (
      <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
        이 단원과 연결된 중학교 단원 정보가 아직 없습니다. (middleSchoolMap.json)
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {entries.map((m) => (
        <div key={m.msUnitId} className="rounded-lg border border-emerald-200 bg-emerald-50 p-4">
          <div className="text-xs font-semibold text-emerald-700">중학교 단원</div>
          <div className="text-base font-bold text-emerald-900">{m.msTitle}</div>
          <p className="mt-2 text-sm leading-relaxed text-emerald-900">{m.bridgeSummary}</p>
        </div>
      ))}
    </div>
  );
}
