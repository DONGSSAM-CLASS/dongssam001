/**
 * 6차시 모둠 프로젝트 화면 부품
 */
import { useCallback, useEffect, useId, useRef, useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Check, Lock, PencilLine, Star, type LucideIcon } from 'lucide-react';
import { LinkButton, Notice, SaveBadge } from './ui';
import { onRadioKeyDown, radioTabIndex } from './radioKeys';
import { ACTIVITY_LABEL, ACTIVITY_OPENS } from '../data/project';
import type { ActivityId } from '../types/content';
import { countChars } from '../lib/progress';
import type { SaveStatus } from '../lib/useDraftSaver';

/** 활동 화면 제목 + 목록으로 돌아가기 */
export function ActivityHeader({
  icon: Icon,
  activity,
  title,
  children,
}: {
  icon: LucideIcon;
  activity: ActivityId;
  title?: string;
  children?: ReactNode;
}) {
  return (
    <div className="mb-5 flex flex-col gap-2">
      <Link to="/play" className="link inline-flex w-fit items-center gap-1 text-[15px] text-ink-soft">
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        6차시 로드맵
      </Link>
      <p className="w-fit rounded-full bg-accent px-3 py-0.5 text-[15px] font-bold text-accent-content">
        {ACTIVITY_OPENS[activity]}차시부터
      </p>
      <h1 className="typewriter flex items-center gap-2 text-2xl font-bold">
        <Icon className="h-7 w-7 text-declass" aria-hidden="true" />
        {title ?? ACTIVITY_LABEL[activity].name}
      </h1>
      {children && <div className="text-ink-soft">{children}</div>}
    </div>
  );
}

/** 아직 열리지 않은 활동 */
export function ActivityLocked({ activity }: { activity: ActivityId }) {
  return (
    <Notice tone="warn">
      <p className="font-bold">
        <Lock className="mr-1 inline h-4 w-4" aria-hidden="true" />
        {ACTIVITY_LABEL[activity].name}은(는) {ACTIVITY_OPENS[activity]}차시에 열려요.
      </p>
      <p>선생님이 수업을 {ACTIVITY_OPENS[activity]}차시로 넘기면 바로 쓸 수 있어요.</p>
      <div className="mt-3">
        <LinkButton to="/play" variant="secondary">
          6차시 로드맵으로
        </LinkButton>
      </div>
    </Notice>
  );
}

/** 모둠이 없을 때 */
export function NeedGroup() {
  return (
    <Notice tone="info">
      <p className="font-bold">먼저 모둠을 골라 주세요.</p>
      <p>모둠이 함께 쓰는 활동이에요. ‘우리 모둠’에서 모둠을 고르면 쓸 수 있어요.</p>
      <div className="mt-3">
        <LinkButton to="/play/team">우리 모둠으로</LinkButton>
      </div>
    </Notice>
  );
}

/** 섹션 상자 */
export function Section({
  title,
  icon: Icon,
  children,
  id,
  aside,
}: {
  title: string;
  icon?: LucideIcon;
  children: ReactNode;
  id?: string;
  aside?: ReactNode;
}) {
  const hid = useId();
  return (
    <section id={id} aria-labelledby={hid} className="dossier flex scroll-mt-20 flex-col gap-4 p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 id={hid} className="typewriter flex items-center gap-2 text-xl font-bold">
          {Icon && <Icon className="h-6 w-6 text-primary-content" aria-hidden="true" />}
          {title}
        </h2>
        {aside}
      </div>
      {children}
    </section>
  );
}

/**
 * 모둠원이 함께 쓰는 글 칸.
 *  - 입력을 멈추고 2초 뒤에 저장 (Firestore 쓰기·읽기 횟수를 줄이기 위해)
 *  - 내가 쓰고 있지 않을 때는 친구가 저장한 글이 바로 보인다
 */
export function SharedText({
  label,
  hint,
  value,
  maxLength,
  minLength,
  rows = 3,
  starters,
  onSave,
  disabled = false,
  who,
}: {
  label: string;
  hint?: string;
  value: string;
  maxLength: number;
  minLength?: number;
  rows?: number;
  starters?: string[];
  onSave: (text: string) => Promise<void>;
  disabled?: boolean;
  /** 주로 쓰는 역할 이름 (안내용) */
  who?: string;
}) {
  const id = useId();
  const [draft, setDraft] = useState(value);
  const [status, setStatus] = useState<SaveStatus>('idle');
  const dirty = useRef(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const saveRef = useRef(onSave);
  saveRef.current = onSave;
  const latest = useRef(draft);
  latest.current = draft;

  // 친구가 고친 글: 내가 쓰는 중이 아니면 바로 반영
  useEffect(() => {
    if (!dirty.current) setDraft(value);
  }, [value]);

  const flush = useCallback(async () => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
    if (!dirty.current) return;
    const text = latest.current;
    setStatus('saving');
    try {
      await saveRef.current(text);
      if (latest.current === text) dirty.current = false;
      setStatus('saved');
    } catch {
      setStatus('error');
    }
  }, []);

  useEffect(
    () => () => {
      void flush();
    },
    [flush],
  );

  const change = (v: string) => {
    const next = v.slice(0, maxLength);
    setDraft(next);
    dirty.current = true;
    setStatus('saving');
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => void flush(), 2000);
  };

  const n = countChars(draft);
  const enough = minLength ? n >= minLength : true;
  const single = rows <= 1;
  const inputClass =
    'w-full rounded-box border-2 border-base-300 bg-white text-[17px] leading-relaxed focus:border-primary-content disabled:bg-base-200';
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <label htmlFor={id} className="font-bold">
          {label}
          {who && <span className="ml-2 text-[14px] font-normal text-ink-soft">· {who}</span>}
        </label>
        <SaveBadge status={status} />
      </div>
      {hint && (
        <p id={`${id}-hint`} className="text-[15px] text-ink-soft">
          {hint}
        </p>
      )}
      {single ? (
        <input
          id={id}
          value={draft}
          maxLength={maxLength}
          disabled={disabled}
          aria-describedby={`${hint ? `${id}-hint ` : ''}${id}-count`}
          onChange={(e) => change(e.target.value)}
          onBlur={() => void flush()}
          className={`input input-lg h-12 ${inputClass}`}
        />
      ) : (
        <textarea
          id={id}
          value={draft}
          rows={rows}
          maxLength={maxLength}
          disabled={disabled}
          aria-describedby={`${hint ? `${id}-hint ` : ''}${id}-count`}
          onChange={(e) => change(e.target.value)}
          onBlur={() => void flush()}
          className={`textarea textarea-lg ${inputClass}`}
        />
      )}
      <p id={`${id}-count`} className={`text-right text-[14px] ${minLength && enough ? 'text-declass' : 'text-ink-soft'}`}>
        {minLength ? (enough ? `${n}자 — 좋아요` : `${n}자 / 최소 ${minLength}자`) : `${n}자`} · 최대 {maxLength}자
      </p>
      {starters && !disabled && (
        <div className="flex flex-wrap items-center gap-2">
          <PencilLine className="h-4 w-4 text-ink-soft" aria-hidden="true" />
          {starters.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => change(draft.trimEnd() ? `${draft.trimEnd()}\n${s} ` : `${s} `)}
              className="btn btn-sm h-auto min-h-10 rounded-full border-base-300 bg-white px-3 text-[15px] font-medium hover:bg-accent"
            >
              {s} …
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/** 여러 개 고르기 (최대 개수까지). 단추마다 aria-pressed */
export function ChipPicker<T extends string>({
  label,
  items,
  selected,
  max,
  onChange,
  disabled = false,
}: {
  label: string;
  items: { id: T; label: ReactNode; sub?: ReactNode }[];
  selected: T[];
  max: number;
  onChange: (next: T[]) => void;
  disabled?: boolean;
}) {
  const hid = useId();
  const full = selected.length >= max;
  return (
    <div role="group" aria-labelledby={hid} className="flex flex-col gap-2">
      <p id={hid} className="font-bold">
        {label} <span className="font-normal text-ink-soft">({selected.length}/{max})</span>
      </p>
      <div className="flex flex-wrap gap-2">
        {items.map((it) => {
          const on = selected.includes(it.id);
          return (
            <button
              key={it.id}
              type="button"
              aria-pressed={on}
              disabled={disabled || (!on && full)}
              onClick={() => onChange(on ? selected.filter((x) => x !== it.id) : [...selected, it.id])}
              className={`btn h-auto min-h-11 justify-start rounded-2xl px-3 py-2 text-left text-[16px] font-medium ${
                on ? 'border-primary-content bg-primary text-primary-content' : 'border-base-300 bg-white hover:bg-base-200'
              }`}
            >
              {on && <Check className="h-4 w-4 shrink-0" aria-hidden="true" />}
              <span className="flex flex-col">
                <span>{it.label}</span>
                {it.sub && <span className="text-[14px] font-normal opacity-80">{it.sub}</span>}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

/** 별 1~3개 고르기 (라디오 묶음) */
export function StarRadio({
  label,
  levels,
  value,
  onChange,
}: {
  label: string;
  levels: [string, string, string];
  value: 1 | 2 | 3 | null;
  onChange: (v: 1 | 2 | 3) => void;
}) {
  const hid = useId();
  const items: (1 | 2 | 3)[] = [1, 2, 3];
  return (
    <div className="flex flex-col gap-1">
      <p id={hid} className="font-bold">
        {label}
      </p>
      <div
        role="radiogroup"
        aria-labelledby={hid}
        className="flex flex-wrap gap-2"
        onKeyDown={(e) => onRadioKeyDown(e, items, value, onChange)}
      >
        {items.map((n, i) => (
          <button
            key={n}
            type="button"
            role="radio"
            aria-checked={value === n}
            tabIndex={radioTabIndex(value, n, i)}
            onClick={() => onChange(n)}
            className={`btn h-auto min-h-11 rounded-2xl px-3 py-1.5 text-[15px] font-medium ${
              value === n ? 'border-primary-content bg-primary text-primary-content' : 'border-base-300 bg-white hover:bg-base-200'
            }`}
          >
            <span className="flex" aria-hidden="true">
              {items.map((k) => (
                <Star key={k} className={`h-4 w-4 ${k <= n ? 'fill-current' : 'opacity-30'}`} />
              ))}
            </span>
            {levels[i]}
          </button>
        ))}
      </div>
    </div>
  );
}

/** 별점 평균 표시 */
export function StarMean({ value }: { value: number }) {
  return (
    <span className="inline-flex items-center gap-1" aria-label={`평균 별 ${value}개`}>
      <Star className="h-4 w-4 fill-[#f5b301] text-[#b7791f]" aria-hidden="true" />
      <strong>{value ? value.toFixed(1) : '-'}</strong>
    </span>
  );
}
