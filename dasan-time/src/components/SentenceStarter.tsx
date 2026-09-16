import { MessageSquareQuote } from 'lucide-react';

/** 문장 시작 도우미 칩. 누르면 입력칸 맨 뒤에 시작 문장을 붙여 준다. */
export default function SentenceStarter({
  starters,
  onPick,
}: {
  starters: string[];
  onPick: (text: string) => void;
}) {
  if (starters.length === 0) return null;
  return (
    <div className="mt-2">
      <p className="mb-1 flex items-center gap-1 text-xs font-semibold opacity-70">
        <MessageSquareQuote className="h-4 w-4" aria-hidden />
        문장 시작 도우미
      </p>
      <div className="flex flex-wrap gap-2">
        {starters.map((s) => (
          <button
            key={s}
            type="button"
            className="btn btn-outline btn-xs h-auto min-h-8 rounded-2xl py-1 text-xs"
            onClick={() => onPick(s)}
          >
            {s}…
          </button>
        ))}
      </div>
    </div>
  );
}
