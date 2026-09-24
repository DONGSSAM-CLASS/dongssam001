import type { Level, MapId } from '../types';
import { acts, quests } from '../data/quests';
import { MAP_ORDER, maps } from '../data/maps';
import { figures } from '../data/figures';
import { timeline } from '../data/timeline';
import { relics } from '../data/relics';
import { blueprint } from '../data/blueprint';
import { isUnlocked } from '../engine/rules';
import { ACT_MAP, currentProgressCode, useGame, type PanelKind } from '../store/gameStore';
import { useSettings } from '../store/settings';
import { notePrompts } from '../data/notes';
import { prequelLinks } from '../data/prequel';
import { downloadRecord } from './exportRecord';
import { useState } from 'react';

const TITLES: Record<Exclude<PanelKind, null>, string> = {
  quests: '임무 기록',
  blueprint: '새 나라 설계도',
  timeline: '연표 — 새 나라가 만들어진 길',
  atlas: '장소',
  relics: '기록 조각',
  notes: '생각 노트',
  settings: '설정',
  help: '도움말',
};

export function Panel({
  kind,
  level,
  mapId,
  act,
  completed,
  missed,
  relicIds,
  onClose,
  onTravel,
  onReplayTutorial,
  onReset,
}: {
  kind: Exclude<PanelKind, null>;
  level: Level;
  mapId: MapId;
  act: number;
  completed: Record<string, boolean>;
  missed: string[];
  relicIds: string[];
  onClose(): void;
  onTravel(map: MapId): void;
  onReplayTutorial(): void;
  onReset(): void;
}) {
  return (
    <div className={`panel frame${kind === 'blueprint' ? ' wide' : ''}`}>
      <div className="panel-head">
        <span className="panel-title">{TITLES[kind]}</span>
        <button className="btn small ghost" onClick={onClose}>
          닫기
        </button>
      </div>
      <div className="panel-body">
        {kind === 'quests' && <QuestList completed={completed} missed={missed} />}
        {kind === 'blueprint' && <Blueprint completed={completed} />}
        {kind === 'timeline' && <Timeline />}
        {kind === 'atlas' && <Atlas level={level} mapId={mapId} act={act} onTravel={onTravel} />}
        {kind === 'relics' && <Relics level={level} relicIds={relicIds} />}
        {kind === 'notes' && <Notes />}
        {kind === 'settings' && <SettingsPanel />}
        {kind === 'help' && <Help onReplayTutorial={onReplayTutorial} onReset={onReset} />}
      </div>
    </div>
  );
}

function QuestList({ completed, missed }: { completed: Record<string, boolean>; missed: string[] }) {
  return (
    <>
      {acts.map((act) => {
        const inAct = quests.filter((q) => q.act === act.act);
        return (
          <section key={act.act} style={{ marginBottom: 14 }}>
            <div className="list-title" style={{ color: 'var(--brass)' }}>
              {act.title}
            </div>
            <div className="list-sub" style={{ marginBottom: 6 }}>
              {act.period} · {act.map}
            </div>
            {inAct.map((q) => {
              const done = completed[q.id] === true;
              const open = isUnlocked(q, completed);
              return (
                <div className="list-item" key={q.id} data-done={done} data-locked={!open && !done}>
                  <div className="list-title">
                    {done ? '✅' : open ? '📜' : '🔒'} {q.title}
                  </div>
                  <div className="list-sub">
                    {q.dateLabel} · {figures[q.giver]?.name}
                    {done && (missed.includes(q.id) ? ' · 다시 풀어 맞힘' : ' · 한 번에 맞힘')}
                  </div>
                  {prequelLinks[q.id] && <div className="prequel-mini">🔗 1탄 {prequelLinks[q.id].title}</div>}
                </div>
              );
            })}
          </section>
        );
      })}
    </>
  );
}

function Blueprint({ completed }: { completed: Record<string, boolean> }) {
  const built = new Set(quests.filter((q) => completed[q.id]).map((q) => q.blueprint));
  return (
    <>
      <p className="list-sub" style={{ marginTop: 0 }}>
        임무를 하나 풀 때마다 새 나라의 기둥이 하나씩 섭니다. 모두 세우면 오늘의 대한민국을 이루는 원리들이 완성돼요.
        ({built.size} / {blueprint.length})
      </p>
      <div className="blueprint-grid">
        {blueprint.map((p) => (
          <div className="blueprint-cell" key={p.key} data-built={built.has(p.key)}>
            <div className="blueprint-icon">{built.has(p.key) ? p.icon : '▢'}</div>
            <div className="blueprint-label">{p.label}</div>
            {built.has(p.key) && <div className="blueprint-today">오늘 · {p.today}</div>}
          </div>
        ))}
      </div>
    </>
  );
}

function Timeline() {
  return (
    <>
      <p className="list-sub" style={{ marginTop: 0 }}>
        <span className="tag prequel-tag">1탄</span> 표시는 1탄 『임시정부 1919-1945』에서 자세히 다룬 사건이에요. 두 게임을 합치면 1919년부터
        1948년까지 한 줄로 이어져요.
      </p>
      {timeline.map((t) => (
        <div className="timeline-entry" key={t.date + t.title}>
          <div className="timeline-date">{t.label}</div>
          <div className="timeline-title">
            {t.title} {t.prequel && <span className="tag prequel-tag">1탄</span>}
          </div>
          <div className="timeline-detail">{t.detail}</div>
          <div className="timeline-note">근거 · {t.sourceNote}</div>
        </div>
      ))}
    </>
  );
}

function Atlas({ level, mapId, act, onTravel }: { level: Level; mapId: MapId; act: number; onTravel(map: MapId): void }) {
  return (
    <>
      <p className="list-sub" style={{ marginTop: 0 }}>
        다녀온 장소와 지금 시대의 장소로는 여기서 바로 옮겨 갈 수 있어요. 앞으로 갈 곳은 시간의 문이 열려야 갈 수 있어요.
      </p>
      {MAP_ORDER.map((id) => {
        const map = maps[id];
        const mapAct = Number(Object.keys(ACT_MAP).find((k) => ACT_MAP[Number(k)] === id));
        const reachable = id === 'memorial' || mapAct <= act;
        return (
          <button
            key={id}
            className="atlas-card"
            aria-current={id === mapId}
            disabled={!reachable || id === mapId}
            onClick={() => onTravel(id)}
          >
            <div className="atlas-name">
              {reachable ? '' : '🔒 '}
              {map.name}
            </div>
            <div className="atlas-original">{map.nameOriginal}</div>
            <div className="atlas-period">{map.period}</div>
            <div className="atlas-summary">{map.summary[level]}</div>
            <div className="atlas-note">{map.historicalNote}</div>
          </button>
        );
      })}
    </>
  );
}

function Relics({ level, relicIds }: { level: Level; relicIds: string[] }) {
  return (
    <>
      <p className="list-sub" style={{ marginTop: 0 }}>
        장소 곳곳에 빛나는 두루마리가 숨어 있어요. 가까이 걸어가면 주워요. ({relicIds.length} / {relics.length})
      </p>
      {MAP_ORDER.filter((m) => m !== 'memorial').map((m) => (
        <section key={m} style={{ marginBottom: 12 }}>
          <div className="list-title" style={{ color: 'var(--brass)' }}>
            {maps[m].name}
          </div>
          {relics
            .filter((r) => r.map === m)
            .map((r) => {
              const got = relicIds.includes(r.id);
              return (
                <div className="list-item" key={r.id} data-done={false} data-locked={!got}>
                  <div className="list-title">
                    {got ? r.icon : '❔'} {got ? r.name : '아직 찾지 못한 기록'}
                  </div>
                  {got && <div className="list-sub">{r.text[level]}</div>}
                  {got && <div className="timeline-note">근거 · {r.sourceNote}</div>}
                </div>
              );
            })}
        </section>
      ))}
    </>
  );
}

function Help({ onReplayTutorial, onReset }: { onReplayTutorial(): void; onReset(): void }) {
  return (
    <div className="help">
      <h4>움직이기</h4>
      <ul>
        <li>
          <kbd>W</kbd>
          <kbd>A</kbd>
          <kbd>S</kbd>
          <kbd>D</kbd> 또는 방향키 — 걷기 (<kbd>Shift</kbd> 누르고 있으면 뛰기)
        </li>
        <li>
          <kbd>Q</kbd>
          <kbd>E</kbd> 또는 <kbd>←</kbd>
          <kbd>→</kbd> — 제자리에서 돌기
        </li>
        <li>화면을 끌면 둘러보고, 바닥을 누르면 그 자리까지 걸어가요.</li>
        <li>태블릿에서는 왼쪽 아래 동그라미를 밀어서 걸어요.</li>
      </ul>
      <h4>이야기하기</h4>
      <ul>
        <li>
          머리 위에 <strong style={{ color: '#ffd24a' }}>노란 느낌표</strong>가 있는 사람이 임무를 줘요.
        </li>
        <li>
          가까이 가서 바라보면 <kbd>스페이스</kbd> 안내가 떠요. 멀리 있는 사람을 눌러도 그 앞까지 걸어가요.
        </li>
        <li>길을 모르겠으면 오른쪽 위 <strong>👉 데려다 주기</strong>를 누르세요. 바닥에 금빛 발자국이 생겨요.</li>
      </ul>
      <h4>보훈 포인트</h4>
      <ul>
        <li>한 번에 맞히면 100, 다시 풀어 맞히면 50, 기록 조각 하나에 40, 한 시대를 마치면 100.</li>
        <li>마지막에 보훈의 전당에서 국가유공자께 기부하고 감사 편지를 써요.</li>
        <li>
          <strong>게임 속 포인트는 실제 돈이 아닙니다.</strong> 마음을 전하는 연습이에요.
        </li>
      </ul>
      <h4>1탄과 이어 보기</h4>
      <ul>
        <li>
          1탄 『임시정부 1919-1945』의 줄거리와 기억 퀴즈는{' '}
          <button className="linklike" onClick={() => useGame.getState().setRecap(true)}>
            📖 1탄 돌아보기
          </button>
          에서 볼 수 있어요.
        </li>
        <li>퀘스트 해설에 「🔗 1탄에서는」이 붙어 있으면, 같은 사건을 1탄은 어떻게 다뤘는지 알려 줘요.</li>
      </ul>
      <h4>다른 컴퓨터에서 이어 하기</h4>
      <ProgressCodeBox />
      <h4>개인정보</h4>
      <ul>
        <li>이름·이메일을 받지 않아요. 기록과 편지는 이 기기의 브라우저 안에만 저장돼요.</li>
      </ul>
      <div className="dialogue-actions">
        <button className="btn" onClick={onReplayTutorial}>
          조작 안내 다시 보기
        </button>
        <button
          className="btn ghost"
          onClick={() => {
            if (window.confirm('처음부터 다시 시작할까요? 지금까지의 기록과 편지가 모두 지워집니다.')) onReset();
          }}
        >
          처음부터 다시
        </button>
      </div>
    </div>
  );
}

function ProgressCodeBox() {
  const state = useGame();
  const code = currentProgressCode(state);
  const [copied, setCopied] = useState(false);
  return (
    <div className="code-box">
      <p className="list-sub" style={{ margin: '0 0 6px' }}>
        수업이 끝날 때 이 코드를 공책에 적어 두세요. 다음 시간 어느 컴퓨터에서든 시작 화면의 「진행 코드로 이어하기」에 넣으면 돌아와요.
        (편지·생각 노트의 글은 옮겨지지 않아요)
      </p>
      <div className="code-value">{code}</div>
      <div className="dialogue-actions">
        <button
          className="btn small"
          onClick={() => {
            void navigator.clipboard?.writeText(code).then(() => setCopied(true));
          }}
        >
          {copied ? '복사했어요' : '코드 복사'}
        </button>
        <button className="btn small" onClick={() => downloadRecord(state, code)}>
          📄 학습 기록 내려받기
        </button>
      </div>
    </div>
  );
}

function Notes() {
  const notes = useGame((s) => s.notes);
  const completed = useGame((s) => s.completed);
  return (
    <>
      <p className="list-sub" style={{ marginTop: 0 }}>
        한 시대(막)를 마칠 때마다 생각 노트를 써요. 정답이 없는 질문이에요 — 게임에서 본 사실을 근거로 내 생각을 적어 보세요.
      </p>
      {notePrompts.map((p) => {
        const open = quests.filter((q) => q.act === p.act).every((q) => completed[q.id]);
        return (
          <div className="list-item" key={p.act} data-locked={!open}>
            <div className="list-title">
              {notes[p.act] ? '✍️' : open ? '📝' : '🔒'} {p.act === 6 ? '나의 보훈 다짐' : `제${p.act}막 · ${p.skill}`}
            </div>
            <div className="list-sub">{p.question}</div>
            {notes[p.act] && <div className="note-preview">{notes[p.act]}</div>}
            {open && (
              <button className="btn small" style={{ marginTop: 6 }} onClick={() => useGame.getState().openNote(p.act)}>
                {notes[p.act] ? '고쳐 쓰기' : '지금 쓰기'}
              </button>
            )}
          </div>
        );
      })}
    </>
  );
}

function SettingsPanel() {
  const st = useSettings();
  return (
    <div className="settings">
      <label className="setting-row">
        <input type="checkbox" checked={st.largeText} onChange={(e) => st.set({ largeText: e.target.checked })} />
        <span>
          <strong>글자 크게</strong>
          <em>대화·문제·패널의 글자를 키워요.</em>
        </span>
      </label>
      <label className="setting-row">
        <input type="checkbox" checked={!st.headBob} onChange={(e) => st.set({ headBob: !e.target.checked })} />
        <span>
          <strong>화면 흔들림 끄기</strong>
          <em>걸을 때 어지러우면 켜세요.</em>
        </span>
      </label>
      <label className="setting-row">
        <input type="checkbox" checked={st.alwaysLabels} onChange={(e) => st.set({ alwaysLabels: e.target.checked })} />
        <span>
          <strong>이름표 늘 보이기</strong>
          <em>벽 너머·멀리 있는 사람의 이름도 보여요.</em>
        </span>
      </label>
      <label className="setting-row">
        <input type="checkbox" checked={st.sound} onChange={(e) => st.set({ sound: e.target.checked })} />
        <span>
          <strong>효과음</strong>
          <em>맞혔을 때·기록 조각·국화를 올릴 때 짧은 소리.</em>
        </span>
      </label>
      <div className="setting-row">
        <span>
          <strong>둘러보기 감도 · {st.lookSpeed.toFixed(1)}</strong>
          <em>화면을 끌 때 도는 빠르기.</em>
          <input
            type="range"
            min={0.5}
            max={1.8}
            step={0.1}
            value={st.lookSpeed}
            onChange={(e) => st.set({ lookSpeed: Number(e.target.value) })}
          />
        </span>
      </div>
    </div>
  );
}
