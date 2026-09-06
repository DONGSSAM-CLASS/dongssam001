import { useCallback, useEffect, useState } from 'react';

/**
 * localStorage 동기화 훅 (원칙 4 — 서버 DB 없이 브라우저에만 저장).
 * 읽기/쓰기는 try/catch 로 감싸 프라이빗 모드 등에서도 앱이 죽지 않게 한다.
 */
export function useLocalStorage<T>(key: string, initial: T) {
  const [value, setValue] = useState<T>(() => {
    try {
      const raw = localStorage.getItem(key);
      return raw ? (JSON.parse(raw) as T) : initial;
    } catch {
      return initial;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      /* 저장 실패는 조용히 무시 */
    }
  }, [key, value]);

  const reset = useCallback(() => setValue(initial), [initial]);

  return [value, setValue, reset] as const;
}
