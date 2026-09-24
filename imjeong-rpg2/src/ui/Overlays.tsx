import { useState } from 'react';
import type { Level } from '../types';
import { acts } from '../data/quests';
import { getRelic } from '../data/relics';
import { CinematicImage } from './CinematicImage';
import { GlossaryText } from './GlossaryText';
import { POINTS } from '../engine/rules';

/* ───────────────────────── 조작 안내 ───────────────────────── */

const STEPS = [
  {
    icon: '👀',
    title: '내 눈으로 보고 걸어요',
    body: '이번에는 내가 직접 그 시대에 들어가 있어요. W A S D(또는 방향키)로 걷고, 화면을 끌어서 둘러봐요. 바닥을 누르면 그 자리까지 걸어가요. 태블릿은 왼쪽 아래 동그라미를 밀어요.',
  },
  {
    icon: '❗',
    title: '노란 느낌표가 있는 사람에게',
    body: '머리 위에 노란 느낌표가 뜬 사람이 임무를 줘요. 가까이 가서 바라보면 「스페이스」 안내가 떠요. 길을 잃으면 오른쪽 위 「데려다 주기」를 누르세요.',
  },
  {
    icon: '📜',
    title: '사료로 확인하고, 기록해요',
    body: '임무는 「그때 새 나라를 어떻게 만들었는지」를 물어요. 틀려도 괜찮아요. 진짜 역사 자료(사료)와 해설을 읽고 다시 풀면 돼요. 방 곳곳의 빛나는 두루마리(기록 조각)도 찾아보세요.',
  },
  {
    icon: '🎗️',
    title: '모은 마음을 전해요',
    body: '임무와 기록 조각으로 보훈 포인트를 모아요. 여행이 끝나면 보훈의 전당에서 임시정부를 지킨 분들께 기부하고 감사 편지를 써요. (게임 속 포인트는 실제 돈이 아니에요.)',
  },
];

export function Tutorial({ onClose }: { onClose(): void }) {
  const [step, setStep] = useState(0);
  const current = STEPS[step];
  const last = step === STEPS.length - 1;
  return (
    <div className="tutorial-overlay">
      <div className="tutorial-card frame">
        <div className="tutorial-icon" aria-hidden>
          {current.icon}
        </div>
        <div className="tutorial-step">
          {step + 1} / {STEPS.length}
        </div>
        <h2 className="tutorial-title">{current.title}</h2>
        <p className="tutorial-body">{current.body}</p>
        <div className="tutorial-dots" aria-hidden>
          {STEPS.map((s, i) => (
            <span key={s.title} className={i === step ? 'on' : ''} />
          ))}
        </div>
        <div className="dialogue-actions" style={{ justifyContent: 'center' }}>
          {step > 0 && (
            <button className="btn ghost" onClick={() => setStep((v) => v - 1)}>
              이전
            </button>
          )}
          <button className="btn primary" autoFocus onClick={() => (last ? onClose() : setStep((v) => v + 1))}>
            {last ? '시작하기' : '다음'}
          </button>
          {!last && (
            <button className="btn ghost" onClick={onClose}>
              건너뛰기
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/* ───────────────────────── 시대 전환 ───────────────────────── */

/**
 * 막이 바뀔 때 뜨는 시대 전환 화면.
 * 1탄 인수인계 문서의 「막 전환 연출」 과제를 2탄에서 구현했다.
 * public/assets/higgsfield/act-<막>.jpg 가 있으면 배경 삽화로 쓴다.
 */
export function ActCard({ act, onClose }: { act: number; onClose(): void }) {
  const info = acts.find((a) => a.act === act);
  if (!info) return null;
  return (
    <div className="act-overlay" role="dialog" aria-label={info.title} onClick={onClose}>
      <div className="act-card" onClick={(e) => e.stopPropagation()}>
        <CinematicImage name={`act-${act}`} alt={`${info.title} 삽화`} className="act-cinematic" />
        <div className="act-period">{info.period}</div>
        <h2 className="act-title">{info.title}</h2>
        <div className="act-map">📍 {info.map}</div>
        <p className="act-bridge">
          <GlossaryText>{info.bridge}</GlossaryText>
        </p>
        <p className="act-summary">{info.summary}</p>
        <button className="btn primary" autoFocus onClick={onClose}>
          들어간다
        </button>
      </div>
    </div>
  );
}

/* ───────────────────────── 기록 조각 ───────────────────────── */

export function RelicCard({ relicId, level, onClose }: { relicId: string; level: Level; onClose(): void }) {
  const relic = getRelic(relicId);
  if (!relic) return null;
  return (
    <div className="relic-card frame" role="status">
      <div className="relic-head">
        <span className="relic-icon" aria-hidden>
          {relic.icon}
        </span>
        <div>
          <div className="relic-kicker">기록 조각을 주웠다 · 보훈 포인트 +{POINTS.relic}</div>
          <div className="relic-name">{relic.name}</div>
        </div>
      </div>
      <p className="relic-text">
        <GlossaryText>{relic.text[level]}</GlossaryText>
      </p>
      <div className="source-cite">근거 · {relic.sourceNote}</div>
      <div className="dialogue-actions">
        <button className="btn small primary" autoFocus onClick={onClose}>
          수첩에 넣는다
        </button>
      </div>
    </div>
  );
}
