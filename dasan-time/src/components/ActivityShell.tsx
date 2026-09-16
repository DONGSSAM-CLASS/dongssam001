import type { ReactNode } from 'react';
import { Lock, Send, Sparkles } from 'lucide-react';
import SaveBadge from './SaveBadge';
import ReadAloudButton from './ReadAloudButton';
import { UI_TEXT } from '../content/lessons';
import type { ActivityDraft } from '../lib/useActivity';

/**
 * 활동지 한 장을 감싸는 틀.
 * 제목 · 안내 · 저장 상태 · 제출 버튼 · 선생님 칭찬을 한곳에서 처리한다.
 */
export default function ActivityShell({
  title,
  icon,
  intro,
  draft,
  canSubmit,
  children,
  footer,
}: {
  title: string;
  icon: ReactNode;
  intro?: string;
  draft: ActivityDraft;
  canSubmit: boolean;
  children: ReactNode;
  footer?: ReactNode;
}) {
  if (draft.notOpen) {
    return (
      <div className="card rounded-2xl bg-base-100 shadow-sm">
        <div className="card-body items-center text-center">
          <Lock className="h-10 w-10 opacity-50" aria-hidden />
          <p className="text-lg font-bold">{UI_TEXT.locked}</p>
        </div>
      </div>
    );
  }

  return (
    <section className="card rounded-2xl bg-base-100 shadow-sm">
      <div className="card-body gap-4 p-4 sm:p-6">
        <header className="flex flex-wrap items-start justify-between gap-2">
          <h2 className="card-title flex items-center gap-2 text-lg">
            {icon}
            {title}
          </h2>
          <div className="flex items-center gap-2">
            {intro && <ReadAloudButton text={`${title}. ${intro}`} />}
            <SaveBadge state={draft.saveState} />
          </div>
        </header>

        {intro && <p className="text-base leading-relaxed opacity-85">{intro}</p>}

        {draft.locked && !draft.notOpen && (
          <div className="alert alert-warning rounded-2xl" role="status">
            <Lock className="h-5 w-5 shrink-0" aria-hidden />
            <span>{UI_TEXT.editLocked}</span>
          </div>
        )}

        {children}

        {draft.praise && (
          <div className="alert rounded-2xl border border-success/40 bg-success/10" role="status">
            <Sparkles className="h-5 w-5 shrink-0 text-success" aria-hidden />
            <span>
              <span className="font-bold">선생님 한마디 </span>
              {draft.praise}
            </span>
          </div>
        )}

        {footer}

        <div className="mt-2 flex flex-wrap items-center justify-end gap-3">
          {!canSubmit && draft.status !== 'submitted' && (
            <p className="text-sm opacity-70">{UI_TEXT.requiredHint}</p>
          )}
          {draft.status === 'submitted' && (
            <span className="badge badge-success rounded-2xl">{UI_TEXT.submitted}</span>
          )}
          <button
            type="button"
            className="btn btn-primary gap-2 rounded-2xl"
            disabled={!canSubmit || draft.locked}
            onClick={() => void draft.submit()}
          >
            <Send className="h-4 w-4" aria-hidden />
            {draft.status === 'submitted' ? UI_TEXT.resubmit : UI_TEXT.submit}
          </button>
        </div>
      </div>
    </section>
  );
}
