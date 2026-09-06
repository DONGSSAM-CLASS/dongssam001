import type { Item } from '../types/schema';
import { useData } from '../data/DataContext';
import { answerPdfLink, examLabel, questionPdfLink } from '../lib/pdfLink';
import ItemTypeTag from './ItemTypeTag';

/**
 * 문항 카드 (기능 3).
 * 학년도·시행·문항번호·주제·유형 태그 + 공식/정답 PDF 링크.
 * 저작권상 문항 원문은 표시하지 않는다(주제 요약 메타데이터만).
 */
export default function ItemCard({ item }: { item: Item }) {
  const { examById } = useData();
  const exam = examById.get(item.examId);
  const q = questionPdfLink(item, exam);
  const a = answerPdfLink(exam);

  return (
    <div className="rounded-lg border bg-white p-3 shadow-sm">
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm">
        <span className="font-semibold text-slate-700">{examLabel(exam)}</span>
        <span className="text-slate-400">·</span>
        <span className="font-medium text-slate-600">{item.number}번</span>
        <ItemTypeTag type={item.itemType} />
        {!item.verified && (
          <span className="rounded bg-yellow-100 px-1.5 py-0.5 text-xs font-medium text-yellow-800">
            검수 대기
          </span>
        )}
      </div>

      <p className="mt-1.5 text-[15px] font-medium text-slate-900">
        {item.topic ?? <span className="text-slate-400">(주제 미입력)</span>}
      </p>

      {item.keywords.length > 0 && (
        <div className="mt-1 flex flex-wrap gap-1">
          {item.keywords.map((k) => (
            <span key={k} className="rounded bg-slate-100 px-1.5 py-0.5 text-xs text-slate-600">
              #{k}
            </span>
          ))}
        </div>
      )}

      <div className="mt-2.5 flex flex-wrap gap-2">
        <a
          href={q.href}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 rounded-md bg-blue-600 px-2.5 py-1.5 text-xs font-medium text-white hover:bg-blue-700"
        >
          공식 PDF 보기
          {q.isDeepLink && item.pdfPage ? ` (${item.pdfPage}쪽)` : ''}
        </a>
        <a
          href={a.href}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 rounded-md border border-slate-300 px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
        >
          {a.available ? '정답 PDF 보기' : '정답 (게시판)'}
        </a>
      </div>
    </div>
  );
}
