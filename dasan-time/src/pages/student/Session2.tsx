import { useEffect, useState } from 'react';
import { Lock, NotebookPen, PenLine, Scale, Sparkles, Users } from 'lucide-react';
import { useData } from '../../app/DataContext';
import { meetsRequirements, useActivity } from '../../lib/useActivity';
import ActivityShell from '../../components/ActivityShell';
import AutoSaveField from '../../components/AutoSaveField';
import RubricCard from '../../components/RubricCard';
import StepNav from '../../components/StepNav';
import HelpTooltip from '../../components/HelpTooltip';
import ReadAloudButton from '../../components/ReadAloudButton';
import ExampleToggle from '../../components/ExampleToggle';
import SaveBadge from '../../components/SaveBadge';
import { Loading } from '../../components/States';
import {
  CHOSEO_INTRO,
  MOOD_EMOJIS,
  REFLECT_FIELDS,
  S2_A4_3,
  S2_COMPARE_COLS,
  S2_COMPARE_ROWS,
  S2_INTRO_CARDS,
  SESSION_BY_KEY,
  UI_TEXT,
} from '../../content/lessons';
import type { GroupBoard } from '../../lib/types';
import type { SaveState } from '../../lib/useActivity';

const STEPS = ['도입', '활동4-1', '활동4-2', '활동4-3', '성찰일지'];

export default function Session2() {
  const [step, setStep] = useState(0);
  const { cls, loading } = useData();

  if (loading || !cls) return <Loading />;
  if (cls.sessions.s2 === 'locked') {
    return (
      <div className="card rounded-2xl bg-base-100 shadow-sm">
        <div className="card-body items-center text-center">
          <Lock className="h-10 w-10 opacity-50" aria-hidden />
          <p className="text-lg font-bold">{UI_TEXT.locked}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <header>
        <p className="badge badge-secondary rounded-2xl">2차시</p>
        <h1 className="mt-2 text-2xl font-extrabold">
          <HelpTooltip term="알고리즘">알고리즘</HelpTooltip>의 노예 vs{' '}
          <HelpTooltip term="초서">초서(鈔書)</HelpTooltip>의 주인
        </h1>
        <p className="mt-1 opacity-80">{SESSION_BY_KEY.s2.goal}</p>
      </header>

      <RubricCard sessionKey="s2" />
      <StepNav steps={STEPS} current={step} onChange={setStep} color="secondary" />

      {step === 0 && <Intro />}
      {step === 1 && <Activity41 />}
      {step === 2 && <Activity42 />}
      {step === 3 && <Activity43 />}
      {step === 4 && <Reflect2 />}
    </div>
  );
}

/* ------------------------------ 도입 ------------------------------ */

function Intro() {
  const spoken = S2_INTRO_CARDS.map((c) => `${c.title}. ${c.body}`).join(' ');
  return (
    <section className="card rounded-2xl bg-base-100 shadow-sm">
      <div className="card-body gap-3 p-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="card-title text-lg">
            <HelpTooltip term="숏폼">숏폼</HelpTooltip>은 왜 멈추기 어려울까?
          </h2>
          <ReadAloudButton text={spoken} />
        </div>
        <p className="text-sm opacity-80">
          숏폼이 나쁘다는 이야기가 아니에요. 스스로 멈추기 어려운 <b>구조</b>를 함께 살펴봐요.
        </p>
        <div className="grid gap-3 sm:grid-cols-3">
          {S2_INTRO_CARDS.map((card) => (
            <div key={card.title} className="rounded-2xl bg-secondary/10 p-4">
              <p className="font-extrabold text-secondary">{card.title}</p>
              <p className="mt-1 text-sm">{card.body}</p>
            </div>
          ))}
        </div>
        <p className="rounded-2xl bg-base-200 p-3 text-sm">
          <HelpTooltip term="무한 스크롤">무한 스크롤</HelpTooltip>과{' '}
          <HelpTooltip term="알고리즘">알고리즘</HelpTooltip>을 알면, 내가 멈출 지점을 내가 정할 수
          있어요.
        </p>
      </div>
    </section>
  );
}

/* --------------- 활동 4-1. 숏폼의 뇌 vs 다산의 뇌 (모둠) --------------- */

function Activity41() {
  const { api, group, displayName } = useData();
  const [board, setBoard] = useState<GroupBoard | null>(null);
  const [saveState, setSaveState] = useState<SaveState>('idle');
  const [local, setLocal] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState(false);

  useEffect(() => {
    if (!api) return;
    return api.watchGroupBoard('s2_a4_1', group, (next) => {
      setBoard(next);
      // 내가 아직 손대지 않았을 때만 다른 모둠원의 내용을 그대로 받는다.
      if (!touched) setLocal(next.cells);
    });
  }, [api, group, touched]);

  useEffect(() => {
    if (!touched || !api) return;
    setSaveState('saving');
    const id = setTimeout(async () => {
      try {
        await api.saveGroupBoard('s2_a4_1', group, { cells: local }, displayName);
        setSaveState('saved');
      } catch {
        setSaveState('error');
      }
    }, 1500);
    return () => clearTimeout(id);
  }, [local, touched, api, group, displayName]);

  function cellKey(rowId: string, colId: string) {
    return `${rowId}__${colId}`;
  }

  return (
    <section className="card rounded-2xl bg-base-100 shadow-sm">
      <div className="card-body gap-4 p-4 sm:p-6">
        <header className="flex flex-wrap items-start justify-between gap-2">
          <h2 className="card-title text-lg">
            <Scale className="h-5 w-5 text-secondary" aria-hidden />
            활동 4-1 · 「숏폼의 뇌 vs 다산의 뇌」 모둠 탐구표
            <span className="badge badge-ghost rounded-2xl">{group}모둠</span>
          </h2>
          <SaveBadge state={saveState} />
        </header>
        <p className="text-sm opacity-80">
          모둠이 한 장을 함께 써요. 누구나 고칠 수 있고, 마지막에 고친 사람이 아래에 보여요.
        </p>

        {/*
          비교표. 표 구조와 카드 구조를 따로 두면 입력칸이 화면에 두 번 생기므로,
          `md:contents` 로 한 벌만 두고 넓은 화면에서만 3열로 배치한다.
        */}
        <div className="md:grid md:grid-cols-[12rem_minmax(0,1fr)_minmax(0,1fr)] md:gap-3">
          <p className="hidden text-sm font-semibold opacity-70 md:block">비교 기준</p>
          {S2_COMPARE_COLS.map((col) => (
            <p key={col.id} className="hidden text-sm font-semibold opacity-70 md:block">
              {col.label}
            </p>
          ))}

          {S2_COMPARE_ROWS.map((row) => (
            <div key={row.id} className="mb-4 rounded-2xl bg-base-200 p-4 md:contents">
              <p className="font-bold md:rounded-2xl md:bg-base-200 md:p-3">{row.label}</p>
              {S2_COMPARE_COLS.map((col) => (
                <div key={col.id} className="mt-3 md:mt-0">
                  <p className="mb-1 text-sm font-semibold md:hidden">{col.label}</p>
                  <CellInput
                    value={local[cellKey(row.id, col.id)] ?? ''}
                    hint={col.id === 'shortform' ? row.hintShort : row.hintDasan}
                    label={`${row.label} · ${col.label}`}
                    onChange={(v) => {
                      setTouched(true);
                      setLocal((prev) => ({ ...prev, [cellKey(row.id, col.id)]: v }));
                    }}
                  />
                </div>
              ))}
            </div>
          ))}
        </div>

        {board?.lastEditor && (
          <p className="flex items-center gap-1 text-xs opacity-70">
            <Users className="h-4 w-4" aria-hidden />
            마지막으로 고친 사람: {board.lastEditor}
          </p>
        )}
      </div>
    </section>
  );
}

function CellInput({
  value,
  hint,
  label,
  onChange,
}: {
  value: string;
  hint: string;
  label: string;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <textarea
        className="textarea textarea-bordered w-full rounded-2xl text-base"
        rows={3}
        maxLength={500}
        value={value}
        aria-label={label}
        placeholder="여기에 적어 봐요."
        onChange={(e) => onChange(e.target.value)}
      />
      <p className="mt-1 flex items-start gap-1 text-xs opacity-70">
        <Sparkles className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
        생각 도우미: {hint}
      </p>
    </div>
  );
}

/* --------------------------- 활동 4-2. 초서 --------------------------- */

function Activity42() {
  const draft = useActivity('s2_a4_2');
  const values = draft.values as Record<string, string>;

  const canSubmit = meetsRequirements(draft.values, [
    { key: 'page', minLength: 1 },
    { key: 'quote', minLength: 10 },
    { key: 'thought', minLength: 5 },
  ]);

  return (
    <ActivityShell
      title="활동 4-2 · 초서(鈔書) 실습"
      icon={<PenLine className="h-5 w-5 text-secondary" aria-hidden />}
      intro={CHOSEO_INTRO.body}
      draft={draft}
      canSubmit={canSubmit}
    >
      <div className="rounded-2xl bg-secondary/10 p-4">
        <p className="font-extrabold text-secondary">{CHOSEO_INTRO.title}</p>
        <p className="mt-1 text-sm">{CHOSEO_INTRO.body}</p>
      </div>

      <label className="form-control w-full">
        <span className="label-text mb-1 font-bold">
          ① 교과서에서 고른 쪽수 <span className="text-error">*</span>
        </span>
        <input
          className="input input-bordered w-40 rounded-2xl"
          placeholder="예) 152쪽"
          value={values.page ?? ''}
          disabled={draft.locked}
          onChange={(e) => draft.setValue('page', e.target.value)}
        />
      </label>

      <AutoSaveField
        label="② 옮겨 적은 한 단락 (1~3문장)"
        help="눈으로 읽고, 손으로 직접 옮겨 적어요. 붙여넣기는 막아 두었어요."
        value={values.quote ?? ''}
        onChange={(v) => draft.setValue('quote', v)}
        minLength={10}
        required
        rows={4}
        blockPaste
        disabled={draft.locked}
      />
      <ExampleToggle example="조선 후기에는 농업 기술이 발전하면서 상품 작물을 기르는 농민이 늘어났다." />

      <AutoSaveField
        label="③ 여기에 덧붙인 내 생각 한 줄"
        help="왜 이 부분을 골랐는지, 무엇이 떠올랐는지 적어요."
        example="농민이 직접 무엇을 기를지 골랐다는 점이, 내 시간을 내가 고르는 것과 닮았어요."
        value={values.thought ?? ''}
        onChange={(v) => draft.setValue('thought', v)}
        minLength={5}
        required
        rows={2}
        disabled={draft.locked}
      />
    </ActivityShell>
  );
}

/* ------------------------ 활동 4-3. 서답형 ------------------------ */

function Activity43() {
  const draft = useActivity('s2_a4_3');
  const values = draft.values as Record<string, string>;
  const canSubmit = meetsRequirements(draft.values, [
    { key: 'answer', minLength: S2_A4_3.minLength },
  ]);

  return (
    <ActivityShell
      title="활동 4-3 · 시간의 주도성, 내 말로 설명하기"
      icon={<Sparkles className="h-5 w-5 text-secondary" aria-hidden />}
      intro="배운 말을 그대로 옮기지 말고, 내 말로 바꿔서 설명해 봐요."
      draft={draft}
      canSubmit={canSubmit}
    >
      <p className="rounded-2xl bg-secondary/10 p-4 font-bold">
        {S2_A4_3.question.replace('시간의 주도성', '시간의 주도성')}
      </p>
      <AutoSaveField
        label="내 설명"
        help={S2_A4_3.help}
        example={S2_A4_3.example}
        value={values.answer ?? ''}
        onChange={(v) => draft.setValue('answer', v)}
        starters={[...S2_A4_3.starters]}
        minLength={S2_A4_3.minLength}
        required
        rows={6}
        disabled={draft.locked}
      />
    </ActivityShell>
  );
}

/* ---------------------------- 2차시 성찰일지 ---------------------------- */

function Reflect2() {
  const draft = useActivity('s2_reflect');
  const values = draft.values as Record<string, string | number>;
  const fields = REFLECT_FIELDS.s2;

  const canSubmit =
    meetsRequirements(
      draft.values,
      fields.map((f) => ({ key: f.id, minLength: 5 })),
    ) && Boolean(values.mood);

  return (
    <ActivityShell
      title="2차시 성찰일지"
      icon={<NotebookPen className="h-5 w-5 text-secondary" aria-hidden />}
      intro="오늘 하루 중에서 내가 주인이었던 순간을 떠올려 봐요."
      draft={draft}
      canSubmit={canSubmit}
    >
      {fields.map((f) => (
        <AutoSaveField
          key={f.id}
          label={f.label}
          example={f.example}
          value={(values[f.id] as string) ?? ''}
          onChange={(v) => draft.setValue(f.id, v)}
          minLength={5}
          required
          rows={2}
          disabled={draft.locked}
        />
      ))}
      <fieldset className="rounded-2xl bg-base-200 p-4">
        <legend className="px-1 font-bold">오늘 기분</legend>
        <div className="flex flex-wrap justify-center gap-2">
          {MOOD_EMOJIS.map((m) => (
            <button
              key={m.id}
              type="button"
              className={`btn h-auto min-h-16 flex-col gap-0.5 rounded-2xl px-4 ${
                values.mood === m.id ? 'btn-secondary' : 'btn-outline'
              }`}
              aria-pressed={values.mood === m.id}
              aria-label={m.label}
              disabled={draft.locked}
              onClick={() => draft.setValue('mood', m.id)}
            >
              <span className="text-2xl" aria-hidden>
                {m.emoji}
              </span>
              <span className="text-xs">{m.label}</span>
            </button>
          ))}
        </div>
      </fieldset>
    </ActivityShell>
  );
}
