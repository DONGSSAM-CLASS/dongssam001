import { ClipboardCheck } from 'lucide-react';
import { RUBRIC, SESSION_RUBRIC, UI_TEXT, type SessionKey } from '../content/lessons';
import ReadAloudButton from './ReadAloudButton';

/** 차시 첫 화면에 고정되는 '오늘 이렇게 평가해요' 카드 */
export default function RubricCard({ sessionKey }: { sessionKey: SessionKey }) {
  const ids = SESSION_RUBRIC[sessionKey];
  if (ids.length === 0) return null;
  const items = RUBRIC.filter((r) => ids.includes(r.id));
  const spoken = `오늘 이렇게 평가해요. ${items.map((i) => i.easy).join(' ')}`;

  return (
    <section className="card rounded-2xl border border-info/30 bg-info/10 shadow-sm">
      <div className="card-body gap-2 p-4 sm:p-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="card-title text-base">
            <ClipboardCheck className="h-5 w-5" aria-hidden />
            {UI_TEXT.rubricTitle}
          </h2>
          <ReadAloudButton text={spoken} />
        </div>
        <ul className="list-inside list-disc space-y-1 text-sm">
          {items.map((item) => (
            <li key={item.id}>{item.easy}</li>
          ))}
        </ul>
      </div>
    </section>
  );
}
