import type { ReactNode } from 'react';
import type { Figure, Level, Quest } from '../types';
import { GlossaryText } from './GlossaryText';
import { portraitDataUrl } from './portrait';

/**
 * 대화창 (1탄과 같은 모양).
 * 인물 소개와 그 근거(sourceNote)·차림새 근거를 함께 보여 준다.
 * 2탄에서는 해설사처럼 상황에 따라 다른 말을 하는 인물을 위해 `speech` 와 `extra` 를 더했다.
 */
export function Dialogue({
  figure,
  level,
  quest,
  questDone,
  speech,
  extra,
  onStartQuest,
  onClose,
}: {
  figure: Figure;
  level: Level;
  quest: Quest | null;
  questDone: boolean;
  /** 인물 소개 대신 들려줄 말 (문단 배열) */
  speech?: string[];
  /** 추가 버튼 */
  extra?: ReactNode;
  onStartQuest(): void;
  onClose(): void;
}) {
  return (
    <div className="dialogue frame" role="dialog" aria-label={`${figure.name}과(와)의 대화`}>
      <div className="dialogue-head">
        <img
          className="dialogue-portrait"
          src={portraitDataUrl(figure)}
          alt={`${figure.name} 초상`}
          style={{ borderColor: figure.accent }}
        />
        <div>
          <div className="dialogue-name">
            {figure.name}
            {figure.hanja ? ` (${figure.hanja})` : ''}
            {figure.life ? ` · ${figure.life}` : ''}
          </div>
          <div className="dialogue-role">{figure.role}</div>
        </div>
      </div>

      {speech ? (
        <div className="dialogue-body">
          {speech.map((p, i) => (
            <p key={i} style={{ margin: i === 0 ? 0 : '8px 0 0' }}>
              <GlossaryText>{p}</GlossaryText>
            </p>
          ))}
        </div>
      ) : (
        <>
          <div className="dialogue-body">
            <GlossaryText>{figure.bio[level]}</GlossaryText>
          </div>
          <div className="source-cite" style={{ marginTop: 10 }}>
            근거 · {figure.sourceNote}
          </div>
          <div className="source-note" style={{ marginTop: 4 }}>
            차림새 · {figure.appearance.note}
          </div>
        </>
      )}

      {quest && (
        <div className="dialogue-body dialogue-quest">
          <strong style={{ color: 'var(--brass)' }}>
            ［{quest.dateLabel}］ {quest.title}
          </strong>
          <div style={{ marginTop: 4 }}>
            <GlossaryText>{quest.briefing[level]}</GlossaryText>
          </div>
        </div>
      )}

      <div className="dialogue-actions">
        {quest && (
          <button className="btn primary" onClick={onStartQuest} autoFocus>
            기록을 시작한다
          </button>
        )}
        {!quest && questDone && (
          <span className="tag" style={{ alignSelf: 'center' }}>
            이분께 들은 이야기는 모두 기록했다
          </span>
        )}
        {extra}
        <button className="btn ghost" onClick={onClose}>
          닫기
        </button>
      </div>
    </div>
  );
}
