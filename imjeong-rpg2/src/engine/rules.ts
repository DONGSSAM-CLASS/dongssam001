import type { Letter, Quest, ResourceDelta, ResourceKey, Resources } from '../types';

/**
 * 게임 규칙 — 전부 순수 함수 (three.js·React 없음). 1탄과 같은 원칙이다.
 */

/**
 * 시작 지표 — 1919년 4월, 막 세워진 정부의 형편.
 * 영토도 세입도 없이 동포의 성금에 기대 출발했다.
 */
export const INITIAL_RESOURCES: Resources = {
  funds: 800,
  trust: 40,
  prestige: 10,
  law: 5,
  unity: 45,
};

const CLAMPED: Partial<Record<ResourceKey, [number, number]>> = {
  trust: [0, 100],
  prestige: [0, 100],
  law: [0, 100],
  unity: [0, 100],
};

export const RESOURCE_LABELS: Record<ResourceKey, string> = {
  funds: '국고',
  trust: '민심',
  prestige: '외교 신망',
  law: '제도',
  unity: '통합',
};

export const RESOURCE_ICONS: Record<ResourceKey, string> = {
  funds: '💰',
  trust: '🫶',
  prestige: '🌐',
  law: '⚖️',
  unity: '🤝',
};

/* ───────────────────────── 보훈 포인트 ───────────────────────── */

/**
 * 보훈 포인트 — 학생이 게임에서 모아 마지막에 유공자께 (게임 속에서) 기부하는 값.
 * ⚠ 실제 돈이 아니다. 화면에서도 늘 그렇게 밝힌다.
 */
export const POINTS = {
  /** 첫 시도에 사료와 맞게 판단했을 때 */
  questFirstTry: 100,
  /** 틀린 뒤 해설을 읽고 다시 풀어 맞혔을 때 */
  questRetry: 50,
  /** 기록 조각 하나 */
  relic: 40,
  /** 한 막을 모두 마쳤을 때 */
  actComplete: 100,
  /** 기부 단위 */
  donationStep: 50,
} as const;

/** 퀘스트를 맞혔을 때 받는 포인트 */
export function questPoints(firstTry: boolean): number {
  return firstTry ? POINTS.questFirstTry : POINTS.questRetry;
}

/* ───────────────────────── 지표 ───────────────────────── */

export function applyDelta(resources: Resources, delta: ResourceDelta): Resources {
  const next: Resources = { ...resources };
  (Object.keys(delta) as ResourceKey[]).forEach((key) => {
    const amount = delta[key];
    if (amount === undefined) return;
    let value = next[key] + amount;
    const clamp = CLAMPED[key];
    value = clamp ? Math.min(clamp[1], Math.max(clamp[0], value)) : Math.max(0, value);
    next[key] = Math.round(value);
  });
  return next;
}

export function mergeDelta(a: ResourceDelta, b: ResourceDelta): ResourceDelta {
  const out: ResourceDelta = { ...a };
  (Object.keys(b) as ResourceKey[]).forEach((key) => {
    const amount = b[key];
    if (amount === undefined) return;
    out[key] = (out[key] ?? 0) + amount;
  });
  return out;
}

export function scaleDelta(delta: ResourceDelta, factor: number): ResourceDelta {
  const out: ResourceDelta = {};
  (Object.keys(delta) as ResourceKey[]).forEach((key) => {
    const amount = delta[key];
    if (amount === undefined) return;
    out[key] = Math.round(amount * factor);
  });
  return out;
}

/* ───────────────────────── 채점 ───────────────────────── */

export function gradeQuest(quest: Quest, picked: string[]): boolean {
  if (picked.length !== quest.answer.length) return false;
  if (quest.kind === 'order') return quest.answer.every((id, i) => picked[i] === id);
  const want = [...quest.answer].sort();
  const got = [...picked].sort();
  return want.every((id, i) => got[i] === id);
}

export interface QuestResult {
  correct: boolean;
  resources: Resources;
  gained: ResourceDelta;
  points: number;
}

/**
 * 퀘스트 결과.
 * 틀려도 게임은 끝나지 않는다. 해설을 읽고 다시 풀면 되고, 다만 포인트가 줄어든다.
 * 지표는 고른 선택지의 결과를 그대로 반영한다 — 실제 역사에서도 판단에는 대가가 따랐다.
 */
export function resolveQuest(
  quest: Quest,
  picked: string[],
  resources: Resources,
  missedBefore: boolean,
): QuestResult {
  const correct = gradeQuest(quest, picked);
  let gained: ResourceDelta = {};
  for (const choice of quest.choices.filter((c) => picked.includes(c.id))) {
    gained = mergeDelta(gained, choice.delta);
  }
  if (correct) gained = mergeDelta(gained, quest.reward);
  const points = correct ? questPoints(!missedBefore) : 0;
  return { correct, resources: applyDelta(resources, gained), gained, points };
}

/* ───────────────────────── 진행 ───────────────────────── */

export function isUnlocked(quest: Quest, completed: Record<string, boolean>): boolean {
  return (quest.requires ?? []).every((id) => completed[id] === true);
}

/** 맞힌 퀘스트만 「완료」로 친다 */
export function solvedIds(completed: Record<string, boolean>): string[] {
  return Object.keys(completed).filter((id) => completed[id]);
}

/** 막 번호 — 앞 막의 퀘스트를 모두 풀어야 다음 막이 열린다 */
export function actFromProgress(allQuests: Quest[], completed: Record<string, boolean>, maxAct: number): number {
  let act = 1;
  for (let a = 1; a <= maxAct; a += 1) {
    const inAct = allQuests.filter((q) => q.act === a);
    if (inAct.length > 0 && inAct.every((q) => completed[q.id] === true)) act = a + 1;
    else break;
  }
  return Math.min(maxAct + 1, act);
}

/** 이 막을 이번에 막 끝냈는지 */
export function isActComplete(allQuests: Quest[], completed: Record<string, boolean>, act: number): boolean {
  const inAct = allQuests.filter((q) => q.act === act);
  return inAct.length > 0 && inAct.every((q) => completed[q.id] === true);
}

/** 다음으로 풀 퀘스트 — 막 순서, 같은 막이면 목록 순서 */
export function nextQuest(allQuests: Quest[], completed: Record<string, boolean>): Quest | null {
  return allQuests.find((q) => completed[q.id] !== true && isUnlocked(q, completed)) ?? null;
}

/* ───────────────────────── 기부·편지 ───────────────────────── */

/** 기부할 수 있는지 — 단위에 맞고 남은 포인트 안이어야 한다 */
export function canDonate(points: number, amount: number): boolean {
  return amount > 0 && amount % POINTS.donationStep === 0 && amount <= points;
}

export function totalDonated(donations: Record<string, number>): number {
  return Object.values(donations).reduce((sum, v) => sum + v, 0);
}

/** 편지 최소 글자 수 — 중1이 세 문장 정도 쓰면 넘는 길이 */
export const LETTER_MIN = 60;
export const LETTER_MAX = 1200;

/** 공백을 뺀 글자 수 */
export function letterLength(body: string): number {
  return body.replace(/\s+/g, '').length;
}

export function letterProblem(body: string): string | null {
  const n = letterLength(body);
  if (n < LETTER_MIN) return `조금 더 써 주세요. (공백 빼고 ${LETTER_MIN}자 이상 · 지금 ${n}자)`;
  if (body.length > LETTER_MAX) return `${LETTER_MAX}자 안으로 줄여 주세요.`;
  return null;
}

/** 같은 분께 다시 쓰면 새 편지로 바꾼다 */
export function upsertLetter(letters: Letter[], letter: Letter): Letter[] {
  return [...letters.filter((l) => l.figureId !== letter.figureId), letter];
}

/** 엔딩(감사 증서)을 열 수 있는 조건: 모든 퀘스트 + 기부 1회 이상 + 편지 1통 이상 */
export function canFinish(
  allQuests: Quest[],
  completed: Record<string, boolean>,
  donations: Record<string, number>,
  letters: Letter[],
): boolean {
  return (
    allQuests.every((q) => completed[q.id] === true) && totalDonated(donations) > 0 && letters.length > 0
  );
}

/* ───────────────────────── 기타 ───────────────────────── */

export function stableShuffle<T extends { id: string }>(items: T[], seed: string): T[] {
  const scored = items.map((item) => ({ item, key: hash(`${seed}:${item.id}`) }));
  scored.sort((a, b) => a.key - b.key);
  return scored.map((s) => s.item);
}

function hash(text: string): number {
  let h = 2166136261;
  for (let i = 0; i < text.length; i += 1) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** 두 각도 사이를 부드럽게 (라디안, 최단 방향) */
export function lerpAngle(from: number, to: number, t: number): number {
  let diff = (to - from) % (Math.PI * 2);
  if (diff > Math.PI) diff -= Math.PI * 2;
  if (diff < -Math.PI) diff += Math.PI * 2;
  return from + diff * t;
}

/**
 * 1인칭 시선 방향(yaw) — 0 이면 -z 쪽을 본다 (three.js 카메라 기본 방향).
 * (dx, dz) 쪽을 보려면 yaw = atan2(-dx, -dz).
 */
export function yawToward(dx: number, dz: number): number {
  return Math.atan2(-dx, -dz);
}
