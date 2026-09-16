import { useState } from 'react';
import { Lightbulb } from 'lucide-react';
import { UI_TEXT } from '../content/lessons';

/**
 * '예시 보기' 버튼.
 * 예시를 입력칸에 자동으로 채우지 않는다. 학생이 그대로 옮겨 적지 않도록 하기 위해서다.
 */
export default function ExampleToggle({ example }: { example: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="mt-1">
      <button
        type="button"
        className="btn btn-ghost btn-sm gap-1 rounded-2xl text-secondary"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        <Lightbulb className="h-4 w-4" aria-hidden />
        {UI_TEXT.example}
      </button>
      {open && (
        <div className="mt-2 rounded-2xl bg-secondary/10 p-3 text-sm">
          <p className="italic">“{example}”</p>
          <p className="mt-2 text-xs opacity-70">{UI_TEXT.exampleNotice}</p>
        </div>
      )}
    </div>
  );
}
