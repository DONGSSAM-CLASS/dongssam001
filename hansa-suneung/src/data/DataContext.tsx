import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import type { Exam, Item } from '../types/schema';
import { loadAppData, type AppData } from './load';
import { buildUnitIndex, descendantIds, type FlatUnit } from '../lib/units';

interface DataContextValue extends AppData {
  loading: boolean;
  error: string | null;
  /** 단원 인덱스 */
  unitById: Map<string, FlatUnit>;
  examById: Map<string, Exam>;
  /** 단원(및 하위 소단원)에 연결된 문항. verifiedOnly=true 면 검수 완료 문항만. */
  itemsForUnit: (unitId: string, opts?: { verifiedOnly?: boolean }) => Item[];
  /** 학년도 목록(오름차순) */
  schoolYears: number[];
}

const DataContext = createContext<DataContextValue | null>(null);

export function DataProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<AppData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    loadAppData()
      .then((d) => {
        if (alive) setData(d);
      })
      .catch((e) => {
        if (alive) setError(e instanceof Error ? e.message : String(e));
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, []);

  const value = useMemo<DataContextValue | null>(() => {
    if (!data) return null;
    const { byId } = buildUnitIndex(data.curriculum);
    const examById = new Map(data.exams.map((e) => [e.examId, e]));

    // unitId → 그 단원(+하위)에 매칭되는 문항 집합을 미리 계산
    const itemsForUnit = (unitId: string, opts?: { verifiedOnly?: boolean }) => {
      const f = byId.get(unitId);
      if (!f) return [];
      const targetIds = new Set(descendantIds(f.unit));
      let list = data.items.filter((it) => it.unitIds.some((u) => targetIds.has(u)));
      if (opts?.verifiedOnly) list = list.filter((it) => it.verified);
      return list.sort(
        (a, b) =>
          (examById.get(b.examId)?.schoolYear ?? 0) -
            (examById.get(a.examId)?.schoolYear ?? 0) || a.number - b.number,
      );
    };

    const schoolYears = Array.from(
      new Set(data.exams.map((e) => e.schoolYear)),
    ).sort((a, b) => a - b);

    return {
      ...data,
      loading,
      error,
      unitById: byId,
      examById,
      itemsForUnit,
      schoolYears,
    };
  }, [data, loading, error]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center text-slate-500">
        데이터 불러오는 중…
      </div>
    );
  }
  if (error || !value) {
    return (
      <div className="flex min-h-screen items-center justify-center p-6 text-center text-red-600">
        데이터를 불러오지 못했습니다.
        <br />
        {error}
      </div>
    );
  }

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

export function useData(): DataContextValue {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error('useData 는 DataProvider 안에서만 사용할 수 있습니다.');
  return ctx;
}
