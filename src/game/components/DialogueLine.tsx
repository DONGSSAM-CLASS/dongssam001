import { figures } from '../figures';
import type { Dialogue, Level, Source } from '../types';
import { FigureAvatar } from './FigureAvatar';
import { SourceCard } from './SourceCard';

/**
 * 등장인물 대사 말풍선. 대사에 연결된 사료가 있으면 대사 바로 아래에 사료 카드(원문·해석·APA)를 붙인다.
 */
export function DialogueLine({
  dialogue,
  level,
  source,
}: {
  dialogue: Dialogue;
  level: Level;
  source?: Source;
}) {
  const fig = figures[dialogue.figureId];
  return (
    <div className="fade-rise">
      <div className="flex items-start gap-3">
        <FigureAvatar figureId={dialogue.figureId} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-baseline gap-x-2">
            <span className="font-bold text-primary">{fig?.name ?? dialogue.figureId}</span>
            {fig?.hanja && <span className="text-xs text-base-content/50">{fig.hanja}</span>}
            <span className="text-xs text-base-content/60">· {fig?.role}</span>
            {fig && !fig.inTextbook && (
              <span className="badge badge-xs badge-secondary badge-outline">교과서 밖 인물</span>
            )}
          </div>
          <div className="mt-1 rounded-box rounded-tl-none border border-base-content/10 bg-base-100/70 px-4 py-3 leading-relaxed text-base-content/95" style={{ wordBreak: 'keep-all' }}>
            {dialogue.line[level]}
          </div>
        </div>
      </div>
      {source && (
        <div className="mt-2 sm:ml-[60px]">
          <SourceCard source={source} level={level} />
        </div>
      )}
    </div>
  );
}
