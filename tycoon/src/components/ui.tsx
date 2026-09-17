import { useState, type ReactNode } from 'react';
import { formatCoin } from '../lib/money';

export function Card({ title, right, children, tone = 'plain' }: {
  title?: ReactNode;
  right?: ReactNode;
  children: ReactNode;
  tone?: 'plain' | 'navy' | 'emerald' | 'sky' | 'violet';
}) {
  const ring = {
    plain: 'border-gray-200',
    navy: 'border-navy-500',
    emerald: 'border-emerald-500',
    sky: 'border-sky-400',
    violet: 'border-violet-500',
  }[tone];
  return (
    <section className={`rounded-2xl border-2 ${ring} bg-white p-5 shadow-sm`}>
      {(title || right) && (
        <header className="mb-3 flex items-center justify-between gap-3">
          <h2 className="text-lg font-bold">{title}</h2>
          {right}
        </header>
      )}
      {children}
    </section>
  );
}

export function Button({
  children, onClick, kind = 'primary', type = 'button', disabled, full,
}: {
  children: ReactNode;
  onClick?: () => void;
  kind?: 'primary' | 'ghost' | 'danger';
  type?: 'button' | 'submit';
  disabled?: boolean;
  full?: boolean;
}) {
  const style = {
    primary: 'bg-navy-600 text-white hover:bg-navy-700',
    ghost: 'bg-white text-navy-700 border-2 border-navy-500 hover:bg-navy-50',
    danger: 'bg-red-600 text-white hover:bg-red-700',
  }[kind];
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${style} ${full ? 'w-full' : ''} rounded-xl px-5 py-3 text-base font-bold transition disabled:cursor-not-allowed disabled:opacity-40`}
    >
      {children}
    </button>
  );
}

/** Tailwind 는 클래스 이름을 빌드 시점에 훑기 때문에 문자열을 조립하면 안 됩니다. */
const BADGE_TONES = {
  sky: 'bg-sky-100 text-sky-900',
  navy: 'bg-navy-100 text-navy-700',
  emerald: 'bg-emerald-100 text-emerald-900',
  violet: 'bg-violet-100 text-violet-900',
  amber: 'bg-amber-100 text-amber-900',
  red: 'bg-red-100 text-red-900',
  gray: 'bg-gray-100 text-gray-700',
} as const;

export function Badge({ children, tone = 'sky' }: { children: ReactNode; tone?: keyof typeof BADGE_TONES }) {
  return (
    <span className={`inline-block rounded-full px-3 py-1 text-sm font-bold ${BADGE_TONES[tone]}`}>
      {children}
    </span>
  );
}

/** 금액 표기 — 증가는 파랑, 감소는 빨강(주식 화면은 8단계에서 반대로 적용). */
export function Money({ amount, delta = false }: { amount: number; delta?: boolean }) {
  if (!delta) return <span className="font-bold tabular-nums">{formatCoin(amount)}</span>;
  const color = amount > 0 ? 'text-blue-600' : amount < 0 ? 'text-red-600' : 'text-gray-600';
  const sign = amount > 0 ? '+' : amount < 0 ? '−' : '';
  return (
    <span className={`font-bold tabular-nums ${color}`}>
      {sign}{formatCoin(Math.abs(amount))}
    </span>
  );
}

export function Field({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-bold text-gray-700">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-sm text-gray-500">{hint}</span>}
    </label>
  );
}

export const inputClass =
  'w-full rounded-xl border-2 border-gray-300 px-4 py-3 text-base focus:border-navy-500 focus:outline-none';

export function Notice({ kind = 'info', children }: { kind?: 'info' | 'error' | 'ok'; children: ReactNode }) {
  const style = {
    info: 'bg-sky-50 text-sky-900 border-sky-300',
    error: 'bg-red-50 text-red-900 border-red-300',
    ok: 'bg-emerald-50 text-emerald-900 border-emerald-300',
  }[kind];
  return <p className={`rounded-xl border-2 ${style} px-4 py-3 text-base`}>{children}</p>;
}

/**
 * 위험한 작업(일괄 회수·초기화·국고 소각)은 학급 코드를 다시 입력해야 실행됩니다.
 * 디자인 가이드 10번 요구사항입니다.
 */
export function DangerConfirm({
  open, title, description, classCode, onCancel, onConfirm,
}: {
  open: boolean;
  title: string;
  description: ReactNode;
  classCode: string;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  const [typed, setTyped] = useState('');
  if (!open) return null;
  const matches = typed.trim().toUpperCase() === classCode.toUpperCase();
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-6">
        <h3 className="text-xl font-bold text-red-700">{title}</h3>
        <div className="mt-3 text-base text-gray-700">{description}</div>
        <div className="mt-4">
          <Field label={`확인을 위해 학급 코드 ${classCode} 를 입력하세요`}>
            <input
              className={inputClass}
              value={typed}
              onChange={(e) => setTyped(e.target.value)}
              autoComplete="off"
            />
          </Field>
        </div>
        <div className="mt-5 flex gap-3">
          <Button kind="ghost" full onClick={() => { setTyped(''); onCancel(); }}>취소</Button>
          <Button kind="danger" full disabled={!matches} onClick={() => { setTyped(''); onConfirm(); }}>
            실행
          </Button>
        </div>
      </div>
    </div>
  );
}
