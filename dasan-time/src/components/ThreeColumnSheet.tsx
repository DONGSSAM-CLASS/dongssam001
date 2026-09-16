import type { ReactNode } from 'react';
import { UI_TEXT } from '../content/lessons';

export interface SheetRow {
  id: string;
  label: string;
  help: string;
  field: ReactNode;
}

/**
 * 3단 작성표: 항목 | 이렇게 써 볼까요? | 내가 쓴 내용
 *
 * 넓은 화면에서는 3열 표처럼, 좁은 화면(휴대폰)에서는 카드처럼 보인다.
 * 표 구조와 카드 구조를 따로 두면 입력칸이 화면에 두 번 생겨 읽기 프로그램이 두 번 읽는다.
 * 그래서 `md:contents` 로 한 벌만 두고 배치만 바꾼다.
 */
export default function ThreeColumnSheet({ rows }: { rows: SheetRow[] }) {
  return (
    <div className="w-full md:grid md:grid-cols-[10rem_minmax(0,1fr)_minmax(0,1.2fr)] md:gap-x-3 md:gap-y-2">
      {/* 넓은 화면에서만 보이는 머리글 */}
      <p className="hidden px-3 text-sm font-semibold opacity-70 md:block">{UI_TEXT.columnItem}</p>
      <p className="hidden px-3 text-sm font-semibold opacity-70 md:block">{UI_TEXT.columnHelp}</p>
      <p className="hidden px-3 text-sm font-semibold opacity-70 md:block">{UI_TEXT.columnMine}</p>

      {rows.map((row) => (
        <div key={row.id} className="mb-4 rounded-2xl bg-base-200 p-4 md:contents">
          <p className="font-bold md:rounded-l-2xl md:bg-base-200 md:px-3 md:py-4">{row.label}</p>
          <p className="mt-1 mb-3 text-sm opacity-80 md:m-0 md:bg-base-200/50 md:px-3 md:py-4">
            <span className="font-semibold md:hidden">{UI_TEXT.columnHelp} </span>
            {row.help}
          </p>
          <div className="md:rounded-r-2xl md:bg-base-200/30 md:px-3 md:py-4">{row.field}</div>
        </div>
      ))}
    </div>
  );
}
