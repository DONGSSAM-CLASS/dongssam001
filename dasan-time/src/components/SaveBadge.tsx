import { CircleCheck, CircleAlert, LoaderCircle } from 'lucide-react';
import { UI_TEXT } from '../content/lessons';
import type { SaveState } from '../lib/useActivity';

/** 자동 저장 상태 표시. 색만이 아니라 아이콘+글자를 함께 쓴다. */
export default function SaveBadge({ state }: { state: SaveState }) {
  if (state === 'idle') return null;
  if (state === 'saving') {
    return (
      <span className="badge badge-ghost gap-1 rounded-2xl" role="status">
        <LoaderCircle className="h-3.5 w-3.5 animate-spin" aria-hidden />
        {UI_TEXT.saving}
      </span>
    );
  }
  if (state === 'error') {
    return (
      <span className="badge badge-error gap-1 rounded-2xl" role="status">
        <CircleAlert className="h-3.5 w-3.5" aria-hidden />
        {UI_TEXT.saveFailed}
      </span>
    );
  }
  return (
    <span className="badge badge-success gap-1 rounded-2xl" role="status">
      <CircleCheck className="h-3.5 w-3.5" aria-hidden />
      {UI_TEXT.saved}
    </span>
  );
}
