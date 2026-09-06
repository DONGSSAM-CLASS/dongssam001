import { createContext, useContext, type ReactNode } from 'react';
import { useLocalStorage } from '../lib/storage';

interface Settings {
  /** 중학생 모드 — 켜면 수능 문항 세부 대신 중학교 연결 요약만 노출(기능 9) */
  middleMode: boolean;
  setMiddleMode: (v: boolean) => void;
}

const SettingsContext = createContext<Settings | null>(null);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [middleMode, setMiddleMode] = useLocalStorage('hansa.middleMode', false);
  return (
    <SettingsContext.Provider value={{ middleMode, setMiddleMode }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings(): Settings {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error('useSettings 는 SettingsProvider 안에서만 사용할 수 있습니다.');
  return ctx;
}
