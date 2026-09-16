import { useId, useRef } from 'react';
import ExampleToggle from './ExampleToggle';
import SentenceStarter from './SentenceStarter';
import { CHOSEO_INTRO, MAX_FIELD_LENGTH_HINT } from '../content/uiLimits';

/**
 * 활동지의 글쓰기 칸.
 * 입력이 멈춘 뒤 자동 저장되는 것은 useActivity 훅이 맡고, 여기는 화면만 맡는다.
 */
export default function AutoSaveField({
  label,
  help,
  example,
  value,
  onChange,
  starters,
  minLength = 0,
  required = false,
  rows = 3,
  disabled = false,
  blockPaste = false,
  placeholder,
}: {
  label: string;
  help?: string;
  example?: string;
  value: string;
  onChange: (next: string) => void;
  starters?: string[];
  minLength?: number;
  required?: boolean;
  rows?: number;
  disabled?: boolean;
  /** 초서 실습처럼 직접 써야 하는 칸은 붙여넣기를 막는다. */
  blockPaste?: boolean;
  placeholder?: string;
}) {
  const id = useId();
  const ref = useRef<HTMLTextAreaElement>(null);
  const pasteWarn = useRef<HTMLParagraphElement>(null);

  const tooShort = required && value.trim().length > 0 && value.trim().length < minLength;

  return (
    <div className="form-control w-full">
      <label className="label px-0 pb-1" htmlFor={id}>
        <span className="label-text text-base font-bold">
          {label}
          {required && <span className="ml-1 text-error" aria-label="꼭 써야 하는 칸">*</span>}
        </span>
      </label>
      {help && <p className="mb-2 text-sm opacity-75">{help}</p>}
      <textarea
        id={id}
        ref={ref}
        className="textarea textarea-bordered w-full rounded-2xl text-base leading-relaxed"
        rows={rows}
        value={value}
        maxLength={MAX_FIELD_LENGTH_HINT}
        disabled={disabled}
        placeholder={placeholder ?? '여기에 적어 봐요.'}
        aria-describedby={tooShort ? `${id}-hint` : undefined}
        onChange={(e) => onChange(e.target.value)}
        onPaste={
          blockPaste
            ? (e) => {
                e.preventDefault();
                if (pasteWarn.current) {
                  pasteWarn.current.hidden = false;
                }
              }
            : undefined
        }
      />
      {blockPaste && (
        <p ref={pasteWarn} hidden className="mt-1 text-sm font-semibold text-warning">
          {CHOSEO_INTRO.pasteBlockedMessage}
        </p>
      )}
      <div className="mt-1 flex flex-wrap items-center justify-between gap-2">
        {tooShort ? (
          <p id={`${id}-hint`} className="text-sm text-warning">
            {minLength}자 이상 적어 볼까요? (지금 {value.trim().length}자)
          </p>
        ) : (
          <span />
        )}
        <span className="text-xs opacity-60">{value.length}자</span>
      </div>
      {starters && starters.length > 0 && !disabled && (
        <SentenceStarter
          starters={starters}
          onPick={(text) => {
            const next = value ? `${value.replace(/\s*$/, '')} ${text}` : text;
            onChange(next.slice(0, MAX_FIELD_LENGTH_HINT));
            ref.current?.focus();
          }}
        />
      )}
      {example && <ExampleToggle example={example} />}
    </div>
  );
}
