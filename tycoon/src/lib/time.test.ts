import { describe, expect, it } from 'vitest';
import { formatMonthKo, monthKST, shiftMonth } from './time';

describe('월 계산 (Asia/Seoul 기준)', () => {
  it('UTC 자정 직후여도 한국 날짜로 계산한다', () => {
    // 2026-09-30 22:00 UTC = 2026-10-01 07:00 KST → 10월
    expect(monthKST(new Date('2026-09-30T22:00:00Z'))).toBe('2026-10');
    // 2026-10-01 00:30 KST 이전인 2026-09-30 14:00 UTC = 23:00 KST → 9월
    expect(monthKST(new Date('2026-09-30T14:00:00Z'))).toBe('2026-09');
  });

  it('다음 달·지난 달을 구한다', () => {
    expect(shiftMonth('2026-09', 1)).toBe('2026-10');
    expect(shiftMonth('2026-12', 1)).toBe('2027-01');
    expect(shiftMonth('2026-01', -1)).toBe('2025-12');
  });

  it('한국어로 보여 준다', () => {
    expect(formatMonthKo('2026-09')).toBe('2026년 9월');
  });
});
