import type { EconomySettings } from '../types';

/** 코인은 정수만 씁니다. 화면에는 천 단위 콤마와 단위를 붙입니다. */
export function formatCoin(amount: number): string {
  return `${Math.trunc(amount).toLocaleString('ko-KR')}코인`;
}

export function formatSignedCoin(amount: number): string {
  const sign = amount > 0 ? '+' : amount < 0 ? '−' : '';
  return `${sign}${Math.abs(Math.trunc(amount)).toLocaleString('ko-KR')}코인`;
}

/** 소득세 계산. 누진세는 구간별로 쪼개어 더합니다. 결과는 항상 정수. */
export function calcIncomeTax(gross: number, settings: EconomySettings): number {
  if (gross <= 0) return 0;
  if (settings.taxMode === 'flat') {
    // 설정을 잘못 넣어도 세금이 총액을 넘지 않게 막습니다.
    return Math.min(gross, Math.floor(gross * settings.flatTaxRate));
  }
  let remaining = gross;
  let lower = 0;
  let tax = 0;
  for (const bracket of settings.brackets) {
    const upper = bracket.upTo ?? Infinity;
    const span = Math.min(remaining, upper - lower);
    if (span <= 0) break;
    tax += span * bracket.rate;
    remaining -= span;
    lower = upper;
    if (remaining <= 0) break;
  }
  return Math.min(gross, Math.floor(tax));
}
