import type { Level, MapId } from '../types';
import { quests, acts } from '../data/quests';
import { worldMaps } from '../data/maps';
import { figures } from '../data/figures';
import { timelineSorted } from '../data/timeline';
import { items as itemTable } from '../data/items';
import { isUnlocked } from '../engine/rules';
import type { PanelKind } from '../store/gameStore';

const TITLES: Record<Exclude<PanelKind, null>, string> = {
  quests: '임무 기록',
  atlas: '이동',
  party: '동지',
  timeline: '연표',
  items: '소지품',
  help: '도움말',
};

export function Panel({
  kind,
  level,
  mapId,
  completed,
  party,
  itemIds,
  badges,
  onClose,
  onTravel,
  onReplayTutorial,
}: {
  kind: Exclude<PanelKind, null>;
  level: Level;
  mapId: MapId;
  completed: Record<string, boolean>;
  party: string[];
  itemIds: string[];
  badges: string[];
  onClose(): void;
  onTravel(map: MapId): void;
  onReplayTutorial(): void;
}) {
  return (
    <div className="panel frame">
      <div className="panel-head">
        <span className="panel-title">{TITLES[kind]}</span>
        <button className="btn small ghost" onClick={onClose}>
          닫기
        </button>
      </div>
      <div className="panel-body">
        {kind === 'quests' && <QuestList level={level} completed={completed} badges={badges} />}
        {kind === 'atlas' && <Atlas level={level} mapId={mapId} onTravel={onTravel} />}
        {kind === 'party' && <Party level={level} party={party} />}
        {kind === 'timeline' && <Timeline />}
        {kind === 'items' && <Items level={level} itemIds={itemIds} />}
        {kind === 'help' && <Help onReplayTutorial={onReplayTutorial} />}
      </div>
    </div>
  );
}

function QuestList({
  level,
  completed,
  badges,
}: {
  level: Level;
  completed: Record<string, boolean>;
  badges: string[];
}) {
  return (
    <>
      {acts.map((act) => {
        const inAct = quests.filter((q) => q.act === act.act);
        return (
          <section key={act.act} style={{ marginBottom: 16 }}>
            <div className="list-title" style={{ color: 'var(--brass)' }}>
              {act.title}
            </div>
            <div className="list-sub" style={{ marginBottom: 8 }}>
              {act.period} · {act.summary}
            </div>
            {inAct.map((quest) => {
              const done = quest.id in completed;
              const locked = !isUnlocked(quest, completed);
              const map = worldMaps.find((m) => m.id === quest.map);
              return (
                <div className="list-item" key={quest.id} data-done={done} data-locked={locked}>
                  <div className="list-title">
                    {done ? (completed[quest.id] ? '✓ ' : '△ ') : locked ? '🔒 ' : '• '}
                    {quest.title}
                  </div>
                  <div className="list-sub">
                    {quest.dateLabel} · {map?.name} · {figures[quest.giver]?.name ?? quest.giver}
                  </div>
                  {done && <div className="list-sub">{quest.debrief[level].slice(0, 70)}…</div>}
                </div>
              );
            })}
          </section>
        );
      })}
      {badges.length > 0 && (
        <section>
          <div className="list-title" style={{ color: 'var(--brass)', marginBottom: 6 }}>
            얻은 칭호
          </div>
          <div className="gain-list">
            {badges.map((b) => (
              <span className="gain up" key={b}>
                {b}
              </span>
            ))}
          </div>
        </section>
      )}
    </>
  );
}

function Atlas({
  level,
  mapId,
  onTravel,
}: {
  level: Level;
  mapId: MapId;
  onTravel(map: MapId): void;
}) {
  return (
    <>
      <p className="list-sub" style={{ marginBottom: 10 }}>
        임시정부가 실제로 활동한 장소들입니다. 지도는 실측이 아니라 학습용 재구성이에요.
      </p>
      {worldMaps.map((map) => (
        <button
          className="atlas-card"
          key={map.id}
          aria-current={map.id === mapId}
          onClick={() => onTravel(map.id)}
        >
          <div className="atlas-name">{map.name}</div>
          <div className="atlas-original">{map.nameOriginal}</div>
          <div className="atlas-period">{map.period}</div>
          <div className="atlas-summary">{map.summary[level]}</div>
          <div className="atlas-note">※ {map.historicalNote}</div>
        </button>
      ))}
    </>
  );
}

function Party({ level, party }: { level: Level; party: string[] }) {
  if (party.length === 0) {
    return (
      <p className="list-sub">
        아직 함께하는 동지가 없습니다. 사람에게 말을 걸어 「동지로 함께한다」를 눌러 보세요.
      </p>
    );
  }
  return (
    <>
      {party.map((id) => {
        const figure = figures[id];
        if (!figure) return null;
        return (
          <div className="list-item" key={id}>
            <div className="list-title" style={{ color: figure.accent }}>
              {figure.name}
              {figure.hanja ? ` (${figure.hanja})` : ''}
            </div>
            <div className="list-sub">{figure.role}</div>
            <div className="list-sub" style={{ marginTop: 5 }}>
              {figure.bio[level]}
            </div>
            <div className="source-cite" style={{ marginTop: 6 }}>
              근거 · {figure.sourceNote}
            </div>
          </div>
        );
      })}
    </>
  );
}

function Timeline() {
  return (
    <>
      {timelineSorted.map((entry) => (
        <div className="timeline-entry" key={`${entry.date}-${entry.title}`}>
          <div className="timeline-date">{entry.label}</div>
          <div className="timeline-title">{entry.title}</div>
          <div className="timeline-detail">{entry.detail}</div>
          <div className="timeline-note">※ {entry.sourceNote}</div>
        </div>
      ))}
    </>
  );
}

function Items({ level, itemIds }: { level: Level; itemIds: string[] }) {
  if (itemIds.length === 0) {
    return <p className="list-sub">임무를 마치면 그 사건과 관련된 사료가 여기에 쌓입니다.</p>;
  }
  return (
    <>
      {itemIds.map((id) => {
        const item = itemTable[id];
        if (!item) return null;
        return (
          <div className="list-item" key={id}>
            <div className="list-title">
              {item.icon} {item.name}
            </div>
            <div className="list-sub">{item.description[level]}</div>
            <div className="source-cite" style={{ marginTop: 5 }}>
              근거 · {item.sourceNote}
            </div>
          </div>
        );
      })}
    </>
  );
}

function Help({ onReplayTutorial }: { onReplayTutorial(): void }) {
  return (
    <div style={{ fontSize: 14 }}>
      <button className="btn primary" style={{ width: '100%', marginBottom: 12 }} onClick={onReplayTutorial}>
        🖱️ 조작 안내 다시 보기
      </button>
      <p>
        <strong style={{ color: 'var(--brass)' }}>조작</strong>
        <br />· 바닥을 클릭하면 서기가 그곳으로 걸어갑니다.
        <br />· 사람을 클릭하면 말을 겁니다.
        <br />· 마우스 휠로 화면을 확대·축소합니다.
      </p>
      <p>
        <strong style={{ color: 'var(--brass)' }}>진행</strong>
        <br />· 인물에게 임무를 받아 사료를 읽고 판단합니다.
        <br />· 틀려도 게임은 끝나지 않습니다. 대신 자원을 잃고 일제 감시가 올라갑니다.
        <br />· 한 막의 임무를 모두 마치면 다음 막이 열립니다.
      </p>
      <p>
        <strong style={{ color: 'var(--brass)' }}>자원</strong>
        <br />· 💰 독립운동자금 — 애국금·인구세·독립공채로 모은 돈
        <br />· 🧭 요원 — 연통제·교통국에 투입할 사람
        <br />· 🌐 국제 신망 — 열강과 중국을 상대로 쌓은 평판
        <br />· 🎖️ 군사력 — 의열 조직과 광복군의 역량
        <br />· 🤝 통합도 — 좌우·지역 세력의 결속
        <br />· 👁️ 일제 감시 — 높을수록 위험합니다
      </p>
      <p className="source-note">
        이 게임의 연대·인물·사건·사료는 실제 역사에 근거합니다. 다만 플레이어인 「서기」는 가상 인물이며,
        지도와 건물 배치는 학습을 위한 재구성입니다. 각 사료 카드의 출처와 「확인할 점」을 함께 읽어 주세요.
      </p>
    </div>
  );
}
