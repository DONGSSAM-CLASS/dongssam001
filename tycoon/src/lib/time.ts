// 시간은 전부 Asia/Seoul 기준으로 다룹니다(요구사항 7번).
const KST = 'Asia/Seoul';

/** 'YYYY-MM' — 급여·지적의 기준이 되는 달력 월 */
export function monthKST(date: Date = new Date()): string {
  const f = new Intl.DateTimeFormat('en-CA', { timeZone: KST, year: 'numeric', month: '2-digit' });
  return f.format(date).slice(0, 7);
}

/** 'YYYY-MM' 에서 n개월 이동 */
export function shiftMonth(month: string, delta: number): string {
  const [y, m] = month.split('-').map(Number);
  const d = new Date(Date.UTC(y, m - 1 + delta, 1));
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
}

export function formatMonthKo(month: string): string {
  const [y, m] = month.split('-');
  return `${y}년 ${Number(m)}월`;
}

export function formatDateTimeKST(value: unknown): string {
  const date =
    value instanceof Date
      ? value
      : value && typeof value === 'object' && 'toDate' in value
        ? (value as { toDate(): Date }).toDate()
        : null;
  if (!date) return '-';
  return new Intl.DateTimeFormat('ko-KR', {
    timeZone: KST,
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date);
}
