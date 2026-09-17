import { describe, expect, it } from 'vitest';
import { calcIncomeTax, formatCoin, formatSignedCoin } from './money';
import { DEFAULT_ECONOMY } from '../types';

describe('금액 표기', () => {
  it('천 단위 콤마와 단위를 붙인다', () => {
    expect(formatCoin(1234567)).toBe('1,234,567코인');
    expect(formatCoin(0)).toBe('0코인');
  });
  it('증감은 부호를 붙인다', () => {
    expect(formatSignedCoin(500)).toBe('+500코인');
    expect(formatSignedCoin(-500)).toBe('−500코인');
  });
});

describe('소득세 계산', () => {
  it('단일세율은 내림한 정수다', () => {
    expect(calcIncomeTax(500, DEFAULT_ECONOMY)).toBe(50);
    expect(calcIncomeTax(555, DEFAULT_ECONOMY)).toBe(55);   // 55.5 → 55
    expect(calcIncomeTax(0, DEFAULT_ECONOMY)).toBe(0);
  });

  it('누진세는 구간별로 나누어 더한다', () => {
    const progressive = { ...DEFAULT_ECONOMY, taxMode: 'progressive' as const };
    // 300까지 5% = 15, 300~600 구간 5%(=300의 10%가 아니라 나머지 200×10%=20)
    expect(calcIncomeTax(300, progressive)).toBe(15);
    expect(calcIncomeTax(500, progressive)).toBe(35);       // 15 + 200×10%
    expect(calcIncomeTax(1000, progressive)).toBe(125);     // 15 + 30 + 400×20%
  });

  it('세금이 총액을 넘지 않는다', () => {
    const absurd = { ...DEFAULT_ECONOMY, flatTaxRate: 3 };
    expect(calcIncomeTax(100, absurd)).toBe(100);
  });
});
