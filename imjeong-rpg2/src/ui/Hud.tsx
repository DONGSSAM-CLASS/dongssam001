import type { Figure, Level, ResourceKey, Resources, WorldMap } from '../types';
import { portraitDataUrl } from './portrait';
import { RESOURCE_ICONS, RESOURCE_LABELS } from '../engine/rules';
import { acts } from '../data/quests';
import type { PanelKind } from '../store/gameStore';
import type { FocusTarget } from '../three/FirstPersonRenderer';

/**
 * HUD — 1탄(『거상』식 배치)을 그대로 이어받았다.
 *   좌상단 초상·상태 막대 / 우상단 상황판 / 우측 둥근 버튼 / 하단 지표·기록·포인트
 * 2탄에서 더한 것: 가운데 조준점과 「말 걸기」 안내, 방 이름, 목표 방향 나침반.
 */

/* ── 좌상단: 초상과 상태 막대 ── */
export function PortraitBar({ resources, figure, nickname }: { resources: Resources; figure: Figure; nickname: string }) {
  return (
    <div className="portrait-bar frame">
      <img className="portrait" src={portraitDataUrl(figure)} alt="내 초상" />
      <div className="status-stack">
        <div className="status-name">{nickname ? `견습 기록관 ${nickname}` : figure.name}</div>
        <Meter kind="trust" label="민심" value={resources.trust} />
        <Meter kind="prestige" label="외교 신망" value={resources.prestige} />
        <Meter kind="law" label="제도" value={resources.law} />
        <Meter kind="unity" label="통합" value={resources.unity} />
      </div>
    </div>
  );
}

function Meter({ kind, label, value }: { kind: string; label: string; value: number }) {
  return (
    <div className="meter" title={`${label} ${value} / 100`}>
      <span className="meter-label">{label}</span>
      <span className="meter-track">
        <span className={`meter-fill ${kind}`} style={{ width: `${Math.min(100, value)}%` }} />
      </span>
      <span className="meter-value">{value}</span>
    </div>
  );
}

/* ── 우상단: 상황판 ── */
export function SituationPanel({
  map,
  act,
  solved,
  total,
  objective,
  points,
  canGuide,
  guideLabel,
  onGuide,
}: {
  map: WorldMap;
  act: number;
  solved: number;
  total: number;
  objective: string;
  points: number;
  canGuide: boolean;
  guideLabel: string;
  onGuide(): void;
}) {
  const info = acts.find((a) => a.act === Math.min(act, acts.length)) ?? acts[0];
  const percent = total === 0 ? 0 : Math.round((solved / total) * 100);
  return (
    <div className="situation frame">
      <div className="situation-place">{map.name}</div>
      <div className="situation-period">
        {map.nameOriginal ? `${map.nameOriginal} · ` : ''}
        {map.period}
      </div>
      <div className="situation-act">{act > acts.length ? '여정을 모두 마쳤습니다' : info.title}</div>
      <div className="situation-objective">{objective}</div>
      <div className="situation-progress">
        기록 {solved} / {total} · {percent}%
      </div>
      <div className="situation-bar">
        <span style={{ width: `${percent}%` }} />
      </div>
      <div className="points-chip" title="게임 속 포인트입니다. 실제 돈이 아닙니다.">
        🎗️ 보훈 포인트 <strong>{points.toLocaleString('ko-KR')}</strong>
      </div>
      {canGuide && (
        <button className="btn small primary situation-guide" onClick={onGuide}>
          👉 {guideLabel}
        </button>
      )}
    </div>
  );
}

/* ── 우측 세로 버튼 ── */
const TOOLS: Array<{ kind: Exclude<PanelKind, null>; icon: string; label: string }> = [
  { kind: 'quests', icon: '📋', label: '임무 기록' },
  { kind: 'blueprint', icon: '📐', label: '새 나라 설계도' },
  { kind: 'timeline', icon: '📅', label: '연표' },
  { kind: 'atlas', icon: '🗺️', label: '장소' },
  { kind: 'relics', icon: '📜', label: '기록 조각' },
  { kind: 'help', icon: '❓', label: '도움말' },
];

export function ToolRail({
  panel,
  onSelect,
  pendingQuests,
  relicCount,
}: {
  panel: PanelKind;
  onSelect(kind: PanelKind): void;
  pendingQuests: number;
  relicCount: number;
}) {
  return (
    <div className="tool-rail">
      {TOOLS.map((tool) => (
        <button
          key={tool.kind}
          className="tool-button"
          aria-pressed={panel === tool.kind}
          aria-label={tool.label}
          title={tool.label}
          onClick={() => onSelect(tool.kind)}
        >
          <span aria-hidden>{tool.icon}</span>
          {tool.kind === 'quests' && pendingQuests > 0 && <span className="badge-dot">{pendingQuests}</span>}
          {tool.kind === 'relics' && relicCount > 0 && <span className="badge-dot soft">{relicCount}</span>}
        </button>
      ))}
    </div>
  );
}

const SHORT_LABELS: Record<ResourceKey, string> = {
  funds: '국고',
  trust: '민심',
  prestige: '외교',
  law: '제도',
  unity: '통합',
};

/* ── 하단 바 ── */
export function BottomBar({
  resources,
  log,
  dateLabel,
  pointsEarned,
  donated,
}: {
  resources: Resources;
  log: string[];
  dateLabel: string;
  pointsEarned: number;
  donated: number;
  level: Level;
}) {
  return (
    <div className="bottom-bar">
      <div className="resource-box frame">
        {(['funds', 'trust', 'prestige', 'law', 'unity'] as const).map((key) => (
          <div className="resource-row" key={key} title={RESOURCE_LABELS[key]}>
            <span className="icon" aria-hidden>
              {RESOURCE_ICONS[key]}
            </span>
            <span>{SHORT_LABELS[key]}</span>
            <span className="value">{resources[key].toLocaleString('ko-KR')}</span>
          </div>
        ))}
      </div>

      <div className="log-box frame" aria-live="polite">
        {log.slice(0, 3).map((line, i) => (
          <div className="log-line" key={`${line}-${i}`}>
            {line}
          </div>
        ))}
      </div>

      <div className="slot-box frame">
        <div className="honor-summary">
          <div>
            <span>모은 포인트</span>
            <strong>{pointsEarned.toLocaleString('ko-KR')}</strong>
          </div>
          <div>
            <span>기부한 포인트</span>
            <strong>{donated.toLocaleString('ko-KR')}</strong>
          </div>
        </div>
        <div className="date-strip">{dateLabel}</div>
      </div>
    </div>
  );
}

/* ── 가운데: 조준점과 「말 걸기」 ── */
export function Crosshair({
  focus,
  label,
  onActivate,
}: {
  focus: FocusTarget;
  label: string;
  onActivate(): void;
}) {
  return (
    <>
      <div className={`crosshair${focus ? ' on' : ''}`} aria-hidden />
      {focus && (
        <button className="interact-prompt" onClick={onActivate}>
          <kbd>스페이스</kbd> {label}
        </button>
      )}
    </>
  );
}

/* ── 방 이름 ── */
export function RoomBanner({ name }: { name: string | null }) {
  if (!name) return null;
  return (
    <div className="room-banner" key={name} aria-live="polite">
      {name}
    </div>
  );
}

/**
 * 목표 방향 나침반 — 화면 위쪽에 「다음에 만날 사람」이 어느 쪽에 있는지 보여 준다.
 * 1인칭은 쿼터뷰보다 길을 잃기 쉽다. 중1이 헤매지 않게 하는 장치다.
 */
export function Compass({ bearing, label, distance }: { bearing: number | null; label: string; distance: number }) {
  if (bearing === null) return null;
  // bearing: 바라보는 방향 기준 목표의 각도(라디안, 오른쪽이 +)
  const deg = (bearing * 180) / Math.PI;
  const clamped = Math.max(-60, Math.min(60, deg));
  const ahead = Math.abs(deg) < 12;
  return (
    <div className="compass" aria-label={`목표: ${label}`}>
      <div className="compass-track">
        <span className="compass-tick" style={{ left: '50%' }} />
        <span className={`compass-marker${ahead ? ' ahead' : ''}`} style={{ left: `${50 + (clamped / 60) * 46}%` }}>
          {Math.abs(deg) > 60 ? (deg > 0 ? '▶' : '◀') : '◆'}
        </span>
      </div>
      <div className="compass-label">
        {label} · {Math.round(distance)}m {ahead ? '— 앞으로!' : deg > 0 ? '— 오른쪽으로 도세요' : '— 왼쪽으로 도세요'}
      </div>
    </div>
  );
}

export function Toast({ text }: { text: string }) {
  return (
    <div className="toast frame" role="status">
      {text}
    </div>
  );
}
