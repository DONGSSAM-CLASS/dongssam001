import { useId } from 'react';
import { EMOTIONS, EMOTION_PROMPT } from '../data/emotions';
import type { EmotionId } from '../types/content';

/** 감정 체크 (K-SEL 자기인식·관리) — 선택 전에 인물의 마음 고르기 */
export function EmotionPicker({
  value,
  onChange,
  disabled,
  characterName,
}: {
  value: EmotionId | null;
  onChange: (v: EmotionId) => void;
  disabled?: boolean;
  characterName: string;
}) {
  const id = useId();
  return (
    <fieldset className="flex flex-col gap-2" disabled={disabled}>
      <legend id={id} className="mb-2 text-[18px] font-bold">
        ① {EMOTION_PROMPT} <span className="font-normal text-ink-soft">({characterName}의 마음을 골라 보세요)</span>
      </legend>
      <div className="grid grid-cols-5 gap-1.5 sm:gap-2" role="radiogroup" aria-labelledby={id}>
        {EMOTIONS.map((e) => {
          const on = value === e.id;
          return (
            <button
              key={e.id}
              type="button"
              role="radio"
              aria-checked={on}
              onClick={() => onChange(e.id)}
              className={`flex min-h-20 flex-col items-center justify-center rounded-lg border-2 px-1 py-2 transition-colors ${
                on ? 'border-ch-900 bg-ch-100 font-bold' : 'border-line bg-white hover:bg-paper'
              }`}
            >
              <span className="text-3xl" aria-hidden="true">
                {e.emoji}
              </span>
              <span className="text-[16px]">{e.label}</span>
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}
