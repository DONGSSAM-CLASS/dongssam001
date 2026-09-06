import type { Exam, Item } from '../types/schema';
import { KICE_BOARD_URL } from '../constants';

/**
 * 문항의 "공식 PDF 보기" 링크를 만든다.
 * - questionPdfUrl 이 있으면 `링크#page=N` 딥링크(원칙 3).
 * - 없으면 회차의 게시판(boardUrl), 그것도 없으면 평가원 공식 기출 게시판으로 대체.
 * URL 을 지어내지 않는다 — questionPdfUrl 이 없으면 딥링크 대신 게시판으로만 보낸다.
 */
export function questionPdfLink(item: Item, exam: Exam | undefined): {
  href: string;
  isDeepLink: boolean;
} {
  if (exam?.questionPdfUrl) {
    const page = item.pdfPage ? `#page=${item.pdfPage}` : '';
    return { href: exam.questionPdfUrl + page, isDeepLink: !!item.pdfPage };
  }
  return { href: exam?.boardUrl || KICE_BOARD_URL, isDeepLink: false };
}

/** "정답 PDF 보기" 링크. 없으면 회차 게시판 → 평가원 공식 게시판으로 대체. */
export function answerPdfLink(exam: Exam | undefined): { href: string; available: boolean } {
  if (exam?.answerPdfUrl) return { href: exam.answerPdfUrl, available: true };
  return { href: exam?.boardUrl || KICE_BOARD_URL, available: false };
}

/** "2026학년도 수능" 처럼 표시 */
export function examLabel(exam: Exam | undefined): string {
  if (!exam) return '';
  return `${exam.schoolYear}학년도 ${exam.type}`;
}
