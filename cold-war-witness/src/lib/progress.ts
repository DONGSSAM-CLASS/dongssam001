/**
 * 챕터 진행 단계 계산 — 화면과 교사 대시보드가 같이 쓴다.
 */
import type { Chapter, ChapterId } from '../types/content';
import type { ChapterStep, StudentDoc } from '../types/db';

export const STEPS: ChapterStep[] = ['intro', 's1', 's2', 's3', 's4', 's5', 'reflect', 'wrapup', 'done'];

export function nextStep(step: ChapterStep): ChapterStep {
  const i = STEPS.indexOf(step);
  return STEPS[Math.min(i + 1, STEPS.length - 1)];
}

export function stepIndex(step: ChapterStep | undefined): number {
  return step ? STEPS.indexOf(step) : -1;
}

/** 's3' → 3, 그 밖에는 null */
export function sceneNoOf(step: ChapterStep | undefined): number | null {
  if (!step) return null;
  const m = /^s([1-5])$/.exec(step);
  return m ? Number(m[1]) : null;
}

export function stepLabel(step: ChapterStep | undefined): string {
  if (!step) return '시작 전';
  const no = sceneNoOf(step);
  if (no) return `장면 ${no}`;
  return { intro: '인트로', reflect: '성찰 쓰기', wrapup: '마무리', done: '완료' }[step as 'intro' | 'reflect' | 'wrapup' | 'done'];
}

export type ChapterStatus = 'notStarted' | 'inProgress' | 'done';

export function chapterStatus(student: Pick<StudentDoc, 'progress'>, id: ChapterId): ChapterStatus {
  const step = student.progress[id];
  if (!step) return 'notStarted';
  return step === 'done' ? 'done' : 'inProgress';
}

/** 글자 수 세기: 앞뒤 공백을 빼고, 이어진 공백은 한 칸으로 센다. (공백만 채워 넘기는 것을 막기 위해) */
export function countChars(text: string | undefined): number {
  return (text ?? '').trim().replace(/\s+/g, ' ').length;
}

/** 최소 글자 수를 넘긴 AI 연결 질문 답변 수 */
export function answeredCount(chapter: Chapter, answers: Record<string, string>): number {
  return chapter.reflection.questions.filter((q) => countChars(answers[q.id]) >= chapter.reflection.minLength)
    .length;
}

export function reflectionReady(chapter: Chapter, answers: Record<string, string>): boolean {
  return answeredCount(chapter, answers) >= chapter.reflection.minAnswers;
}

/** 챕터 마무리 성찰 최소 글자 수 */
export const WRAPUP_MIN = 10;
