/**
 * 공통 화면 부품. 버튼은 크게(최소 높이 48px), 글자는 16px 이상.
 */
import { useEffect, useId, useRef, type ButtonHTMLAttributes, type ReactNode } from 'react';
import { Link, type LinkProps } from 'react-router-dom';
import { Check, CircleAlert, CircleCheck, Info, LoaderCircle, TriangleAlert } from 'lucide-react';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'chapter' | 'accent';

const VARIANT: Record<Variant, string> = {
  primary: 'btn-primary',
  secondary: 'btn-outline border-base-300 bg-base-100 hover:bg-base-200 text-base-content',
  ghost: 'btn-ghost',
  danger: 'btn-error text-white bg-[#c0264b] border-[#c0264b] hover:bg-[#a01d3d]',
  chapter: 'border-0 bg-ch-900 text-white hover:bg-ch-600',
  accent: 'btn-secondary',
};

const BASE = 'btn h-auto min-h-12 rounded-full px-5 py-2 text-[17px] font-bold shadow-none';

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

const NOTICE_ICON = { info: Info, warn: TriangleAlert, error: CircleAlert, ok: CircleCheck } as const;

export function Notice({
  tone = 'info',
  children,
  className = '',
}: {
  tone?: 'info' | 'warn' | 'error' | 'ok';
  children: ReactNode;
  className?: string;
}) {
  // 글자 대비를 지키기 위해 옅은 바탕 + 진한 글자로 만든다.
  const styles = {
    info: 'bg-[#e8f3fb] text-[#17405f] border-[#b9dcf3]',
    warn: 'bg-[#fff4dc] text-[#5c3a00] border-[#f5d98f]',
    error: 'bg-[#fdebef] text-[#7d1530] border-[#f5b8c6]',
    ok: 'bg-[#e4f6f1] text-[#13513f] border-[#a9e2d3]',
  }[tone];
  const Icon = NOTICE_ICON[tone];
  return (
    <div role={tone === 'error' ? 'alert' : 'status'} className={`flex gap-3 rounded-box border px-4 py-3 ${styles} ${className}`}>
      <Icon className="mt-1 h-5 w-5 shrink-0" aria-hidden="true" />
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}

export function Loading({ label = '불러오는 중이에요…' }: { label?: string }) {
  return (
    <div className="flex min-h-[40vh] flex-col items-center justify-center gap-3" role="status" aria-live="polite">
      <span className="loading loading-dots loading-lg text-secondary-content" aria-hidden="true" />
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
        className="textarea textarea-lg w-full rounded-box border-2 border-base-300 bg-white text-[17px] leading-relaxed focus:border-primary-content"
      />
      <p id={`${id}-count`} className={`text-right text-[15px] ${enough ? 'text-declass' : 'text-ink-soft'}`}>
        {minLength && enough && <Check className="mr-1 inline h-4 w-4" aria-hidden="true" />}
        {minLength ? (enough ? `${n}자 — 충분해요` : `${n}자 / 최소 ${minLength}자`) : `${n}자`} · 최대 {maxLength}자
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
        className="input input-lg h-12 w-full border-2 border-base-300 bg-white text-[18px] focus:border-primary-content"
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
      className="modal modal-bottom sm:modal-middle"
      // 화면 코드가 닫은 경우(open=false)는 무시하고, 사용자가 Esc·바깥 누르기로 닫았을 때만 알린다.
      onClose={() => {
        if (openRef.current) onClose();
      }}
    >
      <div className="modal-box flex flex-col gap-4 text-ink">
        <h2 id={titleId} className="typewriter text-xl font-bold">
          {title}
        </h2>
        {children}
      </div>
      <form method="dialog" className="modal-backdrop">
        <button type="submit" aria-label="닫기">
          닫기
        </button>
      </form>
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
  return (
    <span role="status" aria-live="polite" className="inline-flex items-center gap-1 text-[15px]">
      {status === 'saving' && (
        <>
          <LoaderCircle className="h-4 w-4 animate-spin text-ink-soft" aria-hidden="true" />
          <span className="text-ink-soft">저장 중…</span>
        </>
      )}
      {status === 'saved' && (
        <>
          <CircleCheck className="h-4 w-4 text-declass" aria-hidden="true" />
          <span className="text-declass">자동 저장됨</span>
        </>
      )}
      {status === 'error' && (
        <>
          <CircleAlert className="h-4 w-4 text-stamp" aria-hidden="true" />
          <span className="font-bold text-stamp">저장 못 함 — 인터넷을 확인해 주세요</span>
        </>
      )}
    </span>
  );
}
