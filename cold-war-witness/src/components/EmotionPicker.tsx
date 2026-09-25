import { useId } from 'react';
import { HeartPulse } from 'lucide-react';
import { EMOTIONS, EMOTION_PROMPT } from '../data/emotions';
import type { EmotionId } from '../types/content';
import { onRadioKeyDown, radioTabIndex } from './radioKeys';

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
      <legend id={id} className="mb-2 flex flex-wrap items-center gap-x-2 text-[18px] font-bold">
        <span className="badge badge-secondary h-7 w-7 rounded-full p-0 text-[15px]">1</span>
        <HeartPulse className="h-5 w-5 text-stamp" aria-hidden="true" />
        {EMOTION_PROMPT} <span className="font-normal text-ink-soft">({characterName}의 마음을 골라 보세요)</span>
      </legend>
      <div
        className="grid grid-cols-5 gap-1 sm:gap-2"
        role="radiogroup"
        aria-labelledby={id}
        onKeyDown={(e) => onRadioKeyDown(e, EMOTIONS.map((x) => x.id), value, onChange)}
      >
        {EMOTIONS.map((e, i) => {
          const on = value === e.id;
          return (
            <button
              key={e.id}
              type="button"
              role="radio"
              aria-checked={on}
              tabIndex={radioTabIndex(value, e.id, i)}
              onClick={() => onChange(e.id)}
              className={`flex min-h-20 flex-col items-center justify-center rounded-box border-2 px-0.5 py-2 transition-all ${
                on ? 'scale-105 border-secondary-content bg-secondary font-bold shadow-sm' : 'border-base-300 bg-white hover:bg-base-200'
              }`}
            >
              <span className="text-3xl" aria-hidden="true">
                {e.emoji}
              </span>
              <span className="whitespace-nowrap text-[16px]">{e.label}</span>
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}
