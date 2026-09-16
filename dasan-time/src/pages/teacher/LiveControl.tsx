import { useEffect, useState } from 'react';
import {
  Clock,
  EyeOff,
  Heart,
  Images,
  KeyRound,
  Lock,
  LockOpen,
  Maximize2,
  Users,
  Vote,
  X,
} from 'lucide-react';
import { useTeacher } from '../../app/TeacherContext';
import {
  hideEmotion,
  setSessionState,
  updateClass,
  watchAllBoards,
  watchAllEmotions,
  watchAllGallery,
  watchAllVotes,
} from '../../lib/db';
import WordCloud, { tallyWords } from '../../components/WordCloud';
import PassCard from '../../components/PassCard';
import { EmptyState, ErrorNotice, Loading } from '../../components/States';
import {
  S1_A3_GROUP,
  S2_COMPARE_COLS,
  S2_COMPARE_ROWS,
  SESSIONS,
  type SessionKey,
} from '../../content/lessons';
import type { EmotionEntry, GalleryItem, GroupBoard, VoteDoc } from '../../lib/types';

type Projector = 'none' | 'code' | 'emotions' | 'gallery';

export default function LiveControl() {
  const { cls, loading } = useTeacher();
  const [emotions, setEmotions] = useState<EmotionEntry[]>([]);
  const [gallery, setGallery] = useState<GalleryItem[]>([]);
  const [boards, setBoards] = useState<GroupBoard[]>([]);
  const [votes, setVotes] = useState<VoteDoc[]>([]);
  const [projector, setProjector] = useState<Projector>('none');
  const [error, setError] = useState('');
  const [common, setCommon] = useState({ start: '20:00', end: '21:00' });

  useEffect(() => {
    if (!cls) return;
    setCommon(cls.commonTime ?? { start: '20:00', end: '21:00' });
    const stops = [
      watchAllEmotions(cls.id, setEmotions),
      watchAllGallery(cls.id, setGallery),
      watchAllBoards(cls.id, setBoards),
      watchAllVotes(cls.id, setVotes),
    ];
    return () => stops.forEach((s) => s());
  }, [cls]);

  if (loading) return <Loading />;
  if (!cls) {
    return <EmptyState title="학급을 먼저 골라 주세요" description="대시보드에서 학급을 만들어 주세요." />;
  }

  async function run(fn: () => Promise<unknown>) {
    setError('');
    try {
      await fn();
    } catch (err) {
      setError(err instanceof Error ? err.message : '처리하지 못했어요.');
    }
  }

  // 동료 평가 결과 집계
  const voteTally = new Map<string, number>();
  votes.forEach((v) => v.picks.forEach((p) => voteTally.set(p, (voteTally.get(p) ?? 0) + 1)));
  const topVotes = Math.max(0, ...voteTally.values());

  if (projector !== 'none') {
    return (
      <ProjectorView
        kind={projector}
        cls={cls}
        emotions={emotions}
        gallery={gallery}
        voteTally={voteTally}
        onClose={() => setProjector('none')}
      />
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <h1 className="text-2xl font-extrabold">수업 진행</h1>
      {error && <ErrorNotice message={error} />}

      {/* 차시 열기/잠그기 */}
      <section className="card rounded-2xl bg-base-100 shadow-sm">
        <div className="card-body gap-3 p-4">
          <h2 className="card-title text-base">차시 열기 · 잠그기</h2>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {SESSIONS.map((s) => (
              <SessionToggle
                key={s.key}
                label={s.title}
                state={cls.sessions[s.key]}
                onChange={(next) => void run(() => setSessionState(cls.id, s.key as SessionKey, next))}
              />
            ))}
          </div>
        </div>
      </section>

      {/* 제출물 수정 잠금 · 학급 공동 시간 */}
      <section className="card rounded-2xl bg-base-100 shadow-sm">
        <div className="card-body gap-4 p-4">
          <label className="label cursor-pointer justify-start gap-3 px-0">
            <input
              type="checkbox"
              className="toggle toggle-primary"
              checked={cls.editLocked}
              onChange={(e) => void run(() => updateClass(cls.id, { editLocked: e.target.checked }))}
            />
            <span className="label-text font-bold">
              {cls.editLocked ? (
                <Lock className="mr-1 inline h-4 w-4" aria-hidden />
              ) : (
                <LockOpen className="mr-1 inline h-4 w-4" aria-hidden />
              )}
              제출물 수정 잠금
            </span>
          </label>

          <div>
            <p className="mb-2 flex items-center gap-2 font-bold">
              <Clock className="h-5 w-5 text-success" aria-hidden />
              학급 공동 다산초당 시간
            </p>
            <div className="flex flex-wrap items-center gap-2">
              <input
                type="time"
                className="input input-bordered rounded-2xl"
                aria-label="공동 시간 시작"
                value={common.start}
                onChange={(e) => setCommon((c) => ({ ...c, start: e.target.value }))}
              />
              <span>~</span>
              <input
                type="time"
                className="input input-bordered rounded-2xl"
                aria-label="공동 시간 종료"
                value={common.end}
                onChange={(e) => setCommon((c) => ({ ...c, end: e.target.value }))}
              />
              <button
                type="button"
                className="btn btn-primary rounded-2xl"
                onClick={() => void run(() => updateClass(cls.id, { commonTime: common }))}
              >
                저장
              </button>
              <button
                type="button"
                className="btn btn-ghost rounded-2xl"
                onClick={() => void run(() => updateClass(cls.id, { commonTime: null }))}
              >
                쓰지 않기
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* 프로젝터 모드 */}
      <section className="card rounded-2xl bg-base-100 shadow-sm">
        <div className="card-body gap-3 p-4">
          <h2 className="card-title text-base">크게 보기 (프로젝터 모드)</h2>
          <div className="flex flex-wrap gap-2">
            <button type="button" className="btn btn-outline gap-2 rounded-2xl" onClick={() => setProjector('code')}>
              <KeyRound className="h-4 w-4" aria-hidden />
              학급 코드
            </button>
            <button type="button" className="btn btn-outline gap-2 rounded-2xl" onClick={() => setProjector('emotions')}>
              <Heart className="h-4 w-4" aria-hidden />
              감정 지도
            </button>
            <button type="button" className="btn btn-outline gap-2 rounded-2xl" onClick={() => setProjector('gallery')}>
              <Images className="h-4 w-4" aria-hidden />
              갤러리
            </button>
          </div>
        </div>
      </section>

      {/* 감정 지도 관리 */}
      <section className="card rounded-2xl bg-base-100 shadow-sm">
        <div className="card-body gap-3 p-4">
          <h2 className="card-title text-base">
            <Heart className="h-5 w-5 text-primary" aria-hidden />
            학급 감정 지도
          </h2>
          <WordCloud items={emotions} />
          <details className="collapse-arrow collapse rounded-2xl bg-base-200">
            <summary className="collapse-title font-semibold">부적절한 낱말 숨기기</summary>
            <div className="collapse-content">
              <ul className="flex flex-wrap gap-2">
                {emotions.map((e) => (
                  <li key={e.id}>
                    <button
                      type="button"
                      className={`btn btn-xs gap-1 rounded-2xl ${e.hidden ? 'btn-ghost' : 'btn-outline'}`}
                      onClick={() => void run(() => hideEmotion(cls.id, e.id, !e.hidden))}
                    >
                      {e.hidden ? <EyeOff className="h-3 w-3" aria-hidden /> : null}
                      {e.word}
                    </button>
                  </li>
                ))}
              </ul>
              {emotions.length === 0 && <p className="text-sm opacity-70">아직 올라온 낱말이 없어요.</p>}
            </div>
          </details>
        </div>
      </section>

      {/* 갤러리 · 동료 평가 */}
      <section className="card rounded-2xl bg-base-100 shadow-sm">
        <div className="card-body gap-3 p-4">
          <h2 className="card-title text-base">
            <Vote className="h-5 w-5 text-accent" aria-hidden />
            동료 평가
          </h2>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              className="btn btn-outline rounded-2xl"
              onClick={() => void run(() => updateClass(cls.id, { voteClosed: !cls.voteClosed }))}
            >
              {cls.voteClosed ? '투표 다시 열기' : '투표 마감하기'}
            </button>
            <span className="text-sm opacity-70">{votes.length}명이 투표했어요.</span>
          </div>
          {gallery.length === 0 ? (
            <EmptyState
              title="아직 올라온 출입증이 없어요"
              description="학생들이 3차시 활동 5를 제출하면 여기에 모여요."
            />
          ) : (
            <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {gallery
                .slice()
                .sort((a, b) => (voteTally.get(b.id) ?? 0) - (voteTally.get(a.id) ?? 0))
                .map((item) => {
                  const count = voteTally.get(item.id) ?? 0;
                  const isTop = cls.voteClosed && count > 0 && count === topVotes;
                  return (
                    <li
                      key={item.id}
                      className={`rounded-2xl p-1 ${isTop ? 'border-4 border-accent' : ''}`}
                    >
                      <PassCard card={item.card} ownerLabel={item.alias} />
                      <p className="mt-1 text-center text-sm font-bold">
                        {count}표{isTop ? ' · 많이 뽑힌 카드' : ''}
                        {item.visible ? '' : ' · 갤러리에 올리지 않음'}
                      </p>
                    </li>
                  );
                })}
            </ul>
          )}
          {cls.voteClosed && votes.length > 0 && (
            <details className="collapse-arrow collapse rounded-2xl bg-base-200">
              <summary className="collapse-title font-semibold">고른 이유 모아 보기</summary>
              <div className="collapse-content">
                <ul className="list-inside list-disc text-sm">
                  {votes
                    .filter((v) => v.reason.trim())
                    .map((v) => (
                      <li key={v.id}>{v.reason}</li>
                    ))}
                </ul>
              </div>
            </details>
          )}
        </div>
      </section>

      {/* 모둠 보드 모아 보기 */}
      <section className="card rounded-2xl bg-base-100 shadow-sm">
        <div className="card-body gap-3 p-4">
          <h2 className="card-title text-base">
            <Users className="h-5 w-5 text-secondary" aria-hidden />
            모둠 보드 모아 보기
          </h2>
          <BoardGroup
            title={S1_A3_GROUP.title}
            boards={boards.filter((b) => b.activityId === 's1_a3')}
            kind="notes"
          />
          <BoardGroup
            title="2차시 활동 4-1 · 숏폼의 뇌 vs 다산의 뇌"
            boards={boards.filter((b) => b.activityId === 's2_a4_1')}
            kind="cells"
          />
        </div>
      </section>
    </div>
  );
}

function SessionToggle({
  label,
  state,
  onChange,
}: {
  label: string;
  state: 'locked' | 'open' | 'closed';
  onChange: (next: 'locked' | 'open' | 'closed') => void;
}) {
  return (
    <div className="rounded-2xl bg-base-200 p-3">
      <p className="mb-2 text-sm font-bold">{label}</p>
      <div className="join">
        {(['locked', 'open', 'closed'] as const).map((s) => (
          <button
            key={s}
            type="button"
            className={`btn join-item btn-sm rounded-2xl ${state === s ? 'btn-primary' : 'btn-outline'}`}
            aria-pressed={state === s}
            onClick={() => onChange(s)}
          >
            {s === 'locked' ? '잠김' : s === 'open' ? '열림' : '닫음'}
          </button>
        ))}
      </div>
    </div>
  );
}

function BoardGroup({
  title,
  boards,
  kind,
}: {
  title: string;
  boards: GroupBoard[];
  kind: 'notes' | 'cells';
}) {
  if (boards.length === 0) {
    return (
      <div className="rounded-2xl bg-base-200 p-4">
        <p className="font-bold">{title}</p>
        <p className="mt-1 text-sm opacity-70">아직 모둠이 적은 내용이 없어요.</p>
      </div>
    );
  }
  return (
    <div>
      <p className="mb-2 font-bold">{title}</p>
      <div className="grid gap-3 lg:grid-cols-2">
        {boards
          .slice()
          .sort((a, b) => a.group - b.group)
          .map((b) => (
            <div key={b.id} className="rounded-2xl bg-base-200 p-3">
              <p className="font-semibold">{b.group}모둠</p>
              {kind === 'notes' ? (
                <ul className="mt-2 list-inside list-disc text-sm">
                  {b.notes.map((n) => (
                    <li key={n.id}>
                      {n.text} <span className="opacity-60">({n.author})</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <table className="mt-2 w-full table-fixed text-sm">
                  <tbody>
                    {S2_COMPARE_ROWS.map((row) => (
                      <tr key={row.id} className="align-top">
                        <th className="w-28 py-1 text-left font-semibold">{row.label}</th>
                        {S2_COMPARE_COLS.map((col) => (
                          <td key={col.id} className="py-1 pl-2">
                            {b.cells[`${row.id}__${col.id}`] || '—'}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
              {b.lastEditor && (
                <p className="mt-2 text-xs opacity-60">마지막 수정: {b.lastEditor}</p>
              )}
            </div>
          ))}
      </div>
    </div>
  );
}

/** 전자칠판에 크게 띄우는 화면 */
function ProjectorView({
  kind,
  cls,
  emotions,
  gallery,
  voteTally,
  onClose,
}: {
  kind: Projector;
  cls: { code: string; name: string; teacherName: string };
  emotions: EmotionEntry[];
  gallery: GalleryItem[];
  voteTally: Map<string, number>;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-base-100 p-6">
      <div className="flex items-center justify-between">
        <p className="flex items-center gap-2 text-lg font-bold">
          <Maximize2 className="h-5 w-5" aria-hidden />
          {cls.name}
        </p>
        <button type="button" className="btn btn-ghost gap-1 rounded-2xl" onClick={onClose}>
          <X className="h-5 w-5" aria-hidden />
          닫기
        </button>
      </div>

      <div className="flex grow flex-col items-center justify-center overflow-auto">
        {kind === 'code' && (
          <>
            <p className="text-2xl font-bold opacity-70">{cls.teacherName} 선생님 · {cls.name}</p>
            <p className="mt-6 font-mono text-[14vw] font-extrabold leading-none tracking-[0.15em]">
              {cls.code}
            </p>
            <p className="mt-8 text-2xl">이 코드를 앱에 입력하면 우리 반에 들어올 수 있어요.</p>
          </>
        )}

        {kind === 'emotions' && (
          <div className="w-full max-w-5xl">
            <p className="mb-4 text-center text-3xl font-extrabold">우리 반 감정 지도</p>
            <WordCloud items={emotions} big />
            <p className="mt-4 text-center text-lg opacity-70">
              모두 {tallyWords(emotions).reduce((sum, t) => sum + t.count, 0)}개의 낱말이 모였어요.
            </p>
          </div>
        )}

        {kind === 'gallery' && (
          <div className="w-full max-w-6xl">
            <p className="mb-4 text-center text-3xl font-extrabold">우리 반 다산초당 출입증</p>
            {gallery.length === 0 ? (
              <p className="text-center text-xl opacity-70">아직 올라온 출입증이 없어요.</p>
            ) : (
              <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {gallery
                  .filter((g) => g.visible)
                  .sort((a, b) => (voteTally.get(b.id) ?? 0) - (voteTally.get(a.id) ?? 0))
                  .map((item) => (
                    <li key={item.id}>
                      <PassCard card={item.card} ownerLabel={item.alias} />
                      <p className="mt-1 text-center font-bold">{voteTally.get(item.id) ?? 0}표</p>
                    </li>
                  ))}
              </ul>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
