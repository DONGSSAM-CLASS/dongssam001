import { useCallback, useEffect, useRef, useState } from 'react';

export type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';

/**
 * 쓰기 칸 자동 저장: 입력을 멈추고 1.2초 뒤에 저장한다. (Firestore 쓰기 횟수를 줄이기 위해)
 * flushAll() 은 남은 저장을 바로 끝낸다. 실패한 글은 남겨 두었다가 다음 flush 때 다시 저장한다.
 */
export function useDraftSaver(save: (id: string, text: string) => Promise<void>, delay = 1200) {
  const timers = useRef(new Map<string, ReturnType<typeof setTimeout>>());
  const pending = useRef(new Map<string, string>());
  const saveRef = useRef(save);
  saveRef.current = save;
  const [status, setStatus] = useState<SaveStatus>('idle');

  const run = useCallback(async (id: string): Promise<boolean> => {
    const t = timers.current.get(id);
    if (t) clearTimeout(t);
    timers.current.delete(id);
    const text = pending.current.get(id);
    if (text === undefined) return true;
    pending.current.delete(id);
    setStatus('saving');
    try {
      await saveRef.current(id, text);
      if (pending.current.size === 0) setStatus('saved');
      return true;
    } catch {
      if (!pending.current.has(id)) pending.current.set(id, text);
      setStatus('error');
      return false;
    }
  }, []);

  const schedule = useCallback(
    (id: string, text: string) => {
      pending.current.set(id, text);
      const t = timers.current.get(id);
      if (t) clearTimeout(t);
      timers.current.set(
        id,
        setTimeout(() => void run(id), delay),
      );
      setStatus('saving');
    },
    [run, delay],
  );

  const flushAll = useCallback(async (): Promise<boolean> => {
    const ids = [...pending.current.keys()];
    const results = await Promise.all(ids.map((id) => run(id)));
    return results.every(Boolean);
  }, [run]);

  // 화면을 떠날 때 남은 글을 저장한다.
  useEffect(
    () => () => {
      for (const id of [...pending.current.keys()]) void run(id);
    },
    [run],
  );

  return { schedule, flushAll, status };
}
