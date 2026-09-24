import { useCallback, useEffect, useMemo, useRef } from 'react';
import { WorldRenderer } from './three/WorldRenderer';
import { buildWorldGrid, findPath, type Grid } from './engine/grid';
import { getMap } from './data/maps';
import { figures } from './data/figures';
import { quests } from './data/quests';
import { availableQuestFor, useGame, TOTAL_QUESTS } from './store/gameStore';
import type { MapId } from './types';
import { BottomBar, PortraitBar, SituationPanel, ToolRail } from './ui/Hud';
import { Dialogue } from './ui/Dialogue';
import { QuestView } from './ui/QuestView';
import { Panel } from './ui/Panels';
import { Tutorial } from './ui/Tutorial';
import { SequelCard } from './ui/SequelCard';
import { isUnlocked } from './engine/rules';

/** 퀘스트 완료 시 함께 주어지는 사료 아이템 */
const QUEST_ITEMS: Record<string, string> = {
  'q-founding': 'charter',
  'q-bond': 'bond',
  'q-yeontongje': 'press',
  'q-paris-outcome': 'correLibre',
  'q-aegukdan': 'oath',
  'q-hongkou': 'taegeukgi',
  'q-move-route': 'jangganggi',
  'q-gwangbokgun': 'gwangbokDecl',
  'q-geonguk-gangnyeong': 'gangnyeong',
  'q-declaration-war': 'warDecl',
  'q-oss': 'baekbeom',
};

export default function GameScreen() {
  const containerRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<WorldRenderer | null>(null);

  const level = useGame((s) => s.level);
  const mapId = useGame((s) => s.map);
  const act = useGame((s) => s.act);
  const resources = useGame((s) => s.resources);
  const completed = useGame((s) => s.completed);
  const party = useGame((s) => s.party);
  const itemIds = useGame((s) => s.items);
  const badges = useGame((s) => s.badges);
  const dialogue = useGame((s) => s.dialogue);
  const attempt = useGame((s) => s.attempt);
  const panel = useGame((s) => s.panel);
  const log = useGame((s) => s.log);
  const showTutorial = useGame((s) => s.showTutorial);

  const map = useMemo(() => getMap(mapId), [mapId]);
  // 길찾기 격자는 맵마다 한 번만 만들어 두고, 클릭 처리에서 ref 로 꺼내 쓴다.
  // (클릭할 때마다 다시 만들면 큰 맵에서 눈에 띄게 끊긴다.)
  const gridRef = useRef<Grid>(buildWorldGrid(map));
  /** 「안내」를 눌렀을 때, 맵을 옮긴 뒤 걸어갈 목적지를 잠시 담아 둔다 */
  const pendingGuide = useRef<{ x: number; z: number } | null>(null);
  useEffect(() => {
    gridRef.current = buildWorldGrid(map);
  }, [map]);

  /* ── 3D 렌더러 생성 (한 번만) ── */
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const renderer = new WorldRenderer({
      container,
      onGroundClick(point) {
        const r = rendererRef.current;
        if (!r) return;
        // 클릭한 칸까지의 최단 경로를 계산해 걷게 한다.
        const path = findPath(gridRef.current, r.playerCell, point);
        if (path.length > 0) r.setPath(path);
      },
      onNpcClick(figureId) {
        const r = rendererRef.current;
        const state = useGame.getState();
        const currentMap = getMap(state.map);
        const placement = currentMap.npcs.find((n) => n.figureId === figureId);
        if (r && placement) {
          // 말을 걸려면 먼저 그 사람 곁으로 걸어간다 (마지막 칸은 NPC 가 서 있으므로 뺀다).
          const path = findPath(gridRef.current, r.playerCell, { x: placement.x, z: placement.z });
          if (path.length > 1) r.setPath(path.slice(0, -1));
          r.lookAtNpc(figureId);
        }
        state.openDialogue(figureId);
      },
    });
    rendererRef.current = renderer;
    return () => {
      renderer.dispose();
      rendererRef.current = null;
    };
  }, []);

  /* ── 맵이 바뀌면 다시 적재 ── */
  useEffect(() => {
    rendererRef.current?.loadMap(map, figures, figures.player);
    // 다른 도시로 옮겨 온 「안내」였다면, 도착하자마자 그 인물 쪽으로 걷게 한다.
    const target = pendingGuide.current;
    pendingGuide.current = null;
    if (target) {
      const renderer = rendererRef.current;
      if (renderer) {
        const path = findPath(buildWorldGrid(map), map.spawn, target);
        if (path.length > 1) renderer.setPath(path.slice(0, -1));
      }
    }
  }, [map]);

  /* ── 임무를 줄 수 있는 인물 머리 위에 느낌표를 띄운다 ──
     중학생이 「어디로 가서 누구에게 말을 걸까」를 헤매지 않도록 하는 장치다. */
  useEffect(() => {
    const givers = map.npcs
      .map((npc) => npc.figureId)
      .filter((id) => availableQuestFor(id, mapId, completed) !== null);
    rendererRef.current?.setQuestMarkers(givers);
  }, [map, mapId, completed]);

  /* ── 퀘스트를 풀면 관련 사료를 소지품에 넣는다 ── */
  const submitted = attempt?.submitted ?? false;
  const attemptQuestId = attempt?.questId;
  useEffect(() => {
    if (!submitted || !attemptQuestId) return;
    const itemId = QUEST_ITEMS[attemptQuestId];
    if (!itemId) return;
    useGame.setState((s) => (s.items.includes(itemId) ? s : { ...s, items: [...s.items, itemId] }));
  }, [submitted, attemptQuestId]);

  /* ── 키보드: Esc 로 닫기 ── */
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      const state = useGame.getState();
      if (state.attempt) state.closeQuest();
      else if (state.dialogue) state.closeDialogue();
      else if (state.panel) state.setPanel(null);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const handleTravel = useCallback((next: MapId) => {
    useGame.getState().travel(next);
  }, []);

  /**
   * 「안내」 — 다음 임무를 주는 인물이 있는 곳까지 데려다 준다.
   * 중1이 넓은 지도에서 사람을 찾아 헤매다 흥미를 잃지 않도록 하는 장치다.
   */
  const handleGuide = useCallback(() => {
    const state = useGame.getState();
    const next = quests
      .filter((q) => !(q.id in state.completed) && isUnlocked(q, state.completed))
      .sort((a, b) => a.act - b.act)[0];
    if (!next) return;
    const targetMap = getMap(next.map);
    const placement = targetMap.npcs.find((n) => n.figureId === next.giver);
    if (!placement) return;

    if (next.map !== state.map) {
      pendingGuide.current = { x: placement.x, z: placement.z };
      state.travel(next.map);
      return;
    }
    const renderer = rendererRef.current;
    if (!renderer) return;
    const path = findPath(gridRef.current, renderer.playerCell, { x: placement.x, z: placement.z });
    if (path.length > 1) renderer.setPath(path.slice(0, -1));
    state.pushLog(`${figures[next.giver]?.name ?? ''}에게 가는 길이다.`);
  }, []);

  const dialogueFigure = dialogue ? figures[dialogue.figureId] : null;
  const dialogueQuest = dialogue?.questId ? quests.find((q) => q.id === dialogue.questId) ?? null : null;
  const activeQuest = attempt ? quests.find((q) => q.id === attempt.questId) ?? null : null;

  // 지금 이 맵에서 받을 수 있는 임무 수 — 우측 버튼에 표시한다.
  const pendingHere = map.npcs.filter(
    (npc) => availableQuestFor(npc.figureId, mapId, completed) !== null,
  ).length;

  // 상황판에 띄울 다음 목표
  const nextQuest = quests
    .filter((q) => !(q.id in completed) && isUnlocked(q, completed))
    .sort((a, b) => a.act - b.act)[0];
  const objective = nextQuest
    ? `다음 임무 · ${getMap(nextQuest.map).name}의 ${figures[nextQuest.giver]?.name ?? ''}`
    : '모든 임무를 기록했습니다. 다음 이야기는 2탄에서!';

  // 하단 날짜 띠 — 현재 막의 시기를 보여 준다.
  const dateLabel = nextQuest ? nextQuest.dateLabel : '1945. 11. 23.';

  // 대화·임무·조작 안내가 떠 있는 동안에는 3D 이름표를 숨긴다 (겹쳐 보이면 글이 안 읽힌다)
  const modalOpen = Boolean(dialogue || attempt || showTutorial);

  return (
    <div className={`game-root${modalOpen ? ' modal-open' : ''}`}>
      <div className="world-layer" ref={containerRef} />

      <div className="hud">
        <PortraitBar resources={resources} figure={dialogueFigure ?? figures.player} />
        <SituationPanel
          map={map}
          act={act}
          completedCount={Object.keys(completed).length}
          total={TOTAL_QUESTS}
          objective={objective}
          canGuide={Boolean(nextQuest)}
          onGuide={handleGuide}
        />
        <ToolRail
          panel={panel}
          pendingQuests={pendingHere}
          onSelect={(kind) => useGame.getState().setPanel(kind)}
        />
        <BottomBar
          resources={resources}
          log={log}
          itemIds={itemIds}
          dateLabel={dateLabel}
          level={level}
        />

        {panel && (
          <Panel
            kind={panel}
            level={level}
            mapId={mapId}
            completed={completed}
            party={party}
            itemIds={itemIds}
            badges={badges}
            onClose={() => useGame.getState().setPanel(null)}
            onTravel={handleTravel}
            onReplayTutorial={() => useGame.getState().openTutorial()}
          />
        )}

        {/* 모든 임무를 마치면 2탄으로 이어 주는 카드 */}
        {!nextQuest && !dialogue && !attempt && <SequelCard />}

        {dialogue && dialogueFigure && !attempt && (
          <Dialogue
            figure={dialogueFigure}
            level={level}
            quest={dialogueQuest}
            questDone={quests.some((q) => q.giver === dialogue.figureId && q.id in completed)}
            canRecruit={dialogueFigure.recruitable}
            inParty={party.includes(dialogue.figureId)}
            onStartQuest={() => dialogueQuest && useGame.getState().openQuest(dialogueQuest.id)}
            onRecruit={() => useGame.getState().recruit(dialogue.figureId)}
            onClose={() => useGame.getState().closeDialogue()}
          />
        )}

        {attempt && activeQuest && (
          <QuestView
            quest={activeQuest}
            attempt={attempt}
            level={level}
            resources={resources}
            onPick={(id) => useGame.getState().pick(id)}
            onSubmit={() => useGame.getState().submit()}
            onRetry={() => useGame.getState().retryQuest()}
            onClose={() => useGame.getState().closeQuest()}
          />
        )}
      </div>

      {showTutorial && <Tutorial onClose={() => useGame.getState().closeTutorial()} />}
    </div>
  );
}
