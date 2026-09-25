/**
 * 챕터 진행 화면
 * [인트로] → [장면 1~5: 상황 → 감정 체크 → 선택 → 결과 → 실제 역사 카드]
 * → [AI 시대 연결 성찰] → [원칙 카드 획득] → [챕터 마무리] → [완료]
 * 진행 단계는 학생 기록(progress)에 장면 단위로 저장된다.
 */
import { useEffect, useRef, useState } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import { Layout, FictionNotice } from '../../components/Layout';
import { Button, LinkButton, Notice, SaveBadge, Stamp, friendlyError } from '../../components/ui';
import { FactCardView } from '../../components/FactCard';
import { PrincipleCardView } from '../../components/PrincipleCard';
import { EmotionPicker } from '../../components/EmotionPicker';
import { DistributionChart } from '../../components/DistributionChart';
import { WritingBox } from '../../components/WritingBox';
import { ChapterIllustration } from '../../components/Illustration';
import { StudentBadge } from './StudentHome';
import { useReadyStudent } from '../../app/StudentContext';
import { CHAPTERS } from '../../data/scenarios';
import { getFact } from '../../data/facts';
import { getPrinciple } from '../../data/principles';
import { EMOTIONS } from '../../data/emotions';
import { getKselCompetency } from '../../data/curriculum';
import { awardCards, saveAnswer, saveSceneChoice, setStep } from '../../lib/db';
import { answeredCount, countChars, nextStep, reflectionReady, sceneNoOf, stepIndex, WRAPUP_MIN } from '../../lib/progress';
import { useDraftSaver } from '../../lib/useDraftSaver';
import { LIMITS } from '../../config';
import type { Chapter, EmotionId, Scene } from '../../types/content';
import type { ChapterStep, ChoiceId } from '../../types/db';

export default function ChapterPage() {
  const { chapterId } = useParams();
  const chapter = CHAPTERS.find((c) => c.id === chapterId);
  const { student, cls, session } = useReadyStudent();
  const [justAwarded, setJustAwarded] = useState(false);
  const [justDone, setJustDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);

  const step: ChapterStep | undefined = chapter ? student.progress[chapter.id] : undefined;

  // 처음 연 챕터는 ‘인트로’로 기록해 교사 화면에 보이게 한다.
  useEffect(() => {
    if (chapter && !step && cls.unlocked[chapter.id]) {
      setStep(session.classId, session.studentId, chapter.id, 'intro').catch(() => undefined);
    }
  }, [chapter, step, cls.unlocked, session]);

  // 단계가 바뀌면 제목으로 초점을 옮겨, 키보드·화면 읽기 사용자도 새 내용을 바로 알 수 있게 한다.
  useEffect(() => {
    headingRef.current?.focus();
    window.scrollTo({ top: 0 });
  }, [step]);

  if (!chapter) return <Navigate to="/play" replace />;

  const current: ChapterStep = step ?? 'intro';
  const locked = !cls.unlocked[chapter.id] && current !== 'done';

  const go = async (to: ChapterStep) => {
    setError(null);
    try {
      await setStep(session.classId, session.studentId, chapter.id, to);
    } catch (e) {
      setError(friendlyError(e));
    }
  };

  return (
    <Layout right={<StudentBadge />} chapterTheme={chapter.theme}>
      <ChapterHeader chapter={chapter} step={current} headingRef={headingRef} />
      {error && (
        <Notice tone="error" className="mb-4">
          {error}
        </Notice>
      )}
      {locked ? (
        <Notice tone="warn">
          🔒 선생님이 이 파일을 아직 열지 않았거나 잠시 잠갔어요. 선생님의 안내를 기다려 주세요.
          <div className="mt-3">
            <LinkButton to="/play" variant="secondary">
              사건 파일 목록으로
            </LinkButton>
          </div>
        </Notice>
      ) : current === 'intro' ? (
        <IntroView chapter={chapter} onStart={() => go('s1')} />
      ) : sceneNoOf(current) ? (
        <SceneView
          key={current}
          chapter={chapter}
          scene={chapter.scenes[sceneNoOf(current)! - 1]}
          onNext={() => go(nextStep(current))}
        />
      ) : current === 'reflect' ? (
        <ReflectionView
          chapter={chapter}
          onAwarded={() => {
            setJustAwarded(true);
          }}
        />
      ) : current === 'wrapup' ? (
        <WrapupView chapter={chapter} justAwarded={justAwarded} onDone={() => setJustDone(true)} />
      ) : (
        <DoneView chapter={chapter} justDone={justDone} />
      )}
      <FictionNotice />
    </Layout>
  );
}

/* ─────────────── 머리말 + 진행 표시 ─────────────── */

const STEP_DOTS: { step: ChapterStep; label: string }[] = [
  { step: 'intro', label: '인트로' },
  { step: 's1', label: '1' },
  { step: 's2', label: '2' },
  { step: 's3', label: '3' },
  { step: 's4', label: '4' },
  { step: 's5', label: '5' },
  { step: 'reflect', label: '성찰' },
  { step: 'wrapup', label: '마무리' },
];

function ChapterHeader({
  chapter,
  step,
  headingRef,
}: {
  chapter: Chapter;
  step: ChapterStep;
  headingRef: React.RefObject<HTMLHeadingElement>;
}) {
  const idx = stepIndex(step);
  return (
    <div className="mb-5">
      <p className="typewriter text-[15px] text-ch-600">
        CHAPTER {chapter.no} · {chapter.place}
      </p>
      <h1 ref={headingRef} tabIndex={-1} className="typewriter text-2xl font-bold text-ch-900 outline-none sm:text-3xl">
        「{chapter.title}」
      </h1>
      <ol className="mt-3 flex flex-wrap gap-1" aria-label="진행 상황">
        {STEP_DOTS.map((d) => {
          const i = stepIndex(d.step);
          const state = i < idx ? 'done' : i === idx ? 'now' : 'todo';
          return (
            <li
              key={d.step}
              aria-current={state === 'now' ? 'step' : undefined}
              className={`typewriter rounded px-2 py-0.5 text-[14px] ${
                state === 'now'
                  ? 'bg-ch-900 font-bold text-white'
                  : state === 'done'
                    ? 'bg-ch-100 text-ch-900'
                    : 'bg-paper-dark text-ink-soft'
              }`}
            >
              {state === 'done' ? '✓ ' : ''}
              {d.label}
              <span className="sr-only">{state === 'done' ? ' (끝냄)' : state === 'now' ? ' (지금)' : ''}</span>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

/* ─────────────── 인트로 ─────────────── */

function IntroView({ chapter, onStart }: { chapter: Chapter; onStart: () => void }) {
  const [busy, setBusy] = useState(false);
  return (
    <div className="flex flex-col gap-5 animate-rise">
      <div className="dossier overflow-hidden">
        <ChapterIllustration theme={chapter.theme} className="h-32 w-full sm:h-40" />
        <div className="p-5">
          <p className="typewriter text-[15px] text-ink-soft">
            {chapter.period} · {chapter.place}
          </p>
          {chapter.intro.map((line) => (
            <p key={line} className="mt-2 text-[18px]">
              {line}
            </p>
          ))}
        </div>
      </div>

      <section className="dossier border-l-8 border-l-ch-900 p-5" aria-label="내가 맡을 인물">
        <p className="typewriter text-[15px] text-ink-soft">내가 맡을 인물 (가상 인물)</p>
        <h2 className="typewriter text-xl font-bold">
          {chapter.character.name} · {chapter.character.role}
        </h2>
        <p className="mt-1">{chapter.character.intro}</p>
      </section>

      {chapter.introFactIds.length > 0 && (
        <section className="flex flex-col gap-3">
          <h2 className="text-lg font-bold">📂 먼저 알아 둘 역사 기록</h2>
          {chapter.introFactIds.map((id) => (
            <FactCardView key={id} fact={getFact(id)} />
          ))}
        </section>
      )}

      <Notice tone="info">
        장면은 모두 5개예요. 장면마다 ① 인물의 마음을 고르고 ② 선택을 한 뒤 ③ 결과와 실제 역사를 읽어요. <strong>정답은 없어요.</strong>{' '}
        내가 인물이라면 어떻게 할지 솔직하게 골라 보세요.
      </Notice>
      <Button
        variant="chapter"
        className="text-[19px]"
        disabled={busy}
        onClick={async () => {
          setBusy(true);
          await onStart();
          setBusy(false);
        }}
      >
        장면 1 시작하기 ▶
      </Button>
    </div>
  );
}

/* ─────────────── 장면 ─────────────── */

function SceneView({ chapter, scene, onNext }: { chapter: Chapter; scene: Scene; onNext: () => Promise<void> | void }) {
  const { student, session } = useReadyStudent();
  const savedChoice = student.choices[scene.id] as ChoiceId | undefined;
  const savedEmotion = student.emotions[scene.id] as EmotionId | undefined;
  const [emotion, setEmotion] = useState<EmotionId | null>(savedEmotion ?? null);
  const [choice, setChoice] = useState<ChoiceId | null>(savedChoice ?? null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [revealed, setRevealed] = useState(false);
  const resultRef = useRef<HTMLDivElement>(null);
  const factsRef = useRef<HTMLDivElement>(null);

  const decided = !!savedChoice;
  const chosen = scene.choices.find((c) => c.id === (savedChoice ?? choice));
  const emo = EMOTIONS.find((e) => e.id === (savedEmotion ?? emotion));
  const isLast = scene.no === chapter.scenes.length;

  const confirm = async () => {
    if (!emotion || !choice) return;
    setBusy(true);
    setError(null);
    try {
      await saveSceneChoice(session.classId, session.studentId, scene.id, emotion, choice);
      setTimeout(() => resultRef.current?.focus(), 50);
    } catch (e) {
      setError(friendlyError(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex flex-col gap-5">
      <article className="dossier relative p-5 animate-rise" aria-labelledby={`${scene.id}-title`}>
        <p className="typewriter text-[15px] text-ch-600">
          장면 {scene.no}
          {scene.epilogue ? ' · 에필로그' : ''} · {scene.when}
        </p>
        <h2 id={`${scene.id}-title`} className="typewriter mt-1 text-[22px] font-bold">
          {scene.title}
        </h2>
        <div className="mt-3 flex flex-col gap-2 text-[18px] leading-relaxed">
          {scene.body.map((line) => (
            <p key={line}>{line}</p>
          ))}
        </div>
      </article>

      {!decided ? (
        <section className="dossier flex flex-col gap-6 p-5" aria-label="선택하기">
          <EmotionPicker value={emotion} onChange={setEmotion} characterName={chapter.character.name} />

          <fieldset className="flex flex-col gap-2">
            <legend className="mb-2 text-[18px] font-bold">② {scene.question}</legend>
            <div role="radiogroup" className="flex flex-col gap-2">
              {scene.choices.map((c) => {
                const on = choice === c.id;
                return (
                  <button
                    key={c.id}
                    type="button"
                    role="radio"
                    aria-checked={on}
                    onClick={() => setChoice(c.id)}
                    className={`flex min-h-14 items-center gap-3 rounded-lg border-2 px-4 py-3 text-left text-[18px] transition-colors ${
                      on ? 'border-ch-900 bg-ch-100 font-bold' : 'border-line bg-white hover:bg-paper'
                    }`}
                  >
                    <span
                      aria-hidden="true"
                      className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 ${
                        on ? 'border-ch-900 bg-ch-900 text-white' : 'border-line'
                      }`}
                    >
                      {on ? '✓' : ''}
                    </span>
                    {c.label}
                  </button>
                );
              })}
            </div>
          </fieldset>

          {error && <Notice tone="error">{error}</Notice>}
          <div className="flex flex-col gap-2">
            <Button variant="chapter" onClick={confirm} disabled={!emotion || !choice || busy} className="text-[19px]">
              {busy ? '저장하는 중…' : '이 선택으로 정하기'}
            </Button>
            <p className="text-center text-[15px] text-ink-soft">
              {!emotion ? '먼저 ① 인물의 마음을 골라 주세요.' : !choice ? '② 선택지를 하나 골라 주세요.' : '한 번 정하면 바꿀 수 없어요. 신중하게!'}
            </p>
          </div>
        </section>
      ) : (
        <>
          <section
            ref={resultRef}
            tabIndex={-1}
            className="dossier flex flex-col gap-3 border-l-8 border-l-ch-600 p-5 outline-none animate-rise"
            aria-label="선택 결과"
          >
            <p className="text-[16px] text-ink-soft">
              내가 고른 마음: <strong className="text-ink">{emo ? `${emo.emoji} ${emo.label}` : '-'}</strong> · 내 선택:{' '}
              <strong className="text-ink">{chosen?.label}</strong>
            </p>
            <h3 className="typewriter text-lg font-bold">이 선택이 가져올 수 있는 결과</h3>
            <p className="text-[18px] leading-relaxed">{chosen?.result}</p>
            <p className="rounded bg-paper px-3 py-2 text-[16px]">
              💭 내가 고른 마음(<strong>{emo?.label}</strong>)은 {chapter.character.name}의 선택에 어떤 영향을 주었을까요? 활동지 감정 기록표에 적어 보세요.
            </p>
          </section>

          {!revealed ? (
            <Button
              variant="primary"
              className="text-[19px]"
              onClick={() => {
                setRevealed(true);
                setTimeout(() => factsRef.current?.focus(), 50);
              }}
            >
              📂 실제 역사에서는? (기밀 문서 열기)
            </Button>
          ) : (
            <section ref={factsRef} tabIndex={-1} className="flex flex-col gap-3 outline-none" aria-label="실제 역사에서는">
              <h3 className="text-lg font-bold">📂 실제 역사에서는?</h3>
              {scene.factIds.map((id) => (
                <FactCardView key={id} fact={getFact(id)} animate />
              ))}
              <Button variant="chapter" className="mt-2 text-[19px]" onClick={() => void onNext()}>
                {isLast ? 'AI 시대와 연결하러 가기 ▶' : `장면 ${scene.no + 1}로 ▶`}
              </Button>
            </section>
          )}
        </>
      )}
    </div>
  );
}

/* ─────────────── AI 시대 연결 성찰 ─────────────── */

function ReflectionView({ chapter, onAwarded }: { chapter: Chapter; onAwarded: () => void }) {
  const { student, session } = useReadyStudent();
  const [drafts, setDrafts] = useState<Record<string, string>>(() =>
    Object.fromEntries(chapter.reflection.questions.map((q) => [q.id, student.answers[q.id] ?? ''])),
  );
  const saver = useDraftSaver((id, text) => saveAnswer(session.classId, session.studentId, id, text));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const done = answeredCount(chapter, drafts);
  const ready = reflectionReady(chapter, drafts);
  const { minAnswers, minLength, questions } = chapter.reflection;

  const receive = async () => {
    setBusy(true);
    setError(null);
    try {
      const ok = await saver.flushAll();
      if (!ok) throw new Error('save');
      await awardCards(session.classId, session.studentId, chapter.id, chapter.principleIds);
      onAwarded();
    } catch (e) {
      setError(friendlyError(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex flex-col gap-5">
      <div className="dossier p-5">
        <h2 className="typewriter text-xl font-bold">🤖 AI 시대와 연결하기</h2>
        <p className="mt-1">
          냉전 시대의 이야기를 오늘날 AI와 이어 생각해 봐요. 질문 {questions.length}개 가운데{' '}
          <strong>
            {minAnswers === questions.length ? '모두' : `${minAnswers}개 이상`}
          </strong>
          에 <strong>{minLength}자 이상</strong> 답하면 원칙 카드를 받아요.
        </p>
        <p className="mt-2 flex flex-wrap items-center justify-between gap-2">
          <span className="typewriter font-bold">
            지금 {done} / {minAnswers}개 {ready ? '✔ 완료' : ''}
          </span>
          <SaveBadge status={saver.status} />
        </p>
      </div>

      {questions.map((q, i) => (
        <section key={q.id} className="dossier flex flex-col gap-3 p-5" aria-label={`질문 ${i + 1}`}>
          <h3 className="text-[18px] font-bold leading-relaxed">
            질문 {i + 1}. {q.text}
          </h3>
          <WritingBox
            label="내 생각 쓰기"
            hint={q.hint}
            starters={q.starters}
            value={drafts[q.id]}
            minLength={minLength}
            maxLength={LIMITS.answer}
            onChange={(v) => {
              setDrafts((d) => ({ ...d, [q.id]: v }));
              saver.schedule(q.id, v);
            }}
            chips={
              <p className="flex flex-wrap gap-1.5">
                {q.principleIds.map((pid) => {
                  const p = getPrinciple(pid);
                  return (
                    <span key={pid} className="rounded-full px-2.5 py-0.5 text-[14px] font-bold text-white" style={{ backgroundColor: p.color }}>
                      {p.icon} {p.name}
                    </span>
                  );
                })}
              </p>
            }
          />
        </section>
      ))}

      {error && <Notice tone="error">{error}</Notice>}
      <Button variant="chapter" className="text-[19px]" disabled={!ready || busy} onClick={receive}>
        {busy ? '카드 받는 중…' : ready ? '🗂️ 원칙 카드 받기' : `${minAnswers - done}개 더 답하면 카드를 받을 수 있어요`}
      </Button>
    </div>
  );
}

/* ─────────────── 챕터 마무리 ─────────────── */

function WrapupView({ chapter, justAwarded, onDone }: { chapter: Chapter; justAwarded: boolean; onDone: () => void }) {
  const { student, session, cls, stats } = useReadyStudent();
  const [text, setText] = useState(student.answers[chapter.wrapupId] ?? '');
  const saver = useDraftSaver((id, t) => saveAnswer(session.classId, session.studentId, id, t));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const enough = countChars(text) >= WRAPUP_MIN;

  const finish = async () => {
    setBusy(true);
    setError(null);
    try {
      if (!(await saver.flushAll())) throw new Error('save');
      await setStep(session.classId, session.studentId, chapter.id, 'done');
      onDone();
    } catch (e) {
      setError(friendlyError(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <section className="flex flex-col gap-3" aria-label="받은 원칙 카드">
        <h2 className="typewriter text-xl font-bold">{justAwarded ? '🎉 원칙 카드를 받았어요!' : '🗂️ 이 챕터에서 받은 원칙 카드'}</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {chapter.principleIds.map((id) => (
            <PrincipleCardView key={id} principle={getPrinciple(id)} animate={justAwarded} />
          ))}
        </div>
      </section>

      {chapter.outroFactIds.length > 0 && (
        <section className="flex flex-col gap-3">
          <h2 className="text-lg font-bold">📂 그 뒤의 역사</h2>
          {chapter.outroFactIds.map((id) => (
            <FactCardView key={id} fact={getFact(id)} />
          ))}
        </section>
      )}

      {cls.showDistribution && (
        <section className="dossier p-5" aria-label="학급 선택 분포">
          <h2 className="typewriter text-xl font-bold">👥 다른 친구들은 어떤 선택을 했을까?</h2>
          <p className="mb-4 text-ink-soft">우리 반 친구들의 선택이에요. 누가 무엇을 골랐는지는 보이지 않아요.</p>
          {stats ? (
            <DistributionChart scenes={chapter.scenes} stats={stats} mine={student.choices as Record<string, ChoiceId>} />
          ) : (
            <p className="text-ink-soft">아직 모으는 중이에요. 잠시 뒤에 다시 보여요.</p>
          )}
        </section>
      )}

      <section className="dossier flex flex-col gap-3 p-5" aria-label="챕터 마무리 성찰">
        <p className="typewriter text-[15px] text-ink-soft">
          마음 돌아보기 · {chapter.curriculum.ksel.competencies.map((id) => getKselCompetency(id).name).join(' · ')}
        </p>
        <h2 className="text-[19px] font-bold">{chapter.kselFocus.question}</h2>
        <WritingBox
          label="내 마음 쓰기"
          starters={chapter.kselFocus.starters}
          value={text}
          minLength={WRAPUP_MIN}
          maxLength={LIMITS.answer}
          onChange={(v) => {
            setText(v);
            saver.schedule(chapter.wrapupId, v);
          }}
        />
        <SaveBadge status={saver.status} />
      </section>

      {error && <Notice tone="error">{error}</Notice>}
      <Button variant="chapter" className="text-[19px]" disabled={!enough || busy} onClick={finish}>
        {busy ? '저장하는 중…' : enough ? '📁 파일 닫기 (챕터 마치기)' : `마음 쓰기를 ${WRAPUP_MIN}자 이상 채워 주세요`}
      </Button>
    </div>
  );
}

/* ─────────────── 완료 · 내 기록 보기 ─────────────── */

function DoneView({ chapter, justDone }: { chapter: Chapter; justDone: boolean }) {
  const { student, cls } = useReadyStudent();
  const nav = useNavigate();
  const next = CHAPTERS.find((c) => c.no === chapter.no + 1);
  const nextOpen = next && cls.unlocked[next.id];
  return (
    <div className="flex flex-col gap-5">
      <section className="dossier relative flex flex-col items-center gap-3 p-6 text-center">
        <Stamp tone="declass" animate={justDone} className="text-3xl">
          기밀 해제
        </Stamp>
        <h2 className="typewriter mt-2 text-2xl font-bold">CHAPTER {chapter.no} 완료!</h2>
        <p>「{chapter.title}」 파일을 모두 읽었어요. 수고했어요.</p>
        <div className="mt-2 flex flex-wrap justify-center gap-2">
          <LinkButton to="/play" variant="secondary">
            사건 파일 목록
          </LinkButton>
          {nextOpen && (
            <Button variant="primary" onClick={() => nav(`/play/chapter/${next.id}`)}>
              다음 파일: 「{next.title}」 ▶
            </Button>
          )}
          {!next && cls.unlocked.finale && (
            <LinkButton to="/play/finale" variant="primary">
              선언문 쓰러 가기 ▶
            </LinkButton>
          )}
        </div>
      </section>

      <section className="flex flex-col gap-3" aria-label="내 기록">
        <h2 className="typewriter text-xl font-bold">📋 내 기록</h2>
        {chapter.scenes.map((s) => {
          const c = s.choices.find((x) => x.id === student.choices[s.id]);
          const e = EMOTIONS.find((x) => x.id === student.emotions[s.id]);
          return (
            <details key={s.id} className="dossier p-4">
              <summary className="cursor-pointer text-[17px]">
                <strong>
                  장면 {s.no}. {s.title}
                </strong>{' '}
                — {e ? `${e.emoji} ${e.label}` : ''} · {c?.label ?? '기록 없음'}
              </summary>
              <div className="mt-3 flex flex-col gap-3">
                {c && <p className="text-[17px]">{c.result}</p>}
                {s.factIds.map((id) => (
                  <FactCardView key={id} fact={getFact(id)} />
                ))}
              </div>
            </details>
          );
        })}
        {[...chapter.reflection.questions.map((q, i) => ({ id: q.id, title: `AI 연결 질문 ${i + 1}`, text: q.text })), { id: chapter.wrapupId, title: '마음 돌아보기', text: chapter.kselFocus.question }].map(
          (q) =>
            student.answers[q.id] ? (
              <div key={q.id} className="dossier p-4">
                <p className="text-[15px] text-ink-soft">
                  {q.title} · {q.text}
                </p>
                <p className="mt-1 whitespace-pre-wrap">{student.answers[q.id]}</p>
              </div>
            ) : null,
        )}
      </section>
    </div>
  );
}
