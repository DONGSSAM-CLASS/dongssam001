import { useState } from 'react';
import { dataset, YEAR_MAX, YEAR_MIN } from '@/data';
import { formatYear, parseYearInput } from '@/lib/history';
import { useGlobeStore, type YearStep } from '@/store/globeStore';

const STEPS: YearStep[] = [100, 10, 1];

/** 연대 설정 슬라이더: 기원전 3000 ~ 서기 2000, 100/10/1년 정밀도, 직접 입력, 화살표, 사건 북마크 점프 */
export function Timeline() {
  const year = useGlobeStore((s) => s.year);
  const step = useGlobeStore((s) => s.step);
  const setYear = useGlobeStore((s) => s.setYear);
  const shiftYear = useGlobeStore((s) => s.shiftYear);
  const setStep = useGlobeStore((s) => s.setStep);
  const flyTo = useGlobeStore((s) => s.flyTo);
  const select = useGlobeStore((s) => s.select);
  const [text, setText] = useState(String(year));
  const [invalid, setInvalid] = useState(false);
  const [syncedYear, setSyncedYear] = useState(year);
  // 슬라이더·화살표로 연대가 바뀌면 입력창 텍스트를 동기화 (렌더 중 파생 상태 갱신 패턴)
  if (syncedYear !== year) {
    setSyncedYear(year);
    setText(String(year));
    setInvalid(false);
  }

  const bookmarks = dataset.events.filter((e) => e.bookmark).sort((a, b) => a.year - b.year);

  const commitText = () => {
    const y = parseYearInput(text);
    if (y === null || y < YEAR_MIN || y > YEAR_MAX) {
      setInvalid(true);
      return;
    }
    setInvalid(false);
    setYear(y);
  };

  const onKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // 접근성: 방향키 = 1단계, Shift+방향키 = 10단계, PageUp/Down = 100년
    if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
      e.preventDefault();
      const dir = e.key === 'ArrowLeft' ? -1 : 1;
      shiftYear(dir * step * (e.shiftKey ? 10 : 1));
    } else if (e.key === 'PageUp' || e.key === 'PageDown') {
      e.preventDefault();
      shiftYear(e.key === 'PageUp' ? 100 : -100);
    } else if (e.key === 'Home') {
      e.preventDefault();
      setYear(YEAR_MIN);
    } else if (e.key === 'End') {
      e.preventDefault();
      setYear(YEAR_MAX);
    }
  };

  return (
    <section aria-label="연대 설정" className="flex flex-col gap-2 rounded-2xl bg-slate-900/85 backdrop-blur px-4 py-3 border border-slate-700">
      <div className="flex flex-wrap items-center gap-2">
        <button type="button" className="btn-icon" aria-label={`${step}년 이전`} onClick={() => shiftYear(-step)}>◀</button>
        <output className="min-w-[8.5rem] text-center text-xl font-bold tabular-nums" aria-live="polite">{formatYear(year)}</output>
        <button type="button" className="btn-icon" aria-label={`${step}년 이후`} onClick={() => shiftYear(step)}>▶</button>

        <label className="ml-2 flex items-center gap-1 text-sm">
          <span className="sr-only">연도 직접 입력</span>
          <input
            className={`w-24 rounded-lg bg-slate-800 px-2 py-1 text-sm border ${invalid ? 'border-red-400' : 'border-slate-600'}`}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onBlur={commitText}
            onKeyDown={(e) => e.key === 'Enter' && commitText()}
            placeholder="-221 / 1453"
            aria-label="연도 직접 입력 (예: -221, 1453, 기원전 221)"
            aria-invalid={invalid}
          />
        </label>

        <div role="radiogroup" aria-label="정밀도" className="flex rounded-lg overflow-hidden border border-slate-600 text-xs">
          {STEPS.map((s) => (
            <button
              key={s}
              type="button"
              role="radio"
              aria-checked={step === s}
              onClick={() => setStep(s)}
              className={`px-2 py-1 ${step === s ? 'bg-amber-400 text-slate-900 font-bold' : 'bg-slate-800 text-slate-200 hover:bg-slate-700'}`}
            >
              {s}년
            </button>
          ))}
        </div>

        <label className="ml-auto flex items-center gap-1 text-xs">
          <span className="sr-only">주요 사건으로 이동</span>
          <select
            className="rounded-lg bg-slate-800 border border-slate-600 px-2 py-1 max-w-[14rem]"
            value=""
            onChange={(e) => {
              const ev = dataset.events.find((x) => x.id === e.target.value);
              if (!ev) return;
              setYear(ev.year);
              flyTo(ev.coords[0], ev.coords[1], 2.2);
              select({ kind: 'event', id: ev.id });
            }}
            aria-label="주요 사건 북마크로 점프"
          >
            <option value="">📌 주요 사건으로 이동…</option>
            {bookmarks.map((ev) => (
              <option key={ev.id} value={ev.id}>{formatYear(ev.year)} — {ev.name_ko}</option>
            ))}
          </select>
        </label>
      </div>

      <div className="flex items-center gap-2 text-[11px] text-slate-400">
        <span>기원전 3000</span>
        <input
          type="range"
          min={YEAR_MIN}
          max={YEAR_MAX}
          step={step}
          value={year}
          onChange={(e) => setYear(Number(e.target.value))}
          onKeyDown={onKey}
          className="flex-1 accent-amber-400 h-2 cursor-pointer"
          aria-label="연대 슬라이더"
          aria-valuetext={formatYear(year)}
        />
        <span>서기 2000</span>
      </div>
    </section>
  );
}
