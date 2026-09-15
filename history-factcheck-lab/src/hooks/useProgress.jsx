import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import { emptyCaseState } from '../lib/scoring.js';
import { emptyProgress, loadProgress, saveProgress, clearProgress } from '../lib/storage.js';

const ProgressContext = createContext(null);

export function ProgressProvider({ children }) {
  const [progress, setProgress] = useState(() => emptyProgress());
  const [storageOk, setStorageOk] = useState(true);
  const [ready, setReady] = useState(false);

  // 첫 렌더 뒤에 읽는다(서버 렌더링이나 저장소 차단 환경에서도 앱이 죽지 않게).
  useEffect(() => {
    setProgress(loadProgress());
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    setStorageOk(saveProgress(progress));
  }, [progress, ready]);

  const getCaseState = useCallback(
    (caseId) => progress.cases[caseId] ?? emptyCaseState(),
    [progress],
  );

  /** 특정 케이스의 한 단계를 갱신한다. updater는 이전 단계 상태를 받아 새 상태를 돌려준다. */
  const updateCaseStep = useCallback((caseId, stepKey, updater) => {
    setProgress((prev) => {
      const current = prev.cases[caseId] ?? emptyCaseState();
      const nextStep =
        typeof updater === 'function' ? updater(current[stepKey]) : updater;
      return {
        ...prev,
        cases: {
          ...prev.cases,
          [caseId]: { ...current, [stepKey]: nextStep },
        },
      };
    });
  }, []);

  const markVisited = useCallback((caseId, stepNo) => {
    setProgress((prev) => {
      const current = prev.cases[caseId] ?? emptyCaseState();
      if (current.visited?.includes(stepNo)) return prev;
      return {
        ...prev,
        cases: {
          ...prev.cases,
          [caseId]: { ...current, visited: [...(current.visited ?? []), stepNo] },
        },
      };
    });
  }, []);

  const setName = useCallback((name) => {
    setProgress((prev) => ({ ...prev, name }));
  }, []);

  const replaceProgress = useCallback((next) => {
    setProgress(next);
  }, []);

  const resetAll = useCallback(() => {
    clearProgress();
    setProgress(emptyProgress());
  }, []);

  const resetCase = useCallback((caseId) => {
    setProgress((prev) => {
      const nextCases = { ...prev.cases };
      delete nextCases[caseId];
      return { ...prev, cases: nextCases };
    });
  }, []);

  const value = useMemo(
    () => ({
      progress,
      ready,
      storageOk,
      getCaseState,
      updateCaseStep,
      markVisited,
      setName,
      replaceProgress,
      resetAll,
      resetCase,
    }),
    [
      progress,
      ready,
      storageOk,
      getCaseState,
      updateCaseStep,
      markVisited,
      setName,
      replaceProgress,
      resetAll,
      resetCase,
    ],
  );

  return <ProgressContext.Provider value={value}>{children}</ProgressContext.Provider>;
}

export function useProgress() {
  const ctx = useContext(ProgressContext);
  if (!ctx) throw new Error('useProgress는 ProgressProvider 안에서만 쓸 수 있습니다.');
  return ctx;
}
