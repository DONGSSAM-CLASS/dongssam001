import type {
  Leveled,
  Level,
  Quest,
  QuestChoice,
  ResourceDelta,
  ResourceKey,
  Resources,
} from '../types';

/**
 * 게임 규칙 — 전부 순수 함수로 두어 단위 테스트가 가능하게 한다.
 * 화면(three.js/React)에는 규칙 코드를 두지 않는다.
 */

/**
 * 시작 자원.
 *
 * 1919년 4월 상하이에서 임시정부가 출범할 때의 형편을 숫자로 옮긴 것이다.
 * 정부라고는 하나 영토·군대·세입이 없었고, 활동비는 동포의 애국금과
 * 신한청년당 계열 인사들이 모은 여비에 기대고 있었다.
 */
export const INITIAL_RESOURCES: Resources = {
  funds: 1200,
  agents: 6,
  prestige: 10,
  forces: 0,
  unity: 55,
  heat: 15,
};

/** 자원 한계 — 0~100 범위를 쓰는 항목들 */
const CLAMPED: Partial<Record<ResourceKey, [number, number]>> = {
  prestige: [0, 100],
  unity: [0, 100],
  heat: [0, 100],
};

/** 자원 이름 (HUD 표기) */
export const RESOURCE_LABELS: Record<ResourceKey, string> = {
  funds: '독립운동자금',
  agents: '요원',
  prestige: '국제 신망',
  forces: '군사력',
  unity: '통합도',
  heat: '일제 감시',
};

export const RESOURCE_ICONS: Record<ResourceKey, string> = {
  funds: '💰',
  agents: '🧭',
  prestige: '🌐',
  forces: '🎖️',
  unity: '🤝',
  heat: '👁️',
};

/** 자원 증감을 적용한다. 원본을 바꾸지 않는다. */
export function applyDelta(resources: Resources, delta: ResourceDelta): Resources {
  const next: Resources = { ...resources };
  (Object.keys(delta) as ResourceKey[]).forEach((key) => {
    const amount = delta[key];
    if (amount === undefined) return;
    let value = next[key] + amount;
    const clamp = CLAMPED[key];
    if (clamp) value = Math.min(clamp[1], Math.max(clamp[0], value));
    else value = Math.max(0, value);
    next[key] = Math.round(value);
  });
  return next;
}

/** 선택지를 고를 자원이 되는지 확인한다. */
export function canAfford(resources: Resources, requires?: ResourceDelta): boolean {
  if (!requires) return true;
  return (Object.keys(requires) as ResourceKey[]).every((key) => {
    const need = requires[key];
    if (need === undefined) return true;
    // heat 는 「이 값 이하여야 한다」는 상한 조건으로 읽는다.
    if (key === 'heat') return resources.heat <= need;
    return resources[key] >= need;
  });
}

/** 자원이 모자랄 때 학생에게 보여 줄 안내 문구 */
export function affordHint(resources: Resources, requires: ResourceDelta): string {
  const missing: string[] = [];
  (Object.keys(requires) as ResourceKey[]).forEach((key) => {
    const need = requires[key];
    if (need === undefined) return;
    if (key === 'heat') {
      if (resources.heat > need) missing.push(`일제 감시 ${need} 이하`);
      return;
    }
    if (resources[key] < need) missing.push(`${RESOURCE_LABELS[key]} ${need}`);
  });
  return missing.length ? `필요: ${missing.join(' · ')}` : '';
}

/** 정답 채점 — 퀘스트 종류별로 비교 방식이 다르다. */
export function gradeQuest(quest: Quest, picked: string[]): boolean {
  if (quest.kind === 'order') {
    if (picked.length !== quest.answer.length) return false;
    return quest.answer.every((id, i) => picked[i] === id);
  }
  if (picked.length !== quest.answer.length) return false;
  const want = [...quest.answer].sort();
  const got = [...picked].sort();
  return want.every((id, i) => got[i] === id);
}

/**
 * 퀘스트 결과를 계산한다.
 *
 * 오답이어도 게임이 끝나지는 않는다. 임시정부의 실제 역사가 그랬듯,
 * 판단이 어긋나면 자원을 잃고 감시가 올라갈 뿐 다시 시도할 수 있다.
 * 다만 보상은 정답일 때의 절반만 준다.
 */
export interface QuestResult {
  correct: boolean;
  resources: Resources;
  gained: ResourceDelta;
}

export function resolveQuest(
  quest: Quest,
  picked: string[],
  resources: Resources,
): QuestResult {
  const correct = gradeQuest(quest, picked);
  const chosen = quest.choices.filter((c) => picked.includes(c.id));

  // 선택한 선택지 자체의 결과를 먼저 합산한다.
  let gained: ResourceDelta = {};
  for (const choice of chosen) gained = mergeDelta(gained, choice.delta);

  // 정답 보상 (오답이면 절반, 반올림)
  const rewardScale = correct ? 1 : 0.5;
  gained = mergeDelta(gained, scaleDelta(quest.reward, rewardScale));

  // 오답은 일제 감시를 조금 올린다 — 잘못된 판단은 조직을 노출시킨다.
  if (!correct) gained = mergeDelta(gained, { heat: 5 });

  return { correct, resources: applyDelta(resources, gained), gained };
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

/** 동지(파티) 보정을 모두 더한 값 */
export function partyBonus(bonuses: Array<ResourceDelta | undefined>): ResourceDelta {
  return bonuses.reduce<ResourceDelta>((acc, b) => (b ? mergeDelta(acc, b) : acc), {});
}

/**
 * 일제 감시 경보 단계.
 * 실제로 임시정부 청사는 일본 영사관 경찰의 감시·수색을 받았고,
 * 1932년 윤봉길 의거 뒤에는 상하이를 떠나야 했다.
 */
export type HeatLevel = 'calm' | 'watched' | 'danger' | 'critical';

export function heatLevel(heat: number): HeatLevel {
  if (heat >= 85) return 'critical';
  if (heat >= 60) return 'danger';
  if (heat >= 35) return 'watched';
  return 'calm';
}

export const HEAT_TEXT: Record<HeatLevel, Leveled> = {
  calm: {
    middle: '조계 안은 아직 조용해요. 일본 경찰이 함부로 들어오지 못합니다.',
    high: '프랑스 조계의 치외법권 덕분에 일본 영사관 경찰의 직접 단속이 제한되고 있다.',
  },
  watched: {
    middle: '낯선 사람이 청사 앞을 서성입니다. 조심해야 해요.',
    high: '일본 영사관 경찰의 밀정이 청사 주변을 살피고 있다. 문서 관리에 주의가 필요하다.',
  },
  danger: {
    middle: '감시가 심해졌어요. 회의 장소를 자주 바꿔야 합니다.',
    high: '일제의 감시망이 조여 오고 있다. 연통제 조직이 발각될 위험이 커졌다.',
  },
  critical: {
    middle: '더는 버틸 수 없어요. 청사를 옮겨야 할 때입니다.',
    high: '검거 위험이 임계점에 이르렀다. 임시정부는 실제로 이런 상황에서 상하이를 떠나 이동을 시작했다.',
  },
};

/** 수준별 텍스트 고르기 */
export function pick(text: Leveled, level: Level): string {
  return text[level];
}

/** 선택지 정렬 — 학생이 정답 순서를 외우지 못하게 퀘스트 id 기준으로 섞는다. */
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

/** 진행률(%) */
export function progressPercent(completed: Record<string, boolean>, total: number): number {
  if (total === 0) return 0;
  return Math.round((Object.keys(completed).length / total) * 100);
}

/** 선행 퀘스트를 다 풀었는지 */
export function isUnlocked(quest: Quest, completed: Record<string, boolean>): boolean {
  if (!quest.requires || quest.requires.length === 0) return true;
  return quest.requires.every((id) => id in completed);
}

/** 선택지를 고를 수 있는 상태인지 (자원 조건 포함) */
export function selectableChoices(quest: Quest, resources: Resources): QuestChoice[] {
  return quest.choices.filter((choice) => canAfford(resources, choice.requires));
}
