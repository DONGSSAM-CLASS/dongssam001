import { useCallback, useEffect, useRef, useState } from 'react';
import { useData } from '../app/DataContext';
import { ACTIVITY_SESSION, type ActivityId } from '../content/lessons';
import type { SubmissionStatus } from './types';

export type SaveState = 'idle' | 'saving' | 'saved' | 'error';

const AUTOSAVE_DELAY_MS = 1500;

export interface ActivityDraft {
  values: Record<string, unknown>;
  setValue: (key: string, value: unknown) => void;
  setValues: (patch: Record<string, unknown>) => void;
  saveState: SaveState;
  status: SubmissionStatus;
  submit: () => Promise<void>;
  /** 선생님이 수정을 잠갔거나 차시가 닫혀 있으면 true */
  locked: boolean;
  /** 차시가 아직 열리지 않았으면 true */
  notOpen: boolean;
  praise: string;
  ready: boolean;
}

/**
 * 활동지 한 장의 상태를 맡는다.
 * - 입력이 멈춘 뒤 1.5초에 자동 저장
 * - 제출 상태 관리
 * - 잠금 상태 확인
 */
export function useActivity(activityId: ActivityId): ActivityDraft {
  const { api, cls, submissions } = useData();
  const saved = submissions[activityId] ?? null;

  const [values, setValuesState] = useState<Record<string, unknown>>({});
  const [saveState, setSaveState] = useState<SaveState>('idle');
  const [status, setStatus] = useState<SubmissionStatus>('draft');
  const [ready, setReady] = useState(false);

  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dirty = useRef(false);

  // 서버(또는 localStorage)에 있는 값을 처음 한 번 불러온다.
  // 그 뒤에는 내가 타이핑한 값이 우선이라 덮어쓰지 않는다.
  useEffect(() => {
    if (ready) return;
    if (saved) {
      setValuesState(saved.data);
      setStatus(saved.status);
      setReady(true);
    } else if (api) {
      setReady(true);
    }
  }, [saved, api, ready]);

  const sessionState = cls?.sessions[ACTIVITY_SESSION[activityId]] ?? 'locked';
  const notOpen = sessionState === 'locked';
  const locked = Boolean(cls?.editLocked) || sessionState === 'closed' || notOpen;

  const persist = useCallback(
    async (next: Record<string, unknown>, nextStatus: SubmissionStatus) => {
      if (!api) return;
      setSaveState('saving');
      try {
        await api.saveSubmission(activityId, next, nextStatus);
        setSaveState('saved');
      } catch {
        setSaveState('error');
      }
    },
    [api, activityId],
  );

  const scheduleSave = useCallback(
    (next: Record<string, unknown>) => {
      if (timer.current) clearTimeout(timer.current);
      dirty.current = true;
      timer.current = setTimeout(() => {
        dirty.current = false;
        void persist(next, status);
      }, AUTOSAVE_DELAY_MS);
    },
    [persist, status],
  );

  const setValues = useCallback(
    (patch: Record<string, unknown>) => {
      if (locked) return;
      setValuesState((prev) => {
        const next = { ...prev, ...patch };
        scheduleSave(next);
        return next;
      });
    },
    [locked, scheduleSave],
  );

  const setValue = useCallback(
    (key: string, value: unknown) => setValues({ [key]: value }),
    [setValues],
  );

  const submit = useCallback(async () => {
    if (locked) return;
    if (timer.current) clearTimeout(timer.current);
    setStatus('submitted');
    await persist(values, 'submitted');
  }, [locked, persist, values]);

  // 화면을 떠날 때 아직 저장하지 않은 값이 있으면 바로 저장한다.
  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );

  return {
    values,
    setValue,
    setValues,
    saveState,
    status,
    submit,
    locked,
    notOpen,
    praise: saved?.praise ?? '',
    ready,
  };
}

/** 필수 칸이 모두 채워졌는지 확인한다. */
export function meetsRequirements(
  values: Record<string, unknown>,
  required: { key: string; minLength?: number }[],
): boolean {
  return required.every(({ key, minLength = 1 }) => {
    const value = values[key];
    if (typeof value === 'string') return value.trim().length >= minLength;
    if (Array.isArray(value)) return value.length > 0;
    if (typeof value === 'number') return true;
    return Boolean(value);
  });
}
