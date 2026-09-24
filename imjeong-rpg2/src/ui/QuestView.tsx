import type { Level, Quest, ResourceDelta, ResourceKey } from '../types';
import { RESOURCE_ICONS, RESOURCE_LABELS, stableShuffle } from '../engine/rules';
import { SourceCard } from './SourceCard';
import { GlossaryText } from './GlossaryText';
import { CinematicImage } from './CinematicImage';
import type { QuestAttempt } from '../store/gameStore';
import { blueprint } from '../data/blueprint';

const TRACK_LABEL: Record<Quest['track'], string> = {
  law: '헌법·제도',
  diplomacy: '외교',
  military: '군사',
  finance: '재정',
  propaganda: '언론',
  unity: '통합',
};

const KIND_HINT: Record<Quest['kind'], string> = {
  choice: '하나를 고르세요',
  multi: '해당하는 것을 모두 고르세요',
  order: '시간 순서대로 눌러 배열하세요 (다시 누르면 빠집니다)',
};

/** 퀘스트 풀이 화면 — 1탄과 같은 구성(브리핑 → 질문 → 사료로 확인 → 해설·사료·출처) */
export function QuestView({
  quest,
  attempt,
  level,
  onPick,
  onSubmit,
  onRetry,
  onClose,
}: {
  quest: Quest;
  attempt: QuestAttempt;
  level: Level;
  onPick(choiceId: string): void;
  onSubmit(): void;
  onRetry(): void;
  onClose(): void;
}) {
  const choices = quest.kind === 'order' ? quest.choices : stableShuffle(quest.choices, quest.id);
  const ready = quest.kind === 'order' ? attempt.picked.length === quest.choices.length : attempt.picked.length > 0;
  const pillar = blueprint.find((b) => b.key === quest.blueprint);

  return (
    <div className="quest-overlay" role="dialog" aria-label={quest.title}>
      <div className="quest-sheet">
        <div className="quest-meta">
          <span className={`tag ${quest.track}`}>{TRACK_LABEL[quest.track]}</span>
          <span>{quest.dateLabel}</span>
          <span>·</span>
          <span>{quest.act === 6 ? '에필로그' : `제${quest.act}막`}</span>
        </div>
        <h2 className="quest-title">{quest.title}</h2>
        {/* public/assets/higgsfield/quest-<퀘스트 id>.jpg 가 있으면 장면 삽화가 뜬다 */}
        <CinematicImage
          name={`quest-${quest.id}`}
          alt={`${quest.title} 장면 삽화`}
          className="quest-cinematic"
          caption={`${quest.dateLabel} · ${quest.title} (삽화 — 사료가 아닙니다)`}
        />
        <p className="quest-brief">
          <GlossaryText>{quest.briefing[level]}</GlossaryText>
        </p>

        <div className="quest-question">
          <GlossaryText>{quest.question[level]}</GlossaryText>
        </div>
        <div className="quest-meta" style={{ marginBottom: 10 }}>
          <span className="tag">{KIND_HINT[quest.kind]}</span>
        </div>

        <div className="choices">
          {choices.map((choice) => {
            const order = attempt.picked.indexOf(choice.id);
            const picked = order >= 0;
            let verdict: 'right' | 'wrong' | undefined;
            if (attempt.submitted) {
              const isAnswer = quest.answer.includes(choice.id);
              if (quest.kind === 'order') {
                verdict = picked ? (quest.answer[order] === choice.id ? 'right' : 'wrong') : undefined;
              } else if (picked || isAnswer) {
                verdict = isAnswer ? 'right' : 'wrong';
              }
            }
            return (
              <button
                key={choice.id}
                className="choice"
                data-picked={picked}
                data-verdict={verdict}
                disabled={attempt.submitted}
                onClick={() => onPick(choice.id)}
              >
                <span className="choice-mark">{quest.kind === 'order' && picked ? order + 1 : picked ? '✓' : ''}</span>
                <span style={{ flex: 1 }}>
                  <span className="choice-label">{choice.label}</span>
                  {attempt.submitted && (picked || quest.kind === 'order') && (
                    <span className="choice-cost">{choice.outcome[level]}</span>
                  )}
                </span>
              </button>
            );
          })}
        </div>

        {!attempt.submitted ? (
          <div className="dialogue-actions">
            <button className="btn primary" disabled={!ready} onClick={onSubmit}>
              사료로 확인한다
            </button>
            <button className="btn ghost" onClick={onClose}>
              나중에
            </button>
          </div>
        ) : (
          <div className="quest-result">
            <div className={`verdict ${attempt.correct ? 'right' : 'wrong'}`}>
              {attempt.correct
                ? `✓ 사료와 맞았습니다 — 「${quest.badge.icon} ${quest.badge.label}」 · 보훈 포인트 +${attempt.points}`
                : '✗ 사료와 어긋났습니다. 해설을 읽고 다시 풀어 보세요. (다시 풀어 맞히면 포인트 50)'}
            </div>
            {attempt.correct && pillar && (
              <div className="pillar-gain">
                📐 새 나라 설계도에 기둥이 섰습니다 — <strong>{pillar.icon} {pillar.label}</strong>
                <span> · 오늘: {pillar.today}</span>
              </div>
            )}
            <DeltaList delta={attempt.gained} />
            <div className="debrief">
              <GlossaryText>{quest.debrief[level]}</GlossaryText>
            </div>

            {quest.caveat && <div className="caveat">⚠ 확인할 점 · {quest.caveat}</div>}

            <div style={{ marginTop: 14 }}>
              <div className="source-cite" style={{ borderTop: 'none', paddingTop: 0 }}>
                이 판단의 근거가 된 사료 (눌러서 펼치기)
              </div>
              {quest.sources.map((source) => (
                <SourceCard key={source.id} source={source} level={level} />
              ))}
            </div>

            <div className="source-cite" style={{ marginTop: 12 }}>
              교육과정 연계 · {quest.curriculum}
            </div>

            <div className="dialogue-actions">
              {!attempt.correct && (
                <button className="btn primary" onClick={onRetry}>
                  다시 풀어 본다
                </button>
              )}
              <button className={attempt.correct ? 'btn primary' : 'btn'} onClick={onClose}>
                기록을 덮는다
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function DeltaList({ delta }: { delta: ResourceDelta }) {
  const entries = (Object.keys(delta) as ResourceKey[]).filter((k) => (delta[k] ?? 0) !== 0);
  if (entries.length === 0) return null;
  return (
    <div className="gain-list">
      {entries.map((key) => {
        const amount = delta[key] ?? 0;
        return (
          <span className={`gain ${amount > 0 ? 'up' : 'down'}`} key={key}>
            {RESOURCE_ICONS[key]} {RESOURCE_LABELS[key]} {amount > 0 ? '+' : ''}
            {amount.toLocaleString('ko-KR')}
          </span>
        );
      })}
    </div>
  );
}
