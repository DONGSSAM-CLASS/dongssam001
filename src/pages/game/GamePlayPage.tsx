import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  BadgeCheck,
  BookOpen,
  CheckCircle2,
  ChevronRight,
  GraduationCap,
  Home,
  Lightbulb,
  NotebookPen,
  PenLine,
  RotateCcw,
  Search,
  Trophy,
  XCircle,
} from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import {
  completeChapter,
  loadProgress,
  saveReflection,
  type GameContext,
} from '@/lib/gameService';
import type { GameProgressDoc } from '@/types/firestore';
import { chapters, totalPoints } from '@/game/story';
import { chapterTerms, glossary } from '@/game/glossary';
import type { Chapter, Level } from '@/game/types';
import { CinematicScene } from '@/game/scenes/CinematicScene';
import { DialogueLine } from '@/game/components/DialogueLine';
import { MissionStatusPanel } from '@/game/components/MissionStatusPanel';
import { BadgeIcon } from '@/game/components/badgeIcons';
import { SourceCard } from '@/game/components/SourceCard';

interface ProgressLike {
  level: Level;
  completed: string[];
  answers: Record<string, string[]>;
  attempts: Record<string, number>;
  badges: string[];
  reflections: Record<string, string>;
  score: number;
  currentChapter: string;
}

type Phase = 'briefing' | 'quiz' | 'result';

function freshProgress(level: Level): ProgressLike {
  return { level, completed: [], answers: {}, attempts: {}, badges: [], reflections: {}, score: 0, currentChapter: chapters[0].id };
}

function sameSet(a: string[], b: string[]) {
  if (a.length !== b.length) return false;
  const s = new Set(a);
  return b.every((x) => s.has(x));
}

/**
 * 게임 플레이 화면. mode="student" 는 Firestore 에 진행을 저장하고,
 * mode="preview" 는 교사 미리보기로 저장 없이 로컬 상태로만 진행한다.
 */
export default function GamePlayPage({ mode = 'student' }: { mode?: 'student' | 'preview' }) {
  const navigate = useNavigate();
  const profile = useAuthStore((s) => s.profile);
  const user = useAuthStore((s) => s.user);

  const ctx: GameContext | null =
    mode === 'student' && profile?.role === 'student' && user
      ? { classId: profile.classId, number: profile.number, uid: user.uid }
      : null;

  // 저장 문서(학생 모드) — 점수·완료 갱신용
  const [doc, setDoc] = useState<(GameProgressDoc & { id: string }) | null>(null);
  const [prog, setProg] = useState<ProgressLike>(() => freshProgress('middle'));
  const [loading, setLoading] = useState(mode === 'student');
  const [saving, setSaving] = useState(false);
  const [viewIndex, setViewIndex] = useState(0);

  const [phase, setPhase] = useState<Phase>('briefing');
  const [picked, setPicked] = useState<string[]>([]);
  const [judged, setJudged] = useState<null | boolean>(null);
  const [showHint, setShowHint] = useState(false);

  // 진행 불러오기 (preview 모드는 loading=false 로 시작하므로 불러오지 않는다)
  useEffect(() => {
    if (mode !== 'student' || !ctx) return;
    let alive = true;
    loadProgress(ctx)
      .then((p) => {
        if (!alive) return;
        if (!p) {
          navigate('/game', { replace: true });
          return;
        }
        setDoc(p);
        setProg({
          level: p.level,
          completed: p.completed ?? [],
          answers: p.answers ?? {},
          attempts: p.attempts ?? {},
          badges: p.badges ?? [],
          reflections: p.reflections ?? {},
          score: p.score ?? 0,
          currentChapter: p.currentChapter ?? chapters[0].id,
        });
        // 저장된 진행 위치에서 이어서 시작
        const idx = p.currentChapter === 'done' ? chapters.length : chapters.findIndex((c) => c.id === p.currentChapter);
        setViewIndex(idx < 0 ? 0 : idx);
      })
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ctx?.classId, ctx?.number, mode]);

  // 화면에 보여 줄 챕터 인덱스. 저장된 진행(currentChapter)과 분리해, 정답 직후에도
  // 해설(result) 화면을 건너뛰지 않고 학생이 '다음 미션'을 누를 때만 넘어가게 한다.
  const chapter: Chapter | undefined = chapters[viewIndex];
  const isDone = viewIndex >= chapters.length;

  // 표시 챕터가 바뀌면 화면 상태 초기화(활성 챕터에 맞춰 로컬 UI 동기화)
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setPhase('briefing');
    setPicked([]);
    setJudged(null);
    setShowHint(false);
  }, [viewIndex]);

  function togglePick(id: string, multi: boolean) {
    if (judged) return;
    setPicked((prev) => (multi ? (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]) : [id]));
  }

  async function submit() {
    if (!chapter || picked.length === 0) return;
    const correct = sameSet(picked, chapter.quest.answer);
    const attempts = (prog.attempts[chapter.id] ?? 0) + 1;
    setJudged(correct);
    if (!correct) {
      setProg((p) => ({ ...p, attempts: { ...p.attempts, [chapter.id]: attempts } }));
      setShowHint(true);
      return;
    }
    // 정답 → 진행 확정(저장은 다음 챕터로 표시하되, 화면은 해설을 먼저 보여 준다)
    const nextChapter = chapters[viewIndex + 1]?.id ?? 'done';
    const alreadyDone = prog.completed.includes(chapter.id);
    const earned = alreadyDone ? 0 : chapter.quest.points;
    const nextProg: ProgressLike = {
      ...prog,
      completed: alreadyDone ? prog.completed : [...prog.completed, chapter.id],
      answers: { ...prog.answers, [chapter.id]: picked },
      attempts: { ...prog.attempts, [chapter.id]: attempts },
      badges: prog.badges.includes(chapter.badge.label) ? prog.badges : [...prog.badges, chapter.badge.label],
      score: prog.score + earned,
      currentChapter: nextChapter,
    };
    if (mode === 'student' && ctx && doc) {
      setSaving(true);
      try {
        const updated = await completeChapter(ctx, doc, {
          chapterId: chapter.id,
          answer: picked,
          correct: true,
          earned,
          attempts,
          nextChapter,
        });
        setDoc(updated);
      } catch {
        /* 저장 실패해도 진행은 계속 (다음 저장 때 반영) */
      } finally {
        setSaving(false);
      }
    }
    setProg(nextProg);
    setPhase('result');
  }

  function goNext() {
    // 해설을 확인한 뒤 다음 챕터로. viewIndex 가 바뀌면 useEffect 가 화면을 초기화하고,
    // 마지막이면 viewIndex 가 length 가 되어 완료 화면이 뜬다.
    setViewIndex((v) => v + 1);
  }

  if (loading) {
    return (
      <div data-theme="gwangbok" className="flex min-h-[100dvh] items-center justify-center text-base-content">
        <span className="loading loading-dots loading-lg text-primary" aria-label="불러오는 중" />
      </div>
    );
  }

  return (
    <div data-theme="gwangbok" className="relative min-h-[100dvh] text-base-content">
      {/* 미션 상태창 (오른쪽 상단 고정) */}
      <div className="pointer-events-none fixed right-3 top-3 z-30 sm:right-4 sm:top-4">
        <MissionStatusPanel
          chapters={chapters}
          currentIndex={isDone ? chapters.length - 1 : viewIndex}
          completedIds={prog.completed}
          score={prog.score}
          badges={prog.badges}
          level={prog.level}
        />
      </div>

      {mode === 'preview' && (
        <div className="fixed left-3 top-3 z-30 flex items-center gap-2 rounded-full border border-warning/40 bg-base-200/90 px-3 py-1 text-xs text-warning">
          <GraduationCap className="size-3.5" aria-hidden /> 교사 미리보기 (저장 안 됨)
          <select
            className="select select-xs bg-base-100"
            value={prog.level}
            onChange={(e) => {
              setProg(freshProgress(e.target.value as Level));
              setViewIndex(0);
            }}
            aria-label="난이도"
          >
            <option value="middle">중등</option>
            <option value="high">고등</option>
          </select>
        </div>
      )}

      {isDone ? (
        <CompletionScreen
          prog={prog}
          mode={mode}
          ctx={ctx}
          onSaveReflection={(text) => setProg((p) => ({ ...p, reflections: { ...p.reflections, epilogue: text } }))}
          onReplay={() => {
            setProg((p) => freshProgress(p.level));
            setViewIndex(0);
          }}
        />
      ) : chapter ? (
        <main className="mx-auto max-w-3xl px-4 pb-24 pt-4 sm:pt-6">
          {/* 시네마틱 헤더 */}
          <section className="relative mb-5 overflow-hidden rounded-box border border-primary/25 cinematic-letterbox film-vignette">
            <div className="aspect-[16/7] w-full">
              <CinematicScene scene={chapter.scene} className="h-full w-full" />
            </div>
            <div className="absolute inset-x-0 bottom-0 z-10 bg-gradient-to-t from-base-100/95 to-transparent p-4">
              <div className="text-xs font-semibold uppercase tracking-widest text-primary/90">{chapter.dateLabel} · {chapter.place}</div>
              <h1 className="mt-0.5 text-xl font-bold sm:text-2xl" style={{ wordBreak: 'keep-all' }}>{chapter.title}</h1>
              <p className="mt-1 text-xs italic text-base-content/70" style={{ wordBreak: 'keep-all' }}>{chapter.cinematicCaption}</p>
            </div>
          </section>

          {phase === 'briefing' && (
            <BriefingView chapter={chapter} level={prog.level} onStart={() => setPhase('quiz')} />
          )}

          {phase === 'quiz' && (
            <QuizView
              chapter={chapter}
              level={prog.level}
              picked={picked}
              judged={judged}
              showHint={showHint}
              saving={saving}
              onToggle={(id) => togglePick(id, chapter.quest.kind === 'multi')}
              onSubmit={submit}
              onRetry={() => {
                setJudged(null);
                setPicked([]);
              }}
            />
          )}

          {phase === 'result' && (
            <ResultView chapter={chapter} level={prog.level} isLast={viewIndex >= chapters.length - 1} onNext={goNext} />
          )}
        </main>
      ) : null}
    </div>
  );
}

// ───────────────────────── 브리핑(사료 검토) ─────────────────────────
function BriefingView({ chapter, level, onStart }: { chapter: Chapter; level: Level; onStart: () => void }) {
  const sourceById = Object.fromEntries(chapter.sources.map((s) => [s.id, s]));
  return (
    <div className="space-y-4">
      <div className="rounded-box border border-base-content/10 bg-base-200/60 p-4">
        <div className="mb-1 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-secondary">
          <BookOpen className="size-4" aria-hidden /> 상황
        </div>
        <p className="leading-relaxed text-base-content/90" style={{ wordBreak: 'keep-all' }}>{chapter.intro[level]}</p>
      </div>

      <div className="space-y-4">
        {chapter.dialogues.map((d, i) => (
          <DialogueLine key={i} dialogue={d} level={level} source={d.sourceId ? sourceById[d.sourceId] : undefined} />
        ))}
      </div>

      {/* 대사에 연결되지 않은 사료가 있으면 별도로 표시 */}
      {chapter.sources
        .filter((s) => !chapter.dialogues.some((d) => d.sourceId === s.id))
        .map((s) => (
          <div key={s.id} className="sm:ml-[60px]">
            {/* SourceCard 재사용 */}
            <DialogueSourceOnly sourceId={s.id} chapter={chapter} level={level} />
          </div>
        ))}

      <ClueNotebook chapterId={chapter.id} level={level} />

      <div className="rounded-box border border-primary/20 bg-base-300/40 px-4 py-2 text-[11px] text-base-content/55" style={{ wordBreak: 'keep-all' }}>
        <b className="text-primary/80">교육과정 연계</b> · {chapter.curriculum}
      </div>

      <button className="btn btn-primary w-full gap-2" onClick={onStart}>
        <Search className="size-4" aria-hidden /> 단서를 모았다 — 추리 시작
      </button>
    </div>
  );
}

// 단서 수첩 — 챕터별 핵심 용어를 쉬운 말로 풀어 준다
function ClueNotebook({ chapterId, level }: { chapterId: string; level: Level }) {
  const terms = chapterTerms[chapterId] ?? [];
  if (terms.length === 0) return null;
  return (
    <div className="rounded-box border border-secondary/30 bg-base-200/50 p-4">
      <div className="mb-2 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-secondary">
        <NotebookPen className="size-4" aria-hidden /> 단서 수첩 · 핵심 용어
      </div>
      <div className="space-y-1.5">
        {terms.map((key) => {
          const e = glossary[key];
          if (!e) return null;
          return (
            <details key={key} className="group rounded-md bg-base-300/50 px-3 py-2">
              <summary className="flex cursor-pointer list-none items-center gap-2 text-sm font-semibold text-base-content/90">
                <span className="text-primary">{e.term}</span>
                {e.hanja && <span className="text-[11px] text-base-content/45">{e.hanja}</span>}
                <ChevronRight className="ml-auto size-4 text-base-content/40 transition-transform group-open:rotate-90" aria-hidden />
              </summary>
              <p className="mt-1.5 text-[13px] leading-relaxed text-base-content/80" style={{ wordBreak: 'keep-all' }}>
                {e.def[level]}
              </p>
            </details>
          );
        })}
      </div>
    </div>
  );
}

// SourceCard 를 직접 쓰기 위한 얇은 래퍼(대사 없이 사료만)
function DialogueSourceOnly({ sourceId, chapter, level }: { sourceId: string; chapter: Chapter; level: Level }) {
  const src = chapter.sources.find((s) => s.id === sourceId);
  if (!src) return null;
  return <SourceCard source={src} level={level} />;
}

// ───────────────────────── 추리(퀘스트) ─────────────────────────
function QuizView({
  chapter,
  level,
  picked,
  judged,
  showHint,
  saving,
  onToggle,
  onSubmit,
  onRetry,
}: {
  chapter: Chapter;
  level: Level;
  picked: string[];
  judged: null | boolean;
  showHint: boolean;
  saving: boolean;
  onToggle: (id: string) => void;
  onSubmit: () => void;
  onRetry: () => void;
}) {
  const q = chapter.quest;
  const multi = q.kind === 'multi';
  return (
    <div className="space-y-3">
      <div className="rounded-box border border-primary/30 bg-base-200/70 p-4">
        <div className="mb-2 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-primary">
          <Search className="size-4" aria-hidden /> 추리 미션 {multi ? '· 여러 개 고르기' : ''}
        </div>
        <p className="text-[15px] font-semibold leading-relaxed" style={{ wordBreak: 'keep-all' }}>{q.question[level]}</p>
      </div>

      <div className="space-y-2">
        {q.options.map((opt) => {
          const on = picked.includes(opt.id);
          const isAnswer = q.answer.includes(opt.id);
          let cls = 'border-base-content/15 hover:border-primary/60 bg-base-200/50';
          if (judged !== null) {
            if (isAnswer) cls = 'border-success bg-success/15';
            else if (on) cls = 'border-error bg-error/15';
            else cls = 'border-base-content/10 opacity-60';
          } else if (on) {
            cls = 'border-primary bg-primary/15';
          }
          return (
            <button
              key={opt.id}
              type="button"
              disabled={judged === true}
              onClick={() => onToggle(opt.id)}
              className={`flex w-full items-center gap-3 rounded-box border p-3 text-left transition ${cls}`}
            >
              <span className={`flex size-6 shrink-0 items-center justify-center rounded-full border text-xs font-bold ${on ? 'border-primary text-primary' : 'border-base-content/30 text-base-content/50'}`}>
                {opt.id.toUpperCase()}
              </span>
              <span className="flex-1 text-sm" style={{ wordBreak: 'keep-all' }}>{opt.label}</span>
              {judged !== null && isAnswer && <CheckCircle2 className="size-5 text-success" aria-hidden />}
              {judged !== null && on && !isAnswer && <XCircle className="size-5 text-error" aria-hidden />}
            </button>
          );
        })}
      </div>

      {judged === false && (
        <div className="rounded-box border border-warning/40 bg-warning/10 p-3 text-sm text-warning">
          <div className="flex items-center gap-1.5 font-semibold"><XCircle className="size-4" aria-hidden /> 다시 생각해 볼까요?</div>
          {showHint && q.hint && (
            <p className="mt-1 flex items-start gap-1.5 text-base-content/80" style={{ wordBreak: 'keep-all' }}>
              <Lightbulb className="mt-0.5 size-4 shrink-0 text-warning" aria-hidden /> 힌트: {q.hint[level]}
            </p>
          )}
        </div>
      )}

      {judged === false ? (
        <button className="btn btn-outline btn-warning w-full gap-2" onClick={onRetry}>
          <RotateCcw className="size-4" aria-hidden /> 다시 고르기
        </button>
      ) : (
        <button className="btn btn-primary w-full gap-2" onClick={onSubmit} disabled={picked.length === 0 || saving || judged === true}>
          {saving ? <span className="loading loading-spinner loading-sm" /> : <CheckCircle2 className="size-4" aria-hidden />}
          정답 확인
        </button>
      )}
    </div>
  );
}

// ───────────────────────── 결과(해설) ─────────────────────────
function ResultView({ chapter, level, isLast, onNext }: { chapter: Chapter; level: Level; isLast: boolean; onNext: () => void }) {
  return (
    <div className="space-y-4">
      <div className="rounded-box border border-success/40 bg-success/10 p-4 fade-rise">
        <div className="flex items-center gap-2 text-success">
          <CheckCircle2 className="size-5" aria-hidden />
          <span className="font-bold">정답이에요! +{chapter.quest.points}점</span>
        </div>
        <p className="mt-2 leading-relaxed text-base-content/90" style={{ wordBreak: 'keep-all' }}>{chapter.quest.explanation[level]}</p>
      </div>

      <div className="flex items-center gap-3 rounded-box border border-primary/40 bg-base-200/70 p-3 seal-in">
        <span className="flex size-11 items-center justify-center rounded-full border border-primary bg-primary/20 text-primary">
          <BadgeIcon name={chapter.badge.icon} className="size-5" />
        </span>
        <div>
          <div className="text-[11px] text-base-content/50">배지 획득</div>
          <div className="font-bold text-primary">{chapter.badge.label}</div>
        </div>
        <BadgeCheck className="ml-auto size-5 text-success" aria-hidden />
      </div>

      <button className="btn btn-primary w-full gap-2" onClick={onNext}>
        {isLast ? '결과 보기' : '다음 미션으로'} <ArrowRight className="size-4" aria-hidden />
      </button>
    </div>
  );
}

// ───────────────────────── 완료 ─────────────────────────
function CompletionScreen({
  prog,
  mode,
  ctx,
  onSaveReflection,
  onReplay,
}: {
  prog: ProgressLike;
  mode: 'student' | 'preview';
  ctx: GameContext | null;
  onSaveReflection: (text: string) => void;
  onReplay: () => void;
}) {
  const navigate = useNavigate();
  const [reflection, setReflection] = useState(prog.reflections.epilogue ?? '');
  const [savedText, setSavedText] = useState(prog.reflections.epilogue ?? '');
  const [savingR, setSavingR] = useState(false);
  const dirty = reflection.trim() !== savedText.trim();

  async function saveR() {
    setSavingR(true);
    try {
      if (mode === 'student' && ctx) await saveReflection(ctx, 'epilogue', reflection);
      onSaveReflection(reflection.trim());
      setSavedText(reflection.trim());
    } finally {
      setSavingR(false);
    }
  }

  return (
    <main className="mx-auto flex min-h-[100dvh] max-w-2xl flex-col items-center justify-center px-5 py-16 text-center">
      <div className="relative mb-6 w-full overflow-hidden rounded-box border border-primary/30 cinematic-letterbox">
        <div className="aspect-[16/6]"><CinematicScene scene="liberation-dawn" className="h-full w-full" /></div>
      </div>
      <Trophy className="mb-2 size-10 text-warning" aria-hidden />
      <h1 className="text-2xl font-bold text-primary">모든 미션을 마쳤어요!</h1>
      <p className="mx-auto mt-3 max-w-lg text-sm leading-relaxed text-base-content/80" style={{ wordBreak: 'keep-all' }}>
        1940년 창설부터 1945년 광복까지, 당신은 한국광복군의 5년을 사료로 추리했습니다.
        김구는 광복 소식에 “하늘이 무너지는 듯하다”고 했지요. 우리 손으로 끝맺지 못한 <b className="text-primary">‘아직 오지 않은 광복’</b>의 의미를
        오늘 당신의 눈으로 다시 새겼습니다.
      </p>

      <div className="mt-5 flex items-center gap-4">
        <div className="rounded-box border border-primary/30 bg-base-200/70 px-5 py-3">
          <div className="text-xs text-base-content/50">최종 점수</div>
          <div className="text-2xl font-bold text-primary">{prog.score}<span className="text-sm font-normal text-base-content/50"> / {totalPoints}</span></div>
        </div>
        <div className="rounded-box border border-primary/30 bg-base-200/70 px-5 py-3">
          <div className="text-xs text-base-content/50">획득 배지</div>
          <div className="text-2xl font-bold text-primary">{prog.badges.length}<span className="text-sm font-normal text-base-content/50"> / {chapters.length}</span></div>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap justify-center gap-2">
        {chapters.map((c) => (
          <span key={c.id} className={`inline-flex size-9 items-center justify-center rounded-full border ${prog.badges.includes(c.badge.label) ? 'border-primary bg-primary/20 text-primary' : 'border-base-content/15 text-base-content/25'}`} title={c.badge.label}>
            <BadgeIcon name={c.badge.icon} className="size-4" />
          </span>
        ))}
      </div>

      {/* 한 문장 소감(서술형) */}
      <div className="mt-6 w-full max-w-lg rounded-box border border-primary/30 bg-base-200/70 p-4 text-left">
        <label htmlFor="reflection" className="flex items-center gap-1.5 text-sm font-bold text-primary">
          <PenLine className="size-4" aria-hidden /> 오늘의 한 문장
        </label>
        <p className="mt-1 text-xs text-base-content/60" style={{ wordBreak: 'keep-all' }}>
          당신이 새긴 ‘아직 오지 않은 광복’의 의미를 한 문장으로 적어 보세요. {mode === 'preview' && '(미리보기: 저장 안 됨)'}
        </p>
        <textarea
          id="reflection"
          className="textarea mt-2 w-full bg-base-100"
          rows={2}
          maxLength={200}
          value={reflection}
          onChange={(e) => setReflection(e.target.value)}
          placeholder="예) 광복은 거저 온 것이 아니라, 우리 손으로 싸우려 한 사람들의 선택이 쌓인 결과다."
        />
        <div className="mt-2 flex items-center justify-between">
          <span className="text-[11px] text-base-content/45">{reflection.length}/200 {!dirty && savedText && '· 저장됨 ✓'}</span>
          <button className="btn btn-primary btn-sm gap-1.5" onClick={saveR} disabled={savingR || !dirty || reflection.trim().length === 0}>
            {savingR ? <span className="loading loading-spinner loading-xs" /> : <CheckCircle2 className="size-4" aria-hidden />} 소감 저장
          </button>
        </div>
      </div>

      <div className="mt-7 flex gap-2">
        <button className="btn btn-outline gap-2" onClick={onReplay}><RotateCcw className="size-4" aria-hidden /> 다시 하기</button>
        {mode === 'student' ? (
          <button className="btn btn-primary gap-2" onClick={() => navigate('/student')}><Home className="size-4" aria-hidden /> 내 학급으로</button>
        ) : (
          <button className="btn btn-primary gap-2" onClick={() => navigate('/teacher')}><Home className="size-4" aria-hidden /> 대시보드로</button>
        )}
      </div>
    </main>
  );
}
