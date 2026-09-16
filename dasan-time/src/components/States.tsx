import type { ReactNode } from 'react';
import { Inbox } from 'lucide-react';
import { UI_TEXT } from '../content/lessons';

export function Loading({ label = UI_TEXT.loading }: { label?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 p-10" role="status">
      <span className="loading loading-spinner loading-lg text-primary" aria-hidden />
      <p className="opacity-70">{label}</p>
    </div>
  );
}

/** 빈 화면에는 반드시 안내 문구와 다음에 할 행동을 함께 보여 준다. */
export function EmptyState({
  title,
  description,
  action,
  icon,
}: {
  title: string;
  description: string;
  action?: ReactNode;
  icon?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-2xl bg-base-200 p-8 text-center">
      {icon ?? <Inbox className="h-10 w-10 opacity-40" aria-hidden />}
      <p className="text-lg font-bold">{title}</p>
      <p className="max-w-md text-sm opacity-75">{description}</p>
      {action}
    </div>
  );
}

export function ErrorNotice({ message }: { message: string }) {
  return (
    <div className="alert alert-error rounded-2xl" role="alert">
      <span>{message}</span>
    </div>
  );
}
