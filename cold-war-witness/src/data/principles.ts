/**
 * 대한민국 인공지능 윤리원칙 — 3대 가치와 7대 원칙 (학생용으로 풀어 쓴 것)
 *
 * 원문 확인처: 인공지능 윤리 소통채널 https://ai.kisdi.re.kr
 * - description(학생용 설명)은 수업 명세서의 문장을 그대로 옮겼습니다.
 * - coldWarLink(냉전 연결 한 줄)는 이 앱의 장면·사실 카드에서만 가져와 썼습니다.
 * - 3대 가치의 설명(description)은 명세서에 없어 새로 쓴 것입니다 → 원문과 대조가 필요합니다. [검증필요]
 */
import type { CoreValue, Principle, PrincipleId } from '../types/content';

/** 원칙 발표 표기 (명세서 기준) */
export const PRINCIPLES_TITLE = '대한민국 인공지능 윤리원칙';
export const PRINCIPLES_NOTE = '2026년 8월 확정 · 원문: 인공지능 윤리 소통채널(ai.kisdi.re.kr)';
export const PRINCIPLES_SOURCE_URL = 'https://ai.kisdi.re.kr';

export const CORE_VALUES: CoreValue[] = [
  {
    id: 'dignity',
    name: '인간의 존엄성',
    icon: '🤝',
    description: '사람은 누구나 소중합니다. AI는 사람을 해치거나 도구처럼 다뤄서는 안 됩니다.',
  },
  {
    id: 'commonGood',
    name: '사회의 공공선',
    icon: '🏘️',
    description: 'AI는 몇몇 사람만이 아니라 우리 사회 모두에게 도움이 되어야 합니다.',
  },
  {
    id: 'sustainability',
    name: '인류의 지속가능성',
    icon: '🌏',
    description: 'AI는 지금 우리뿐 아니라 다음 세대와 인류의 미래까지 생각하며 써야 합니다.',
  },
];

/** 카드 보드·도감에 놓이는 순서 */
export const PRINCIPLES: Principle[] = [
  {
    id: 'humanCentric',
    name: '인간중심성',
    icon: '🧑',
    color: '#8a4b08',
    description: 'AI는 사람의 판단과 창의성, 문제 해결 능력을 돕는 방향으로 쓰여야 한다.',
    coldWarLink: '사람에 대한 판단은 기록이 아니라 사람이 책임지고 내려야 합니다. AI의 판단을 그대로 따르기만 하면 결정의 주인은 사라집니다.',
    chapter: 'ch1',
  },
  {
    id: 'privacy',
    name: '프라이버시 보호',
    icon: '🔒',
    color: '#1d4e89',
    description: '개인정보는 필요한 범위에서만 처리하고, 내 정보에 대한 나의 결정권을 존중해야 한다.',
    coldWarLink: '슈타지의 비공식 협력자들은 동료·친구·이웃·가족을 감시해 보고했습니다. 필요 이상으로 모인 정보는 사람 사이의 믿음을 무너뜨립니다.',
    chapter: 'ch1',
  },
  {
    id: 'fairness',
    name: '공정성·포용성',
    icon: '⚖️',
    color: '#6b3fa0',
    description: 'AI의 편향 때문에 누군가 부당하게 차별받지 않도록 하고, 모두가 AI의 혜택과 기회에 공평하게 다가갈 수 있어야 한다.',
    coldWarLink: '근거 없는 고발로 죄 없는 많은 사람이 직장과 명예를 잃었습니다. 치우친 데이터로 사람을 분류하는 AI도 같은 상처를 남길 수 있습니다.',
    chapter: 'ch2',
  },
  {
    id: 'accountability',
    name: '책임성',
    icon: '📋',
    color: '#0f6b5c',
    description: 'AI와 관련된 모든 사람이 자기 역할과 책임을 다하고, 문제가 생기면 누구 책임인지 밝히고 피해를 회복해야 한다.',
    coldWarLink: '명단을 끝내 내놓지 않은 고발 때문에 피해가 생겼다면 누가 책임져야 했을까요? AI의 잘못된 판단에도 책임을 밝히고 피해를 회복해야 합니다.',
    chapter: 'ch2',
  },
  {
    id: 'safety',
    name: '안전성',
    icon: '🛡️',
    color: '#9b1c1c',
    description: '생명·몸·재산에 피해가 생기지 않도록, 그리고 잘못 쓰이거나 공격받는 경우에 대비해야 한다.',
    coldWarLink: '후일 증언에 따르면, 연락이 끊긴 잠수함 B-59에서 한 장교의 반대가 핵어뢰 발사를 막았습니다. 위험한 결정일수록 멈출 장치가 필요합니다.',
    chapter: 'ch3',
  },
  {
    id: 'reliability',
    name: '신뢰성',
    icon: '✅',
    color: '#2f6b1f',
    description: 'AI는 쓰이는 목적과 상황에 알맞은 성능을 갖춰야 한다.',
    coldWarLink: '위기 속에서는 확인되지 않은 소문 하나가 불안을 키웁니다. AI도 쓰이는 목적에 맞게 믿을 만한 성능을 갖춰야 합니다.',
    chapter: 'ch3',
  },
  {
    id: 'transparency',
    name: '투명성',
    icon: '🔍',
    color: '#0e6377',
    description: 'AI를 쓰고 있는지, 어느 정도로 쓰는지, 한계는 무엇인지 이해하기 쉽게 알려야 한다.',
    coldWarLink: '튀르키예 미사일 철수 합의는 25년 넘게 비밀이었습니다. 무엇을 어떻게 결정했는지 알려야 사람들이 올바르게 판단할 수 있습니다.',
    chapter: 'ch3',
  },
];

const PRINCIPLE_MAP = new Map(PRINCIPLES.map((p) => [p.id, p]));

export function getPrinciple(id: PrincipleId): Principle {
  const principle = PRINCIPLE_MAP.get(id);
  if (!principle) throw new Error(`원칙을 찾을 수 없어요: ${id}`);
  return principle;
}
