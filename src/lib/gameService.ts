/**
 * 『아직 오지 않은 광복』 게임 진행 저장 서비스.
 *
 * 학생 1명 = 문서 1개(`game_progress/{classId}_{number}`). 세션과 독립적이라
 * 학생은 웹사이트를 껐다가 다시 로그인해도 자기 계정으로 이어서 진행할 수 있다.
 * 진행은 챕터 완료 같은 "사건" 시점에만 저장하므로 디바운스 없이 즉시 기록한다.
 */
import { collection, doc, getDoc, getDocs, onSnapshot, orderBy, query, serverTimestamp, setDoc, where } from 'firebase/firestore';
import { db } from './firebase';
import type { GameLevel, GameProgressDoc } from '@/types/firestore';
import { chaptersById } from '@/game/story';

export function gameProgressDocId(classId: string, number: number): string {
  return `${classId}_${number}`;
}

export interface GameContext {
  classId: string;
  number: number;
  uid: string;
}

export type LoadedProgress = (GameProgressDoc & { id: string }) | null;

/** 진행 문서를 읽어 온다(없으면 null). */
export async function loadProgress(ctx: GameContext): Promise<LoadedProgress> {
  const ref = doc(db, 'game_progress', gameProgressDocId(ctx.classId, ctx.number));
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;
  return { id: snap.id, ...(snap.data() as GameProgressDoc) };
}

/** 난이도를 고르고 게임을 시작(또는 이어하기)한다. 기존 문서가 있으면 난이도만 갱신한다. */
export async function startGame(ctx: GameContext, level: GameLevel): Promise<GameProgressDoc & { id: string }> {
  const ref = doc(db, 'game_progress', gameProgressDocId(ctx.classId, ctx.number));
  const existing = await loadProgress(ctx);
  if (existing) {
    // 이미 진행 중이면 난이도만 바꾸고 이어한다(진행 초기화하지 않음)
    if (existing.level !== level) {
      await setDoc(ref, { level, updatedAt: serverTimestamp() }, { merge: true });
      return { ...existing, level };
    }
    return existing;
  }
  const firstChapter = 'ch1-why-army';
  const payload: GameProgressDoc = {
    classId: ctx.classId,
    number: ctx.number,
    uid: ctx.uid,
    level,
    completed: [],
    answers: {},
    attempts: {},
    badges: [],
    score: 0,
    currentChapter: firstChapter,
    startedAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };
  await setDoc(ref, payload);
  return { id: ref.id, ...payload };
}

export interface ChapterResult {
  chapterId: string;
  answer: string[];
  correct: boolean;
  earned: number;
  attempts: number;
  nextChapter: string;
}

/**
 * 한 챕터를 완료 처리하고 진행을 저장한다.
 * 정답이면 점수·배지를 더하고, 다음 챕터로 currentChapter 를 옮긴다.
 */
export async function completeChapter(
  ctx: GameContext,
  current: GameProgressDoc & { id: string },
  result: ChapterResult,
): Promise<GameProgressDoc & { id: string }> {
  const ref = doc(db, 'game_progress', gameProgressDocId(ctx.classId, ctx.number));
  const chapter = chaptersById[result.chapterId];
  const alreadyDone = current.completed.includes(result.chapterId);

  const completed = alreadyDone ? current.completed : [...current.completed, result.chapterId];
  const badgeLabel = chapter?.badge.label;
  const badges =
    result.correct && badgeLabel && !current.badges.includes(badgeLabel)
      ? [...current.badges, badgeLabel]
      : current.badges;
  // 재도전 시 중복 가산 방지: 이미 완료한 챕터면 점수를 다시 더하지 않는다
  const score = alreadyDone ? current.score : current.score + result.earned;

  const next: GameProgressDoc & { id: string } = {
    ...current,
    completed,
    answers: { ...current.answers, [result.chapterId]: result.answer },
    attempts: { ...current.attempts, [result.chapterId]: result.attempts },
    badges,
    score,
    currentChapter: result.nextChapter,
  };

  await setDoc(
    ref,
    {
      completed: next.completed,
      answers: next.answers,
      attempts: next.attempts,
      badges: next.badges,
      score: next.score,
      currentChapter: next.currentChapter,
      level: next.level,
      uid: ctx.uid,
      classId: ctx.classId,
      number: ctx.number,
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  );
  return next;
}

// ───────────────────────── 교사 대시보드 ─────────────────────────

export interface ClassGameProgress {
  members: number;
  started: number;
  finished: number;
  rows: (GameProgressDoc & { id: string })[];
}

/** 담당 교사: 학급의 게임 진행 현황을 한 번 읽어 온다. */
export async function listClassProgress(classId: string): Promise<(GameProgressDoc & { id: string })[]> {
  const snap = await getDocs(query(collection(db, 'game_progress'), where('classId', '==', classId), orderBy('number')));
  return snap.docs.map((d) => ({ id: d.id, ...(d.data() as GameProgressDoc) }));
}

/** 담당 교사: 학급의 게임 진행 현황을 실시간 구독한다. */
export function watchClassProgress(
  classId: string,
  cb: (rows: (GameProgressDoc & { id: string })[]) => void,
  onError?: (e: Error) => void,
) {
  return onSnapshot(
    query(collection(db, 'game_progress'), where('classId', '==', classId), orderBy('number')),
    (snap) => cb(snap.docs.map((d) => ({ id: d.id, ...(d.data() as GameProgressDoc) }))),
    (e) => onError?.(e),
  );
}
