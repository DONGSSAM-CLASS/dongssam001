/** 기기별 설정: 애니메이션 끄기 */
const KEY = 'cww.reduceMotion';

export function loadReduceMotion(): boolean {
  try {
    return localStorage.getItem(KEY) === '1';
  } catch {
    return false;
  }
}

export function applyReduceMotion(on: boolean): void {
  document.documentElement.dataset.reduceMotion = on ? 'true' : 'false';
  try {
    localStorage.setItem(KEY, on ? '1' : '0');
  } catch {
    /* 무시 */
  }
}
