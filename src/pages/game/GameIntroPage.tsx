import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookMarked, Clock, GraduationCap, LogOut, Play, RotateCcw, ShieldCheck, Sparkles } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { signOutAll } from '@/lib/authService';
import { loadProgress, startGame, type GameContext, type LoadedProgress } from '@/lib/gameService';
import { CinematicScene } from '@/game/scenes/CinematicScene';
import { chapters } from '@/game/story';
import type { Level } from '@/game/types';

/**
 * 게임 시작 화면 — 제목, 소개, 난이도(중/고) 선택, 이어하기.
 * 학생 계정으로 진입하며, 진행은 Firestore 에 저장되어 다시 로그인해도 이어서 할 수 있다.
 */
export default function GameIntroPage() {
  const navigate = useNavigate();
  const profile = useAuthStore((s) => s.profile);
  const user = useAuthStore((s) => s.user);

  const ctx: GameContext | null =
    profile?.role === 'student' && user
      ? { classId: profile.classId, number: profile.number, uid: user.uid }
      : null;

  const [progress, setProgress] = useState<LoadedProgress>(null);
  const [loading, setLoading] = useState<boolean>(() => Boolean(ctx));
  const [starting, setStarting] = useState(false);
  const [level, setLevel] = useState<Level>('middle');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!ctx) return; // 학생 계정이 아니면 불러올 진행이 없다(loading 은 false 로 시작)
    let alive = true;
    loadProgress(ctx)
      .then((p) => {
        if (!alive) return;
        setProgress(p);
        if (p) setLevel(p.level);
      })
      .catch((e) => alive && setError((e as Error).message))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ctx?.classId, ctx?.number]);

  async function begin() {
    if (!ctx) return;
    setStarting(true);
    setError(null);
    try {
      await startGame(ctx, level);
      navigate('/game/play');
    } catch (e) {
      setError((e as Error).message);
      setStarting(false);
    }
  }

  const done = progress?.completed.length ?? 0;
  const inProgress = progress && done > 0 && done < chapters.length;
  const finished = progress && done >= chapters.length;

  return (
    <div data-theme="gwangbok" className="min-h-full text-base-content">
      <div className="relative isolate min-h-[100dvh] cinematic-letterbox film-vignette overflow-hidden">
        <div className="absolute inset-0 -z-10 opacity-70">
          <CinematicScene scene="chongqing-night" className="h-full w-full" />
        </div>

        <main className="mx-auto flex min-h-[100dvh] max-w-3xl flex-col items-center justify-center gap-6 px-5 py-16">
          <div className="text-center">
            <div className="mb-3 inline-flex items-center gap-1.5 rounded-full border border-primary/40 bg-base-200/70 px-3 py-1 text-xs text-primary">
              <Sparkles className="size-3.5" aria-hidden /> 한국광복군 창설 기념 · 역사 추리 시뮬레이션
            </div>
            <h1 className="font-bold leading-tight tracking-tight text-base-content drop-shadow" style={{ wordBreak: 'keep-all' }}>
              <span className="block text-3xl text-primary sm:text-5xl">『아직 오지 않은 광복』</span>
              <span className="mt-2 block text-lg text-base-content/85 sm:text-2xl">1940년 9월, 그들이 걸었던 선택</span>
            </h1>
            <p className="mx-auto mt-4 max-w-xl text-sm leading-relaxed text-base-content/75 sm:text-base" style={{ wordBreak: 'keep-all' }}>
              당신은 대한민국 임시정부 한국광복군 총사령부의 신입 <b className="text-primary">기록병</b>입니다.
              실제 사료를 읽고 단서를 모아, 1940년부터 1945년까지 광복군이 걸어간 선택의 순간들을 시대 순서대로 추리하세요.
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-2 text-xs text-base-content/70">
            <span className="inline-flex items-center gap-1 rounded-full bg-base-200/70 px-3 py-1"><Clock className="size-3.5 text-secondary" aria-hidden /> 약 15~20분</span>
            <span className="inline-flex items-center gap-1 rounded-full bg-base-200/70 px-3 py-1"><BookMarked className="size-3.5 text-secondary" aria-hidden /> 실제 사료 · APA 출처</span>
            <span className="inline-flex items-center gap-1 rounded-full bg-base-200/70 px-3 py-1"><ShieldCheck className="size-3.5 text-secondary" aria-hidden /> 2022 개정 교육과정 연계</span>
          </div>

          {loading ? (
            <span className="loading loading-dots loading-lg text-primary" aria-label="불러오는 중" />
          ) : !ctx ? (
            <div className="rounded-box border border-warning/40 bg-base-200/80 p-5 text-center text-sm">
              학생 계정으로 로그인해야 게임을 진행할 수 있어요.
              <button className="btn btn-primary btn-sm mt-3 w-full" onClick={() => navigate('/join')}>학급코드로 입장하기</button>
            </div>
          ) : (
            <div className="w-full max-w-md rounded-box border border-primary/30 bg-base-200/85 p-5 shadow-2xl">
              {finished ? (
                <p className="mb-3 text-center text-sm text-success">이미 모든 미션을 마쳤어요! 다시 감상하거나 난이도를 바꿔 도전할 수 있어요.</p>
              ) : inProgress ? (
                <p className="mb-3 text-center text-sm text-base-content/80">
                  <b className="text-primary">{done}번째 미션</b>까지 진행했어요. 이어서 할까요?
                </p>
              ) : (
                <p className="mb-3 text-center text-sm text-base-content/80">난이도를 고르고 첫 미션을 시작하세요.</p>
              )}

              {/* 난이도 선택 (요구사항 7) */}
              <div className="mb-4">
                <div className="mb-1.5 flex items-center gap-1 text-xs font-semibold text-base-content/60">
                  <GraduationCap className="size-4 text-primary" aria-hidden /> 난이도
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {(['middle', 'high'] as Level[]).map((lv) => (
                    <button
                      key={lv}
                      type="button"
                      onClick={() => setLevel(lv)}
                      className={`rounded-box border p-3 text-left transition ${
                        level === lv ? 'border-primary bg-primary/15' : 'border-base-content/15 hover:border-primary/50'
                      }`}
                    >
                      <div className="font-bold text-base-content">{lv === 'middle' ? '중학생용' : '고등학생용'}</div>
                      <div className="mt-0.5 text-[11px] text-base-content/60" style={{ wordBreak: 'keep-all' }}>
                        {lv === 'middle' ? '쉬운 해석과 친절한 설명' : '원문 중심·심화 분석'}
                      </div>
                    </button>
                  ))}
                </div>
                <p className="mt-1.5 text-[11px] text-base-content/45">전체 내용은 같고 설명의 깊이만 달라져요.</p>
              </div>

              {error && <p className="mb-2 text-center text-xs text-error">{error}</p>}

              <button className="btn btn-primary w-full gap-2" onClick={begin} disabled={starting}>
                {starting ? <span className="loading loading-spinner loading-sm" /> : inProgress ? <RotateCcw className="size-4" /> : <Play className="size-4" />}
                {inProgress ? '이어서 하기' : finished ? '다시 하기' : '첫 미션 시작'}
              </button>

              <div className="mt-2 flex items-center justify-between text-xs">
                <button className="link link-hover text-base-content/60" onClick={() => navigate('/student')}>내 학급으로</button>
                <button className="inline-flex items-center gap-1 text-base-content/50 hover:text-base-content" onClick={() => signOutAll()}>
                  <LogOut className="size-3.5" aria-hidden /> 로그아웃
                </button>
              </div>
            </div>
          )}

          {/* 제작자 크레딧 (요구사항 6: 하단에 튀지 않게) */}
          <footer className="mt-4 text-center text-[11px] text-base-content/40">
            <p>제작 · 동쌤(김동은 선생님)</p>
          </footer>
        </main>
      </div>
    </div>
  );
}
