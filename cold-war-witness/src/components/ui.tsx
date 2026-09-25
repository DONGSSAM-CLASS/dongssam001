/**
 * 공통 화면 부품. 버튼은 크게(최소 높이 48px), 글자는 16px 이상.
 */
import { useEffect, useId, useRef, type ButtonHTMLAttributes, type ReactNode } from 'react';
import { Link, type LinkProps } from 'react-router-dom';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'chapter';

const VARIANT: Record<Variant, string> = {
  primary: 'bg-ink text-paper hover:bg-black disabled:bg-ink-soft/50',
  secondary: 'bg-paper-dark text-ink border border-line hover:bg-folder disabled:opacity-50',
  ghost: 'bg-transparent text-ink underline-offset-4 hover:underline disabled:opacity-50',
  danger: 'bg-stamp text-white hover:bg-[#8f1d16] disabled:opacity-50',
  chapter: 'bg-ch-900 text-white hover:bg-ch-600 disabled:opacity-50',
};

const BASE =
  'inline-flex min-h-12 items-center justify-center gap-2 rounded-md px-5 py-2.5 text-[17px] font-bold transition-colors disabled:cursor-not-allowed';

export function Button({
  variant = 'primary',
  className = '',
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }) {
  return <button type="button" className={`${BASE} ${VARIANT[variant]} ${className}`} {...rest} />;
}

export function LinkButton({
  variant = 'primary',
  className = '',
  ...rest
}: LinkProps & { variant?: Variant }) {
  return <Link className={`${BASE} ${VARIANT[variant]} ${className}`} {...rest} />;
}

export function Notice({
  tone = 'info',
  children,
  className = '',
}: {
  tone?: 'info' | 'warn' | 'error' | 'ok';
  children: ReactNode;
  className?: string;
}) {
  const styles = {
    info: 'border-[#1d4e89] bg-[#e7eef7] text-[#16365e]',
    warn: 'border-[#9a5b00] bg-[#fdf1d8] text-[#5c3700]',
    error: 'border-stamp bg-[#fbe5e2] text-[#7a1a14]',
    ok: 'border-declass bg-[#e2f2e8] text-[#154d2f]',
  }[tone];
  return (
    <div role={tone === 'error' ? 'alert' : 'status'} className={`rounded-md border-l-4 px-4 py-3 ${styles} ${className}`}>
      {children}
    </div>
  );
}

export function Loading({ label = '불러오는 중이에요…' }: { label?: string }) {
  return (
    <div className="flex min-h-[40vh] flex-col items-center justify-center gap-3" role="status" aria-live="polite">
      <span className="typewriter animate-pulse text-lg text-ink-soft">▮▮▮ 문서 여는 중</span>
      <span className="text-ink-soft">{label}</span>
    </div>
  );
}

/** 글자 수가 보이는 쓰기 칸 */
export function TextArea({
  label,
  value,
  onChange,
  onBlur,
  maxLength,
  minLength,
  rows = 5,
  placeholder,
  describedBy,
  count,
}: {
  label: ReactNode;
  value: string;
  onChange: (v: string) => void;
  onBlur?: () => void;
  maxLength: number;
  /** 최소 글자 수 (표시용) */
  minLength?: number;
  rows?: number;
  placeholder?: string;
  describedBy?: string;
  /** 표시할 글자 수 (없으면 value.length) */
  count?: number;
}) {
  const id = useId();
  const n = count ?? value.length;
  const enough = minLength ? n >= minLength : true;
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="font-bold">
        {label}
      </label>
      <textarea
        id={id}
        value={value}
        rows={rows}
        maxLength={maxLength}
        placeholder={placeholder}
        aria-describedby={`${id}-count${describedBy ? ` ${describedBy}` : ''}`}
        onChange={(e) => onChange(e.target.value)}
        onBlur={onBlur}
        className="w-full rounded-md border-2 border-line bg-white px-3 py-2 text-[17px] leading-relaxed focus:border-ink"
      />
      <p id={`${id}-count`} className={`text-right text-[15px] ${enough ? 'text-declass' : 'text-ink-soft'}`}>
        {minLength ? (enough ? `✔ ${n}자 — 충분해요` : `${n}자 / 최소 ${minLength}자`) : `${n}자`} · 최대 {maxLength}자
      </p>
    </div>
  );
}

/** 짧은 글 입력 칸 */
export function TextInput({
  label,
  value,
  onChange,
  maxLength,
  hint,
  inputMode,
  autoComplete = 'off',
  type = 'text',
  placeholder,
  autoFocus,
  error,
}: {
  label: ReactNode;
  value: string;
  onChange: (v: string) => void;
  maxLength?: number;
  hint?: ReactNode;
  inputMode?: 'text' | 'numeric';
  autoComplete?: string;
  type?: 'text' | 'password';
  placeholder?: string;
  autoFocus?: boolean;
  error?: string | null;
}) {
  const id = useId();
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="font-bold">
        {label}
      </label>
      {hint && (
        <p id={`${id}-hint`} className="text-[15px] text-ink-soft">
          {hint}
        </p>
      )}
      <input
        id={id}
        type={type}
        value={value}
        maxLength={maxLength}
        inputMode={inputMode}
        autoComplete={autoComplete}
        placeholder={placeholder}
        autoFocus={autoFocus}
        aria-invalid={error ? true : undefined}
        aria-describedby={[hint ? `${id}-hint` : '', error ? `${id}-err` : ''].filter(Boolean).join(' ') || undefined}
        onChange={(e) => onChange(e.target.value)}
        className="min-h-12 w-full rounded-md border-2 border-line bg-white px-3 text-[18px] focus:border-ink"
      />
      {error && (
        <p id={`${id}-err`} className="text-[15px] font-bold text-stamp">
          {error}
        </p>
      )}
    </div>
  );
}

/** 모달 (브라우저 기본 dialog: Esc 로 닫히고 초점이 안에 머문다) */
export function Modal({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const openRef = useRef(open);
  openRef.current = open;
  const titleId = useId();
  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) d.showModal();
    if (!open && d.open) d.close();
  }, [open]);
  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      // 화면 코드가 닫은 경우(open=false)는 무시하고, 사용자가 Esc 로 닫았을 때만 알린다.
      onClose={() => {
        if (openRef.current) onClose();
      }}
      className="dossier m-auto w-[min(92vw,34rem)] p-0 text-ink"
    >
      <div className="flex flex-col gap-4 p-5">
        <h2 id={titleId} className="typewriter text-xl font-bold">
          {title}
        </h2>
        {children}
      </div>
    </dialog>
  );
}

/** 도장 */
export function Stamp({
  children,
  tone = 'stamp',
  animate = false,
  className = '',
}: {
  children: ReactNode;
  tone?: 'stamp' | 'declass';
  animate?: boolean;
  className?: string;
}) {
  return (
    <span
      className={`stamp ${tone === 'stamp' ? 'text-stamp' : 'text-declass'} ${animate ? 'animate-stamp' : ''} ${className}`}
    >
      {children}
    </span>
  );
}

/** 오류를 사람 말로 */
export function friendlyError(e: unknown): string {
  const code = typeof e === 'object' && e && 'code' in e ? String((e as { code: unknown }).code) : '';
  if (code === 'unavailable' || code === 'auth/network-request-failed')
    return '인터넷 연결이 불안정해요. 연결을 확인하고 다시 눌러 주세요.';
  if (code === 'permission-denied') return '이 작업을 할 수 있는 권한이 없어요. 선생님께 알려 주세요.';
  if (code === 'auth/popup-closed-by-user' || code === 'auth/cancelled-popup-request') return '로그인 창이 닫혔어요. 다시 시도해 주세요.';
  if (code === 'auth/popup-blocked') return '팝업이 막혔어요. 브라우저 주소창 오른쪽에서 팝업을 허용해 주세요.';
  return '문제가 생겼어요. 잠시 뒤 다시 시도해 주세요.';
}

/** 자동 저장 상태 표시 */
export function SaveBadge({ status }: { status: 'idle' | 'saving' | 'saved' | 'error' }) {
  if (status === 'idle') return null;
  const text = { saving: '저장 중…', saved: '✔ 자동 저장됨', error: '⚠ 저장 못 함 — 인터넷을 확인해 주세요' }[status];
  const color = { saving: 'text-ink-soft', saved: 'text-declass', error: 'text-stamp font-bold' }[status];
  return (
    <span role="status" aria-live="polite" className={`text-[15px] ${color}`}>
      {text}
    </span>
  );
}
