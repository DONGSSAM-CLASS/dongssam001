import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { FirstPersonRenderer, type FocusTarget, type Pose } from './three/FirstPersonRenderer';
import { getMap } from './data/maps';
import { figures } from './data/figures';
import { MAX_ACT, getQuest, quests } from './data/quests';
import { honorees } from './data/honorees';
import { ACT_MAP, TOTAL_QUESTS, availableQuestFor, useGame } from './store/gameStore';
import type { MapId } from './types';
import { canFinish, isActComplete, nextQuest, solvedIds, totalDonated } from './engine/rules';
import { BottomBar, Compass, Crosshair, PortraitBar, RoomBanner, SituationPanel, Toast, ToolRail } from './ui/Hud';
import { Dialogue } from './ui/Dialogue';
import { QuestView } from './ui/QuestView';
import { Panel } from './ui/Panels';
import { ActCard, RelicCard, Tutorial } from './ui/Overlays';
import { HonorPanel } from './ui/HonorPanel';
import { Ending } from './ui/Ending';
import { TouchControls } from './ui/TouchControls';
import { NoteCard, PrequelRecap } from './ui/Learning';
import { useSettings } from './store/settings';
import { currentProgressCode } from './store/gameStore';
import { downloadRecord } from './ui/exportRecord';

/** 이 장소가 몇 막의 무대인지 */
function actOfMap(map: MapId): number {
  return Number(Object.keys(ACT_MAP).find((k) => ACT_MAP[Number(k)] === map) ?? 0);
}

/** 시간의 문을 지나면 갈 곳 (문이 닫혀 있으면 null) */
function portalTarget(s: {
  map: MapId;
  act: number;
  prologueDone: boolean;
  completed: Record<string, boolean>;
}): MapId | null {
  if (s.map === 'memorial') {
    if (!s.prologueDone) return null;
    return s.act <= 5 ? ACT_MAP[s.act] : null;
  }
  if (!isActComplete(quests, s.completed, actOfMap(s.map))) return null;
  const target = ACT_MAP[Math.min(s.act, MAX_ACT)];
  return target === s.map ? null : target;
}

export default function GameScreen() {
  const containerRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<FirstPersonRenderer | null>(null);

  const level = useGame((s) => s.level);
  const nickname = useGame((s) => s.nickname);
  const mapId = useGame((s) => s.map);
  const act = useGame((s) => s.act);
  const resources = useGame((s) => s.resources);
  const completed = useGame((s) => s.completed);
  const missed = useGame((s) => s.missed);
  const relicIds = useGame((s) => s.relics);
  const points = useGame((s) => s.points);
  const pointsEarned = useGame((s) => s.pointsEarned);
  const donations = useGame((s) => s.donations);
  const letters = useGame((s) => s.letters);
  const prologueDone = useGame((s) => s.prologueDone);
  const dialogue = useGame((s) => s.dialogue);
  const attempt = useGame((s) => s.attempt);
  const panel = useGame((s) => s.panel);
  const log = useGame((s) => s.log);
  const showTutorial = useGame((s) => s.showTutorial);
  const actCard = useGame((s) => s.actCard);
  const relicCard = useGame((s) => s.relicCard);
  const plaque = useGame((s) => s.plaque);
  const ending = useGame((s) => s.ending);
  const toast = useGame((s) => s.toast);
  const notes = useGame((s) => s.notes);
  const noteCard = useGame((s) => s.noteCard);
  const recapOpen = useGame((s) => s.recapOpen);
  const recall = useGame((s) => s.recall);
  const prequelPlayed = useGame((s) => s.prequelPlayed);
  const settings = useSettings();

  const [focus, setFocus] = useState<FocusTarget>(null);
  const [room, setRoom] = useState<string | null>(null);
  const [pose, setPose] = useState<Pose | null>(null);

  const map = useMemo(() => getMap(mapId), [mapId]);
  const allDone = quests.every((q) => completed[q.id] === true);
  const pledge = notes[6] ?? '';
  const finished = canFinish(quests, completed, donations, letters, pledge);
  const portalOpen = portalTarget({ map: mapId, act, prologueDone, completed }) !== null;
  const donatedIds = useMemo(() => Object.keys(donations).filter((k) => donations[k] > 0), [donations]);
  const letteredIds = useMemo(() => letters.map((l) => l.figureId), [letters]);

  /* ── 3D 렌더러 (한 번만 만든다) ── */
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const renderer = new FirstPersonRenderer({
      container,
      onNpcActivate: (id) => useGame.getState().openDialogue(id),
      onPlaqueActivate: (id) => useGame.getState().openPlaque(id),
      onRelic: (id) => useGame.getState().collectRelic(id),
      onPortal: () => {
        const s = useGame.getState();
        const target = portalTarget(s);
        if (target) {
          s.travel(target);
          return;
        }
        if (s.map === 'memorial' && !s.prologueDone) s.notify('먼저 해설사 선생님과 이야기해 보세요.');
        else if (s.map === 'memorial') s.notify('여행을 모두 마쳤어요. 명패 앞에서 마음을 전해 보세요.');
        else {
          const left = quests.filter((q) => q.map === s.map && s.completed[q.id] !== true).length;
          s.notify(`🚪 문이 닫혀 있어요. 이 시대에 남은 기록이 ${left}개 있어요.`);
        }
      },
      onFocus: setFocus,
      onRoom: setRoom,
      onPose: setPose,
    });
    rendererRef.current = renderer;
    return () => {
      renderer.dispose();
      rendererRef.current = null;
    };
  }, []);

  /* ── 장소가 바뀌면 다시 짓는다 ── */
  useEffect(() => {
    const s = useGame.getState();
    rendererRef.current?.loadMap(map, figures, {
      collectedRelics: s.relics,
      portalOpen: portalTarget(s) !== null,
      donated: Object.keys(s.donations).filter((k) => s.donations[k] > 0),
      lettered: s.letters.map((l) => l.figureId),
    });
    setRoom(null);
  }, [map]);

  useEffect(() => {
    rendererRef.current?.setPortalOpen(portalOpen);
  }, [portalOpen]);

  useEffect(() => {
    rendererRef.current?.setHonors(donatedIds, letteredIds);
  }, [donatedIds, letteredIds]);

  /* ── 느낌표 — 지금 임무를 줄 수 있는 사람 ── */
  useEffect(() => {
    const givers = map.npcs
      .map((n) => n.figureId)
      .filter((id) => {
        if (id === 'docent') return !prologueDone || availableQuestFor(id, mapId, completed, act) !== null || (allDone && !finished);
        return availableQuestFor(id, mapId, completed, act) !== null;
      });
    rendererRef.current?.setQuestMarkers(givers);
  }, [map, mapId, completed, act, prologueDone, allDone, finished]);

  /* ── 창이 떠 있는 동안에는 걷지 않는다 ── */
  const modalOpen = Boolean(dialogue || attempt || showTutorial || actCard || plaque || ending || noteCard || recapOpen);

  /* ── 설정을 3D 에 알린다 ── */
  useEffect(() => {
    rendererRef.current?.setOptions({
      headBob: settings.headBob,
      lookSpeed: settings.lookSpeed,
      alwaysLabels: settings.alwaysLabels,
    });
  }, [settings.headBob, settings.lookSpeed, settings.alwaysLabels]);
  useEffect(() => {
    rendererRef.current?.setPaused(modalOpen);
  }, [modalOpen]);

  /* ── 목표 — 다음에 갈 곳 ── */
  const next = nextQuest(quests, completed);
  const goal = useMemo((): { label: string; point: { x: number; z: number } | null; objective: string } => {
    const portal = map.portals[0];
    if (!prologueDone) {
      const d = map.npcs.find((n) => n.figureId === 'docent');
      return { label: '해설사 선생님', point: d ? { x: d.x, z: d.z } : null, objective: '해설사 선생님께 말을 걸어 보세요.' };
    }
    if (next && next.map === mapId && next.act <= act) {
      const npc = map.npcs.find((n) => n.figureId === next.giver);
      const name = figures[next.giver]?.name ?? '';
      return { label: name, point: npc ? { x: npc.x, z: npc.z } : null, objective: `다음 기록 · ${name} — 「${next.title}」` };
    }
    if (portalOpen && portal) {
      const target = portalTarget({ map: mapId, act, prologueDone, completed });
      return {
        label: '시간의 문',
        point: { x: portal.x, z: portal.z },
        objective: `시간의 문을 지나 ${target ? getMap(target).name : ''}(으)로 가세요.`,
      };
    }
    if (allDone && mapId === 'memorial') {
      const target = honorees.find((h) => !donatedIds.includes(h.figureId) || !letteredIds.includes(h.figureId));
      const f = target && map.furniture.find((f) => f.kind === 'honor-plaque' && f.figureId === target.figureId);
      if (!pledge && !target) {
        const d = map.npcs.find((n) => n.figureId === 'docent');
        return { label: '해설사 선생님', point: d ? { x: d.x, z: d.z } : null, objective: '마지막으로 「나의 보훈 다짐」을 적어 보세요. (✍️ 생각 노트)' };
      }
      if (finished && !target) return { label: '', point: null, objective: '모든 분께 마음을 전했어요. 감사 증서를 받아 보세요.' };
      return {
        label: target ? `${figures[target.figureId]?.name} 명패` : '',
        // 명패가 바라보는 쪽 한 칸 앞에 선다
        point: f ? { x: f.x + Math.round(Math.sin(f.rot ?? 0)), z: f.z + Math.round(Math.cos(f.rot ?? 0)) } : null,
        objective: finished
          ? '마음을 전했어요. 다른 분께도 전하거나 감사 증서를 받으세요.'
          : !pledge && totalDonated(donations) > 0 && letters.length > 0
            ? '감사 증서를 받으려면 「나의 보훈 다짐」을 적어 주세요. (✍️ 생각 노트)'
            : '명패 앞에 서서 국가유공자께 기부하고 감사 편지를 써 보세요.',
      };
    }
    return { label: '', point: null, objective: '장소 곳곳을 둘러보세요.' };
  }, [map, mapId, act, next, prologueDone, portalOpen, completed, allDone, donatedIds, letteredIds, finished, pledge, donations, letters]);

  useEffect(() => {
    rendererRef.current?.setGuideTarget(null);
  }, [goal.point?.x, goal.point?.z, mapId]);

  const handleGuide = useCallback(() => {
    const r = rendererRef.current;
    if (!r || !goal.point) return;
    r.setGuideTarget(goal.point);
    const npc = map.npcs.find((n) => n.x === goal.point!.x && n.z === goal.point!.z);
    if (npc) r.walkToNpc(npc.figureId);
    else r.walkTo(goal.point);
    useGame.getState().pushLog(`${goal.label}(으)로 가는 길이다. 바닥의 금빛 발자국을 따라가자.`);
  }, [goal, map]);

  /* ── 나침반 ── */
  let bearing: number | null = null;
  let distance = 0;
  if (pose && goal.point && !modalOpen) {
    const dx = goal.point.x + 0.5 - pose.x;
    const dz = goal.point.z + 0.5 - pose.z;
    distance = Math.hypot(dx, dz);
    const targetYaw = Math.atan2(-dx, -dz);
    let diff = (pose.yaw - targetYaw) % (Math.PI * 2);
    if (diff > Math.PI) diff -= Math.PI * 2;
    if (diff < -Math.PI) diff += Math.PI * 2;
    bearing = distance > 2 ? diff : null;
  }

  /* ── 키보드: Esc 로 닫기 ── */
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      const s = useGame.getState();
      if (s.attempt) s.closeQuest();
      else if (s.plaque) s.closePlaque();
      else if (s.noteCard) s.closeNote();
      else if (s.recapOpen) s.setRecap(false);
      else if (s.dialogue) s.closeDialogue();
      else if (s.relicCard) s.closeRelic();
      else if (s.panel) s.setPanel(null);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  /* ── 대화 내용 ── */
  const dialogueFigure = dialogue ? figures[dialogue.figureId] : null;
  const dialogueQuest = dialogue?.questId ? getQuest(dialogue.questId) : null;
  const docentSpeech =
    dialogue?.figureId === 'docent'
      ? docentLines({ prologueDone, allDone, finished, hasQuest: Boolean(dialogueQuest), nickname, prequelPlayed, pledge: Boolean(pledge) })
      : undefined;

  const pendingHere = map.npcs.filter((n) => availableQuestFor(n.figureId, mapId, completed, act) !== null).length;
  const solved = solvedIds(completed).length;
  const dateLabel = mapId === 'memorial' ? '오늘' : next?.map === mapId ? next.dateLabel : map.period;
  const focusLabel =
    focus?.kind === 'npc'
      ? `${figures[focus.id]?.name ?? ''}에게 말 걸기`
      : focus?.kind === 'plaque'
        ? `${figures[focus.id]?.name ?? ''} 선생님 명패 보기`
        : '';

  return (
    <div className={`game-root${modalOpen ? ' modal-open' : ''}${settings.largeText ? ' text-large' : ''}`}>
      <div className="world-layer" ref={containerRef} />

      <div className="hud">
        <PortraitBar resources={resources} figure={figures.player} nickname={nickname} />
        <SituationPanel
          map={map}
          act={act}
          solved={solved}
          total={TOTAL_QUESTS}
          objective={goal.objective}
          points={points}
          canGuide={Boolean(goal.point)}
          guideLabel="데려다 주기"
          onGuide={handleGuide}
        />
        {finished && mapId === 'memorial' && !ending && (
          <button className="btn primary finish-button" onClick={() => useGame.getState().setEnding(true)}>
            📜 감사 증서 받기
          </button>
        )}
        <ToolRail
          panel={panel}
          pendingQuests={pendingHere}
          relicCount={relicIds.length}
          onSelect={(kind) => useGame.getState().setPanel(kind)}
        />
        <BottomBar
          resources={resources}
          log={log}
          dateLabel={dateLabel}
          pointsEarned={pointsEarned}
          donated={totalDonated(donations)}
          level={level}
        />
        {!modalOpen && <Compass bearing={bearing} label={goal.label} distance={distance} />}
        {!modalOpen && <RoomBanner name={room} />}
        {!modalOpen && <Crosshair focus={focus} label={focusLabel} onActivate={() => rendererRef.current?.activateFocus()} />}
        {!modalOpen && <TouchControls onMove={(x, z) => rendererRef.current?.setMoveInput(x, z)} />}
        {toast && <Toast text={toast.text} key={toast.id} />}

        {panel && (
          <Panel
            kind={panel}
            level={level}
            mapId={mapId}
            act={act}
            completed={completed}
            missed={missed}
            relicIds={relicIds}
            onClose={() => useGame.getState().setPanel(null)}
            onTravel={(m) => useGame.getState().travel(m)}
            onReplayTutorial={() => useGame.getState().openTutorial()}
            onReset={() => useGame.getState().resetGame()}
          />
        )}

        {relicCard && !attempt && (
          <RelicCard relicId={relicCard} level={level} onClose={() => useGame.getState().closeRelic()} />
        )}

        {dialogue && dialogueFigure && !attempt && (
          <Dialogue
            figure={dialogueFigure}
            level={level}
            quest={dialogueQuest}
            questDone={quests.some((q) => q.giver === dialogue.figureId && q.map === mapId && completed[q.id])}
            speech={docentSpeech}
            extra={
              dialogue.figureId === 'docent' && !prologueDone ? (
                <>
                  <button className="btn" onClick={() => useGame.getState().setRecap(true)}>
                    📖 1탄 돌아보기{prequelPlayed === 'yes' ? ' · 기억 퀴즈' : ''}
                  </button>
                  <button
                    className="btn primary"
                    autoFocus
                    onClick={() => {
                      useGame.getState().finishPrologue();
                      const portal = map.portals[0];
                      if (portal) rendererRef.current?.setGuideTarget({ x: portal.x, z: portal.z });
                    }}
                  >
                    🚪 기록 수첩을 펼친다
                  </button>
                </>
              ) : dialogue.figureId === 'docent' && finished ? (
                <button className="btn primary" onClick={() => useGame.getState().setEnding(true)}>
                  📜 감사 증서 받기
                </button>
              ) : dialogue.figureId === 'docent' && allDone && !pledge ? (
                <button className="btn primary" onClick={() => useGame.getState().openNote(6)}>
                  ✍️ 나의 보훈 다짐 쓰기
                </button>
              ) : dialogue.figureId === 'docent' ? (
                <button className="btn" onClick={() => useGame.getState().setRecap(true)}>
                  📖 1탄 돌아보기
                </button>
              ) : null
            }
            onStartQuest={() => dialogueQuest && useGame.getState().openQuest(dialogueQuest.id)}
            onClose={() => useGame.getState().closeDialogue()}
          />
        )}

        {attempt && (
          <QuestView
            quest={getQuest(attempt.questId)}
            attempt={attempt}
            level={level}
            onPick={(id) => useGame.getState().pick(id)}
            onSubmit={() => useGame.getState().submit()}
            onRetry={() => useGame.getState().retryQuest()}
            onClose={() => useGame.getState().closeQuest()}
          />
        )}

        {plaque && (
          <HonorPanel
            key={plaque}
            figureId={plaque}
            level={level}
            points={points}
            donated={donations[plaque] ?? 0}
            letter={letters.find((l) => l.figureId === plaque)}
            nickname={nickname}
            locked={!allDone}
            onDonate={(amount) => useGame.getState().donate(plaque, amount)}
            onWrite={(body) => useGame.getState().writeLetter(plaque, body)}
            onClose={() => useGame.getState().closePlaque()}
          />
        )}
      </div>

      {actCard && (
        <ActCard
          act={actCard}
          recallSolved={recall.includes('r-journey')}
          onRecall={(c) => useGame.getState().answerRecall('r-journey', c)}
          onClose={() => useGame.getState().closeActCard()}
        />
      )}
      {noteCard && (
        <NoteCard
          key={noteCard}
          act={noteCard}
          existing={notes[noteCard]}
          onSave={(text) => useGame.getState().writeNote(noteCard, text)}
          onClose={() => useGame.getState().closeNote()}
        />
      )}
      {recapOpen && (
        <PrequelRecap
          played={prequelPlayed}
          solved={recall}
          onAnswer={(id, c) => useGame.getState().answerRecall(id, c)}
          onClose={() => useGame.getState().setRecap(false)}
        />
      )}
      {showTutorial && <Tutorial onClose={() => useGame.getState().closeTutorial()} />}
      {ending && (
        <Ending
          nickname={nickname}
          completed={completed}
          missed={missed}
          relicIds={relicIds}
          pointsEarned={pointsEarned}
          donations={donations}
          letters={letters}
          notes={notes}
          code={currentProgressCode(useGame.getState())}
          onExport={() => {
            const st = useGame.getState();
            downloadRecord(st, currentProgressCode(st));
          }}
          onBack={() => useGame.getState().setEnding(false)}
          onRestart={() => useGame.getState().resetGame()}
        />
      )}
    </div>
  );
}

/** 해설사 선생님의 말 — 여행의 어느 단계인지에 따라 달라진다 */
function docentLines(s: {
  prologueDone: boolean;
  allDone: boolean;
  finished: boolean;
  hasQuest: boolean;
  nickname: string;
  prequelPlayed: 'yes' | 'no' | null;
  pledge: boolean;
}): string[] {
  const you = s.nickname ? `${s.nickname} 기록관` : '기록관';
  if (!s.prologueDone) {
    return [
      `어서 와요, ${you}! 여기는 보훈의 전당이에요. 벽을 따라 늘어선 명패는 대한민국 임시정부에서 활동한 분들이랍니다.`,
      s.prequelPlayed === 'no'
        ? '1탄 『임시정부 1919-1945』에서는 광복을 향해 싸운 사람들의 이야기를 다뤘어요. 처음이라면 「📖 1탄 돌아보기」로 줄거리를 먼저 보고 가요. 그분들은 싸우기만 한 게 아니라, 나라 이름을 짓고 헌법을 쓰고 세금과 신문과 외교로 「정부」를 꾸렸어요.'
        : '1탄에서 우리는 광복을 향해 싸운 사람들을 만났죠. 그런데 그분들은 싸우기만 한 게 아니에요. 나라 이름을 짓고, 헌법을 쓰고, 세금과 신문과 외교로 「정부」를 꾸렸어요. 나라를 되찾은 뒤 세울 새 나라의 설계도까지 그렸지요. 「📖 1탄 돌아보기」에서 기억을 먼저 꺼내 봐도 좋아요.',
      '여기 이 낡은 기록 수첩을 펼치면 붉은 길 끝의 「시간의 문」이 열려요. 1919년 상하이로 건너가 새 나라가 태어나는 순간을 기록해 오세요. 임무를 풀고 기록 조각을 모으면 「보훈 포인트」가 쌓여요. 돌아오면 그 포인트로 이분들께 마음을 전할 거예요.',
    ];
  }
  if (s.hasQuest) {
    return [`돌아왔군요, ${you}! 1919년에서 1948년까지, 정말 긴 여행이었어요.`];
  }
  if (s.finished) {
    return [
      `${you}, 명패 앞에 놓인 국화와 편지가 보이나요? 여러분이 전한 마음이에요.`,
      '보훈은 거창한 일이 아니에요. 기억하고, 고마워하고, 그분들이 꿈꾼 나라를 오늘 우리가 잘 가꾸는 것 — 그게 보훈이에요. 감사 증서를 받아 가세요.',
    ];
  }
  if (s.allDone && !s.pledge && !s.hasQuest) {
    return [
      '이제 모은 보훈 포인트로 마음을 전할 차례예요. 벽의 명패 앞에 서서 바라보면 명패가 열려요. 북쪽 벽에는 이름을 남기지 못한 분들을 위한 명패도 있어요.',
      '기부하면 흰 국화가, 편지를 쓰면 봉투가 놓여요. 그리고 마지막으로 「나의 보훈 다짐」을 적어 주세요. 기부 한 번·편지 한 통·다짐 하나가 모이면 감사 증서를 받을 수 있어요. (게임 속 포인트는 실제 돈이 아니에요!)',
    ];
  }
  if (s.allDone) {
    return [
      '이제 모은 보훈 포인트로 마음을 전할 차례예요. 벽의 명패 앞에 서서 바라보면 명패가 열려요.',
      '기부하면 명패 앞에 흰 국화가 놓이고, 편지를 쓰면 봉투가 놓여요. 적어도 한 분께 기부하고 한 통의 편지를 쓰면 감사 증서를 받을 수 있어요. 게임 속 포인트는 실제 돈이 아니라는 것, 잊지 마세요!',
    ];
  }
  return [
    `여행 중이군요, ${you}! 명패의 주인공들을 벌써 만나고 있나요?`,
    '시간의 문으로 가면 지금 기록해야 할 시대로 돌아갈 수 있어요. 여행을 모두 마치면 이 명패들 앞에서 기부와 편지를 드릴 수 있어요.',
  ];
}
