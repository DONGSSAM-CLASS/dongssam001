import { useEffect, useMemo, useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Heart,
  Lock,
  NotebookPen,
  ScrollText,
  Smartphone,
  StickyNote,
  Users,
} from 'lucide-react';
import { useData } from '../../app/DataContext';
import { useActivity, meetsRequirements } from '../../lib/useActivity';
import ActivityShell from '../../components/ActivityShell';
import AutoSaveField from '../../components/AutoSaveField';
import RubricCard from '../../components/RubricCard';
import StepNav from '../../components/StepNav';
import HelpTooltip from '../../components/HelpTooltip';
import ReadAloudButton from '../../components/ReadAloudButton';
import WordCloud from '../../components/WordCloud';
import { Loading } from '../../components/States';
import {
  APP_KINDS,
  EMOTION_WORDS,
  S1_A3_GROUP,
  S1_A3_QUESTIONS,
  SAUIJAE_SOURCE,
  SCREEN_TIME_GUIDE,
  SENTENCE_STARTERS,
  SESSION_BY_KEY,
  STORY_CARDS,
  MOOD_EMOJIS,
  REFLECT_FIELDS,
  UI_TEXT,
} from '../../content/lessons';
import type { EmotionEntry, GroupBoard } from '../../lib/types';

const STEPS = ['도입', '활동1', '활동2', '활동3', '성찰일지'];

export default function Session1() {
  const [step, setStep] = useState(0);
  const session = SESSION_BY_KEY.s1;
  const { cls, loading } = useData();

  if (loading || !cls) return <Loading />;

  if (cls.sessions.s1 === 'locked') {
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
        <p className="badge badge-primary rounded-2xl">1차시</p>
        <h1 className="mt-2 text-2xl font-extrabold">단절의 두 얼굴</h1>
        <p className="mt-1 opacity-80">
          <HelpTooltip term="포모">포모(FOMO)</HelpTooltip>와{' '}
          <HelpTooltip term="유배">유배</HelpTooltip>, 두 가지 ‘끊김’을 살펴봐요.
        </p>
      </header>

      <RubricCard sessionKey="s1" />
      <StepNav steps={STEPS} current={step} onChange={setStep} color="primary" />

      {step === 0 && <Intro goal={session.goal} />}
      {step === 1 && <Activity1 />}
      {step === 2 && <Activity2 />}
      {step === 3 && <Activity3 />}
      {step === 4 && <Reflect1 />}
    </div>
  );
}

/* ------------------------------------------------------------------ */

function Intro({ goal }: { goal: string }) {
  const { cls } = useData();
  return (
    <section className="card rounded-2xl bg-base-100 shadow-sm">
      <div className="card-body gap-3 p-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="card-title text-lg">오늘의 목표</h2>
          <ReadAloudButton text={goal} />
        </div>
        <p className="text-base leading-relaxed">{goal}</p>

        {/* 통계 카드는 선생님이 값을 넣었을 때만 보여 준다. 숫자를 미리 넣어 두지 않는다. */}
        {cls?.statNote?.text && (
          <div className="rounded-2xl bg-info/10 p-4">
            <p className="font-semibold">{cls.statNote.text}</p>
            <p className="mt-1 text-xs opacity-70">
              출처: {cls.statNote.source} · {cls.statNote.period}
            </p>
          </div>
        )}
      </div>
    </section>
  );
}

/* ---------------------- 활동 1. 나의 스마트폰 성적표 ---------------------- */

interface TopApp {
  name: string;
  kind: string;
  minutes: string;
}

function Activity1() {
  const draft = useActivity('s1_a1');
  const values = draft.values as {
    hours?: string;
    minutes?: string;
    unknown?: boolean;
    apps?: TopApp[];
    thought?: string;
  };

  const apps: TopApp[] = values.apps ?? [
    { name: '', kind: '', minutes: '' },
    { name: '', kind: '', minutes: '' },
    { name: '', kind: '', minutes: '' },
  ];

  const canSubmit =
    (values.unknown === true || Boolean(values.hours)) &&
    meetsRequirements(draft.values, [{ key: 'thought', minLength: 5 }]);

  function setApp(index: number, patch: Partial<TopApp>) {
    const next = apps.map((a, i) => (i === index ? { ...a, ...patch } : a));
    draft.setValue('apps', next);
  }

  return (
    <ActivityShell
      title="활동 1 · 나의 스마트폰 성적표"
      icon={<Smartphone className="h-5 w-5 text-primary" aria-hidden />}
      intro="지난주에 스마트폰을 얼마나 썼는지 확인해 볼까요? 숫자를 보는 것만으로도 큰 걸음이에요."
      draft={draft}
      canSubmit={canSubmit}
    >
      <div className="alert rounded-2xl border border-primary/30 bg-primary/10" role="note">
        <Lock className="h-5 w-5 shrink-0 text-primary" aria-hidden />
        <span className="text-sm font-semibold">{UI_TEXT.privateNotice}</span>
      </div>

      {/* 기종별 찾아가는 방법 */}
      <div className="flex flex-col gap-2">
        <p className="text-sm font-bold">
          스마트폰 설정에서 ‘스크린 타임’(아이폰) 또는 ‘디지털 웰빙’(안드로이드)을 열어 보세요.
        </p>
        {SCREEN_TIME_GUIDE.map((guide) => (
          <div key={guide.device} className="collapse-arrow collapse rounded-2xl bg-base-200">
            <input type="checkbox" aria-label={`${guide.device} 찾는 방법 펼치기`} />
            <div className="collapse-title font-semibold">{guide.device} 찾는 방법</div>
            <div className="collapse-content">
              <ol className="list-inside list-decimal space-y-1 text-sm">
                {guide.steps.map((s) => (
                  <li key={s}>{s}</li>
                ))}
              </ol>
            </div>
          </div>
        ))}
      </div>

      {/* 하루 평균 사용 시간 */}
      <fieldset className="rounded-2xl bg-base-200 p-4">
        <legend className="px-1 font-bold">지난주 하루 평균 사용 시간</legend>
        <div className="flex flex-wrap items-center gap-2">
          <select
            className="select select-bordered rounded-2xl"
            aria-label="시간"
            value={values.hours ?? ''}
            disabled={draft.locked || values.unknown === true}
            onChange={(e) => draft.setValue('hours', e.target.value)}
          >
            <option value="">시간</option>
            {Array.from({ length: 13 }, (_, i) => (
              <option key={i} value={String(i)}>
                {i}시간
              </option>
            ))}
          </select>
          <select
            className="select select-bordered rounded-2xl"
            aria-label="분"
            value={values.minutes ?? ''}
            disabled={draft.locked || values.unknown === true}
            onChange={(e) => draft.setValue('minutes', e.target.value)}
          >
            <option value="">분</option>
            {['0', '10', '20', '30', '40', '50'].map((m) => (
              <option key={m} value={m}>
                {m}분
              </option>
            ))}
          </select>
        </div>
        <label className="label mt-3 cursor-pointer justify-start gap-3 px-0">
          <input
            type="checkbox"
            className="checkbox checkbox-primary"
            checked={values.unknown === true}
            disabled={draft.locked}
            onChange={(e) => draft.setValue('unknown', e.target.checked)}
          />
          <span className="label-text">잘 모르겠어요</span>
        </label>
        {values.unknown === true && (
          <p className="mt-1 text-sm opacity-80">평소 느낌으로 적어도 괜찮아요.</p>
        )}
      </fieldset>

      {/* 많이 쓴 앱 1~3위 */}
      <fieldset className="rounded-2xl bg-base-200 p-4">
        <legend className="px-1 font-bold">가장 많이 쓴 앱 1~3위</legend>
        <div className="flex flex-col gap-4">
          {apps.map((app, i) => (
            <div key={i} className="rounded-2xl bg-base-100 p-3">
              <p className="mb-2 font-semibold">{i + 1}위</p>
              <div className="flex flex-wrap gap-2">
                <input
                  className="input input-bordered grow rounded-2xl"
                  placeholder="앱 이름"
                  aria-label={`${i + 1}위 앱 이름`}
                  value={app.name}
                  disabled={draft.locked}
                  onChange={(e) => setApp(i, { name: e.target.value })}
                />
                <input
                  className="input input-bordered w-32 rounded-2xl"
                  placeholder="대략 시간"
                  aria-label={`${i + 1}위 앱 사용 시간`}
                  value={app.minutes}
                  disabled={draft.locked}
                  onChange={(e) => setApp(i, { minutes: e.target.value })}
                />
              </div>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {APP_KINDS.map((kind) => (
                  <button
                    key={kind}
                    type="button"
                    className={`btn btn-xs h-auto min-h-8 rounded-2xl ${
                      app.kind === kind ? 'btn-primary' : 'btn-outline'
                    }`}
                    disabled={draft.locked}
                    aria-pressed={app.kind === kind}
                    onClick={() => setApp(i, { kind: app.kind === kind ? '' : kind })}
                  >
                    {kind}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </fieldset>

      <AutoSaveField
        label="이 숫자를 보고 드는 생각"
        help="한 줄이면 충분해요. 솔직하게 적어 봐요."
        example="생각보다 훨씬 길어서 놀랐어요. 반으로 줄이고 싶어요."
        value={(values.thought as string) ?? ''}
        onChange={(v) => draft.setValue('thought', v)}
        minLength={5}
        required
        rows={2}
        disabled={draft.locked}
      />
    </ActivityShell>
  );
}

/* ------------------- 활동 2. 와이파이 없는 시골 방에서 3일 ------------------- */

function Activity2() {
  const draft = useActivity('s1_a2');
  const { api } = useData();
  const [emotions, setEmotions] = useState<EmotionEntry[]>([]);
  const values = draft.values as { picks?: string[]; own?: string; why?: string; shared?: boolean };
  const picks = values.picks ?? [];

  useEffect(() => {
    if (!api) return;
    return api.watchEmotions(setEmotions);
  }, [api]);

  const canSubmit =
    picks.length > 0 && meetsRequirements(draft.values, [{ key: 'why', minLength: 5 }]);

  function toggle(word: string) {
    if (draft.locked) return;
    if (picks.includes(word)) {
      draft.setValue('picks', picks.filter((w) => w !== word));
    } else if (picks.length < 3) {
      draft.setValue('picks', [...picks, word]);
    }
  }

  async function share() {
    if (!api) return;
    const words = [...picks, (values.own ?? '').trim()].filter(Boolean);
    await api.addEmotions(words);
    draft.setValue('shared', true);
  }

  return (
    <ActivityShell
      title="활동 2 · 와이파이 없는 시골 방에서 3일"
      icon={<Heart className="h-5 w-5 text-primary" aria-hidden />}
      intro="와이파이도, 데이터도 안 되는 시골 방에서 3일을 지내야 한다면? 마음속에 어떤 낱말이 떠오르나요?"
      draft={draft}
      canSubmit={canSubmit}
    >
      <div className="rounded-2xl bg-primary/10 p-4 text-center text-base font-bold">
        와이파이도, 데이터도 안 되는 시골 방에서 3일을 지내야 한다면?
      </div>

      <div>
        <p className="mb-2 font-bold">
          지금 드는 감정을 최대 3개까지 골라 봐요.{' '}
          <span className="text-sm font-normal opacity-70">({picks.length}/3)</span>
        </p>
        <div className="flex flex-wrap gap-2">
          {EMOTION_WORDS.map((word) => {
            const on = picks.includes(word);
            return (
              <button
                key={word}
                type="button"
                className={`btn btn-sm h-auto min-h-10 rounded-2xl ${on ? 'btn-primary' : 'btn-outline'}`}
                aria-pressed={on}
                disabled={draft.locked || (!on && picks.length >= 3)}
                onClick={() => toggle(word)}
              >
                {word}
              </button>
            );
          })}
        </div>
      </div>

      <label className="form-control w-full">
        <span className="label-text mb-1 font-bold">여기 없는 낱말이 있다면 직접 적어요 (1개)</span>
        <input
          className="input input-bordered w-full rounded-2xl"
          maxLength={20}
          value={values.own ?? ''}
          disabled={draft.locked}
          placeholder="예) 낯설어요"
          onChange={(e) => draft.setValue('own', e.target.value)}
        />
      </label>

      <div className="rounded-2xl bg-base-200 p-4">
        <p className="font-bold">학급 감정 지도</p>
        <p className="mb-3 text-sm opacity-75">
          고른 낱말은 <b>이름 없이</b> 올라가요. 누가 골랐는지는 아무도 알 수 없어요.
        </p>
        <button
          type="button"
          className="btn btn-primary btn-sm mb-3 rounded-2xl"
          disabled={draft.locked || picks.length === 0}
          onClick={() => void share()}
        >
          {values.shared ? '다시 올리기' : '학급 감정 지도에 올리기'}
        </button>
        <WordCloud items={emotions} />
      </div>

      <AutoSaveField
        label="왜 이런 감정이 들었을까요?"
        help="한 줄로 적어 봐요."
        example="심심할 때 늘 영상을 봤는데, 그게 없으면 뭘 할지 모르겠어서요."
        value={values.why ?? ''}
        onChange={(v) => draft.setValue('why', v)}
        starters={SENTENCE_STARTERS.slice(0, 2)}
        minLength={5}
        required
        rows={2}
        disabled={draft.locked}
      />
    </ActivityShell>
  );
}

/* ------------------ 활동 3. 1801 강진, 정약용의 첫 겨울 ------------------ */

function Activity3() {
  const draft = useActivity('s1_a3');
  const [card, setCard] = useState(0);
  const values = draft.values as Record<string, string>;

  const canSubmit = meetsRequirements(
    draft.values,
    S1_A3_QUESTIONS.map((q) => ({ key: q.id, minLength: q.minLength })),
  );

  const sourceSpoken = useMemo(
    () =>
      `${SAUIJAE_SOURCE.intro} ${SAUIJAE_SOURCE.pledges.map((p) => p.text).join(' ')}`,
    [],
  );

  return (
    <ActivityShell
      title="활동 3 · 1801 강진, 정약용의 첫 겨울"
      icon={<ScrollText className="h-5 w-5 text-primary" aria-hidden />}
      intro="정약용이 강진에서 보낸 첫 겨울 이야기를 읽고, 사료에서 근거를 찾아 적어 봐요."
      draft={draft}
      canSubmit={canSubmit}
      footer={<GroupNoteBoard />}
    >
      {/* 스토리텔링 카드 4장 — 좌우로 넘기기 */}
      <div className="rounded-2xl bg-base-200 p-4">
        <div className="min-h-32 rounded-2xl bg-base-100 p-5 text-center">
          <p className="text-sm font-bold text-primary">
            {card + 1} / {STORY_CARDS.length} · {STORY_CARDS[card].title}
          </p>
          <p className="mt-3 text-base leading-relaxed">{STORY_CARDS[card].body}</p>
        </div>
        <div className="mt-3 flex items-center justify-between gap-2">
          <button
            type="button"
            className="btn btn-ghost btn-sm gap-1 rounded-2xl"
            disabled={card === 0}
            aria-label="이전 이야기 카드"
            onClick={() => setCard((c) => c - 1)}
          >
            <ChevronLeft className="h-4 w-4" aria-hidden />
            이전
          </button>
          <ReadAloudButton text={`${STORY_CARDS[card].title}. ${STORY_CARDS[card].body}`} />
          <button
            type="button"
            className="btn btn-ghost btn-sm gap-1 rounded-2xl"
            disabled={card === STORY_CARDS.length - 1}
            aria-label="다음 이야기 카드"
            onClick={() => setCard((c) => c + 1)}
          >
            다음
            <ChevronRight className="h-4 w-4" aria-hidden />
          </button>
        </div>
      </div>

      {/* 쉽게 풀어 쓴 사료 카드 */}
      <section className="rounded-2xl border-2 border-primary/30 bg-primary/5 p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="flex items-center gap-2 font-extrabold">
            <ScrollText className="h-5 w-5 text-primary" aria-hidden />
            {SAUIJAE_SOURCE.title}
          </h3>
          <ReadAloudButton text={sourceSpoken} />
        </div>
        <p className="mt-2 text-base">
          강진에 온 정약용은 머무는 방에 <HelpTooltip term="사의재">사의재</HelpTooltip>라는 이름을
          붙였어요. ‘네 가지를 마땅히 해야 할 방’이라는 뜻이에요.
        </p>
        <ul className="mt-3 grid gap-2 sm:grid-cols-2">
          {SAUIJAE_SOURCE.pledges.map((p) => (
            <li key={p.label} className="rounded-2xl bg-base-100 p-3">
              <span className="badge badge-primary badge-sm rounded-2xl">{p.label}</span>
              <p className="mt-1 font-semibold">{p.text}</p>
            </li>
          ))}
        </ul>
        <p className="mt-3 text-xs opacity-70">{SAUIJAE_SOURCE.note}</p>
        <p className="mt-1 text-xs font-semibold opacity-75">{SAUIJAE_SOURCE.citation}</p>
      </section>

      {/* 생각 여는 질문 3문항 */}
      <div className="flex flex-col gap-5">
        {S1_A3_QUESTIONS.map((q, i) => (
          <AutoSaveField
            key={q.id}
            label={`${i + 1}. ${q.label}`}
            help={q.help}
            example={q.example}
            value={values[q.id] ?? ''}
            onChange={(v) => draft.setValue(q.id, v)}
            starters={i === 0 ? undefined : SENTENCE_STARTERS.slice(0, 3)}
            minLength={q.minLength}
            required
            rows={3}
            disabled={draft.locked}
          />
        ))}
      </div>
    </ActivityShell>
  );
}

/** 모둠 보드 — 고립된 시간을 견디는 방법 (실시간) */
function GroupNoteBoard() {
  const { api, group, displayName } = useData();
  const [board, setBoard] = useState<GroupBoard | null>(null);
  const [text, setText] = useState('');

  useEffect(() => {
    if (!api) return;
    return api.watchGroupBoard('s1_a3', group, setBoard);
  }, [api, group]);

  async function addNote() {
    if (!api || !text.trim() || !board) return;
    const next = [
      ...board.notes,
      { id: `${Date.now()}`, text: text.trim(), author: displayName },
    ];
    await api.saveGroupBoard('s1_a3', group, { notes: next }, displayName);
    setText('');
  }

  async function removeNote(id: string) {
    if (!api || !board) return;
    await api.saveGroupBoard(
      's1_a3',
      group,
      { notes: board.notes.filter((n) => n.id !== id) },
      displayName,
    );
  }

  return (
    <section className="rounded-2xl bg-base-200 p-4">
      <h3 className="flex items-center gap-2 font-extrabold">
        <Users className="h-5 w-5 text-primary" aria-hidden />
        {S1_A3_GROUP.title}
        <span className="badge badge-ghost rounded-2xl">{group}모둠</span>
      </h3>
      <p className="mt-1 text-sm opacity-80">{S1_A3_GROUP.guide}</p>

      <div className="mt-3 flex flex-wrap gap-2">
        <input
          className="input input-bordered grow rounded-2xl"
          placeholder={S1_A3_GROUP.placeholder}
          value={text}
          maxLength={200}
          aria-label="모둠 붙임쪽지 내용"
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') void addNote();
          }}
        />
        <button
          type="button"
          className="btn btn-primary gap-1 rounded-2xl"
          disabled={!text.trim()}
          onClick={() => void addNote()}
        >
          <StickyNote className="h-4 w-4" aria-hidden />
          붙이기
        </button>
      </div>

      <ul className="mt-4 grid gap-2 sm:grid-cols-2">
        {(board?.notes ?? []).map((note) => (
          <li key={note.id} className="rounded-2xl bg-warning/25 p-3">
            <p className="text-sm">{note.text}</p>
            <div className="mt-2 flex items-center justify-between">
              <span className="text-xs opacity-60">{note.author}</span>
              <button
                type="button"
                className="btn btn-ghost btn-xs rounded-2xl"
                aria-label="붙임쪽지 떼기"
                onClick={() => void removeNote(note.id)}
              >
                떼기
              </button>
            </div>
          </li>
        ))}
      </ul>
      {(board?.notes.length ?? 0) === 0 && (
        <p className="mt-3 text-sm opacity-70">아직 붙임쪽지가 없어요. 먼저 하나 붙여 볼까요?</p>
      )}
    </section>
  );
}

/* ---------------------------- 1차시 성찰일지 ---------------------------- */

function Reflect1() {
  const draft = useActivity('s1_reflect');
  const values = draft.values as Record<string, string | number>;
  const fields = REFLECT_FIELDS.s1;

  const canSubmit =
    meetsRequirements(
      draft.values,
      fields.map((f) => ({ key: f.id, minLength: 5 })),
    ) && Boolean(values.mood);

  return (
    <ActivityShell
      title="1차시 성찰일지"
      icon={<NotebookPen className="h-5 w-5 text-primary" aria-hidden />}
      intro="오늘 수업을 돌아봐요. 짧게 한 줄씩이면 충분해요."
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
                values.mood === m.id ? 'btn-primary' : 'btn-outline'
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
