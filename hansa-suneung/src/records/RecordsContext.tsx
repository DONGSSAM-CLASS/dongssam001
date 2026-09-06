import { createContext, useContext, useCallback, type ReactNode } from 'react';
import { useLocalStorage } from '../lib/storage';

/** 단원별 학습 상태 3단계 (기능 6) */
export type RecordStatus = 'done' | 'unsure' | 'wrong';

export const STATUS_LABEL: Record<RecordStatus, string> = {
  done: '학습완료',
  unsure: '헷갈림',
  wrong: '오답',
};

export const STATUS_STYLE: Record<RecordStatus, string> = {
  done: 'bg-emerald-100 text-emerald-800 ring-emerald-300',
  unsure: 'bg-amber-100 text-amber-800 ring-amber-300',
  wrong: 'bg-rose-100 text-rose-800 ring-rose-300',
};

export type RecordMap = Record<string, RecordStatus>;

interface RecordsValue {
  records: RecordMap;
  setStatus: (unitId: string, status: RecordStatus | null) => void;
  clearAll: () => void;
  importRecords: (map: RecordMap) => void;
}

const RecordsContext = createContext<RecordsValue | null>(null);

const KEY = 'hansa.records';

export function RecordsProvider({ children }: { children: ReactNode }) {
  const [records, setRecords] = useLocalStorage<RecordMap>(KEY, {});

  const setStatus = useCallback(
    (unitId: string, status: RecordStatus | null) => {
      setRecords((prev) => {
        const next = { ...prev };
        if (status == null) delete next[unitId];
        else next[unitId] = status;
        return next;
      });
    },
    [setRecords],
  );

  const clearAll = useCallback(() => setRecords({}), [setRecords]);
  const importRecords = useCallback((map: RecordMap) => setRecords(map), [setRecords]);

  return (
    <RecordsContext.Provider value={{ records, setStatus, clearAll, importRecords }}>
      {children}
    </RecordsContext.Provider>
  );
}

export function useRecords(): RecordsValue {
  const ctx = useContext(RecordsContext);
  if (!ctx) throw new Error('useRecords 는 RecordsProvider 안에서만 사용할 수 있습니다.');
  return ctx;
}
