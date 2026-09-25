import type { KeyboardEvent } from 'react';

/**
 * 라디오 묶음 키보드 조작 (WAI-ARIA 라디오 그룹 방식)
 * - Tab 으로는 묶음에 한 번만 들어온다 (고른 항목, 없으면 첫 항목).
 * - ← ↑ / → ↓ 로 옮기면서 고른다.
 */
export function radioTabIndex<T>(value: T | null, item: T, index: number): 0 | -1 {
  if (value === null || value === undefined) return index === 0 ? 0 : -1;
  return value === item ? 0 : -1;
}

export function onRadioKeyDown<T>(e: KeyboardEvent<HTMLElement>, items: T[], value: T | null, set: (v: T) => void) {
  const keys: Record<string, number> = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 };
  const step = keys[e.key];
  if (!step) return;
  e.preventDefault();
  const buttons = [...e.currentTarget.querySelectorAll<HTMLElement>('[role="radio"]')];
  // 지금 초점이 있는 항목에서 움직인다 (아직 아무것도 고르지 않았을 때도 자연스럽게)
  const focused = buttons.indexOf(document.activeElement as HTMLElement);
  const cur = focused >= 0 ? focused : value === null ? 0 : items.indexOf(value);
  const next = (cur + step + items.length) % items.length;
  set(items[next]);
  buttons[next]?.focus();
}
