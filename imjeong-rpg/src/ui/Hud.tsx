import type { Level, Resources, WorldMap } from '../types';
import { RESOURCE_ICONS, RESOURCE_LABELS, heatLevel, HEAT_TEXT } from '../engine/rules';
import type { ResourceKey } from '../types';
import { acts } from '../data/quests';
import { items as itemTable } from '../data/items';
import type { PanelKind } from '../store/gameStore';

/**
 * 화면 위에 겹쳐 그리는 HUD.
 * 배치는 『거상』을 참고했다 — 좌상단 초상, 우상단 상황판, 우측 기능 버튼,
 * 하단에 자원·기록·소지품.
 */

/* ── 좌상단: 초상과 상태 막대 ── */
export function PortraitBar({ resources }: { resources: Resources }) {
  const heat = heatLevel(resources.heat);
  return (
    <div className="portrait-bar frame">
      <div className="portrait" aria-hidden>
        🖋️
      </div>
      <div className="status-stack">
        <div className="status-name">임시정부 서기</div>
        <Meter kind="prestige" label="국제 신망" value={resources.prestige} />
        <Meter kind="unity" label="통합도" value={resources.unity} />
        <Meter kind="heat" label="일제 감시" value={resources.heat} title={HEAT_TEXT[heat].middle} />
      </div>
    </div>
  );
}

function Meter({
  kind,
  label,
  value,
  title,
}: {
  kind: 'prestige' | 'unity' | 'heat';
  label: string;
  value: number;
  title?: string;
}) {
  return (
    <div className="meter" title={title}>
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
  completedCount,
  total,
  objective,
  canGuide,
  onGuide,
}: {
  map: WorldMap;
  act: number;
  completedCount: number;
  total: number;
  objective: string;
  canGuide: boolean;
  onGuide(): void;
}) {
  const info = acts.find((a) => a.act === act) ?? acts[0];
  const percent = total === 0 ? 0 : Math.round((completedCount / total) * 100);
  return (
    <div className="situation frame">
      <div className="situation-place">{map.name}</div>
      <div className="situation-period">
        {map.nameOriginal ? `${map.nameOriginal} · ` : ''}
        {map.period}
      </div>
      <div className="situation-act">{info.title}</div>
      <div className="situation-objective">{objective}</div>
      <div className="situation-progress">
        기록한 사건 {completedCount} / {total} · {percent}%
      </div>
      <div className="situation-bar">
        <span style={{ width: `${percent}%` }} />
      </div>
      {canGuide && (
        <button className="btn small primary situation-guide" onClick={onGuide}>
          👉 데려다 주기
        </button>
      )}
    </div>
  );
}

/* ── 우측 세로 버튼 ── */
const TOOLS: Array<{ kind: Exclude<PanelKind, null>; icon: string; label: string }> = [
  { kind: 'quests', icon: '📋', label: '임무 기록' },
  { kind: 'atlas', icon: '🗺️', label: '이동' },
  { kind: 'party', icon: '👥', label: '동지' },
  { kind: 'timeline', icon: '📅', label: '연표' },
  { kind: 'items', icon: '🎒', label: '소지품' },
  { kind: 'help', icon: '❓', label: '도움말' },
];

export function ToolRail({
  panel,
  onSelect,
  pendingQuests,
}: {
  panel: PanelKind;
  onSelect(kind: PanelKind): void;
  pendingQuests: number;
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
          {tool.kind === 'quests' && pendingQuests > 0 && (
            <span className="badge-dot">{pendingQuests}</span>
          )}
        </button>
      ))}
    </div>
  );
}

/** 하단 상자는 좁으므로 줄임말을 쓰고, 전체 이름은 툴팁으로 보여 준다. */
const SHORT_LABELS: Record<ResourceKey, string> = {
  funds: '자금',
  agents: '요원',
  forces: '군사력',
  prestige: '신망',
  unity: '통합도',
  heat: '감시',
};

/* ── 하단 바 ── */
export function BottomBar({
  resources,
  log,
  itemIds,
  dateLabel,
  level,
}: {
  resources: Resources;
  log: string[];
  itemIds: string[];
  dateLabel: string;
  level: Level;
}) {
  const slots = Array.from({ length: 6 }, (_, i) => itemIds[i]);
  return (
    <div className="bottom-bar">
      <div className="resource-box frame">
        {(['funds', 'agents', 'forces', 'prestige', 'unity', 'heat'] as const).map((key) => (
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
        {log.length === 0 && <div className="log-line">바닥을 눌러 걸어가고, 사람을 눌러 말을 겁니다.</div>}
      </div>

      <div className="slot-box frame">
        <div className="slot-row">
          {slots.map((id, i) => {
            const item = id ? itemTable[id] : undefined;
            return (
              <div
                className={`slot${item ? '' : ' empty'}`}
                key={i}
                title={item ? `${item.name} — ${item.description[level]}` : '빈 칸'}
              >
                <span aria-hidden>{item?.icon ?? '·'}</span>
              </div>
            );
          })}
        </div>
        <div className="date-strip">{dateLabel}</div>
      </div>
    </div>
  );
}
