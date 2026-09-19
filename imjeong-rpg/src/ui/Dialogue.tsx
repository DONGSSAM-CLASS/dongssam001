import type { Figure, Level, Quest } from '../types';
import { GlossaryText } from './GlossaryText';

/**
 * NPC 대화창.
 * 인물 소개는 모두 사실에 근거한 것이며, 아래에 그 근거(sourceNote)를 함께 보여 준다.
 */
export function Dialogue({
  figure,
  level,
  quest,
  questDone,
  canRecruit,
  inParty,
  onStartQuest,
  onRecruit,
  onClose,
}: {
  figure: Figure;
  level: Level;
  quest: Quest | null;
  questDone: boolean;
  canRecruit: boolean;
  inParty: boolean;
  onStartQuest(): void;
  onRecruit(): void;
  onClose(): void;
}) {
  return (
    <div className="dialogue frame" role="dialog" aria-label={`${figure.name}과(와)의 대화`}>
      <div className="dialogue-head">
        <div className="dialogue-avatar" style={{ background: figure.accent + '33', color: figure.accent }}>
          <span aria-hidden>{figure.inTextbook ? '★' : '◆'}</span>
        </div>
        <div>
          <div className="dialogue-name">
            {figure.name}
            {figure.hanja ? ` (${figure.hanja})` : ''}
            {figure.life ? ` · ${figure.life}` : ''}
          </div>
          <div className="dialogue-role">{figure.role}</div>
        </div>
      </div>

      <div className="dialogue-body">
        <GlossaryText>{figure.bio[level]}</GlossaryText>
      </div>
      <div className="source-cite" style={{ marginTop: 10 }}>
        근거 · {figure.sourceNote}
      </div>

      {quest && (
        <div className="dialogue-body" style={{ marginTop: 12 }}>
          <strong style={{ color: 'var(--brass)' }}>［{quest.dateLabel}］ {quest.title}</strong>
          <div style={{ marginTop: 4 }}>
            <GlossaryText>{quest.briefing[level]}</GlossaryText>
          </div>
        </div>
      )}

      <div className="dialogue-actions">
        {quest && (
          <button className="btn primary" onClick={onStartQuest}>
            임무를 맡는다
          </button>
        )}
        {!quest && questDone && (
          <span className="tag" style={{ alignSelf: 'center' }}>
            이 인물의 임무는 모두 기록했다
          </span>
        )}
        {canRecruit && !inParty && (
          <button className="btn" onClick={onRecruit}>
            동지로 함께한다
          </button>
        )}
        {inParty && (
          <span className="tag" style={{ alignSelf: 'center' }}>
            이미 함께하고 있다
          </span>
        )}
        <button className="btn ghost" onClick={onClose}>
          닫기
        </button>
      </div>
    </div>
  );
}
