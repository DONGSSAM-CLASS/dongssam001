import { useId } from 'react';
import { TextArea } from './ui';
import { countChars } from '../lib/progress';

/**
 * 질문 + 문장 시작 도우미 + 쓰기 칸.
 * 도우미 단추를 누르면 그 말로 글을 시작할 수 있다. (이미 쓴 글이 있으면 새 줄에 붙는다)
 */
export function WritingBox({
  label,
  hint,
  starters,
  value,
  onChange,
  onBlur,
  minLength,
  maxLength,
  chips,
}: {
  label: string;
  hint?: string;
  starters: string[];
  value: string;
  onChange: (v: string) => void;
  onBlur?: () => void;
  minLength?: number;
  maxLength: number;
  chips?: React.ReactNode;
}) {
  const hintId = useId();
  const add = (s: string) => {
    const base = value.trimEnd();
    const next = base ? `${base}\n${s} ` : `${s} `;
    onChange(next.slice(0, maxLength));
  };
  return (
    <div className="flex flex-col gap-3">
      {chips}
      <TextArea
        label={label}
        value={value}
        onChange={onChange}
        onBlur={onBlur}
        maxLength={maxLength}
        minLength={minLength}
        count={countChars(value)}
        describedBy={hint ? hintId : undefined}
      />
      {hint && (
        <p id={hintId} className="-mt-1 text-[15px] text-ink-soft">
          💡 {hint}
        </p>
      )}
      <div>
        <p className="text-[15px] font-bold text-ink-soft">✏️ 막히면 이렇게 시작해 보세요 (누르면 칸에 들어가요)</p>
        <div className="mt-1 flex flex-wrap gap-2">
          {starters.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => add(s)}
              className="min-h-10 rounded-full border border-line bg-white px-3 text-[15px] hover:bg-paper"
            >
              {s} …
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
