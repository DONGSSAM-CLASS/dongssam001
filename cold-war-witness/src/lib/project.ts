/**
 * 6차시 모둠 프로젝트 계산 함수 (화면 밖 — tests/unit.test.ts 에서 확인)
 */
import { ACTIVITY_OPENS, ALL_CHECK_IDS, PLAN_FIELDS, ROLES, RUBRIC } from '../data/project';
import type { ActivityId, RoleId } from '../types/content';
import type { AiLog, FinalReviewDoc, GroupDoc, GroupMember, GroupPlan } from '../types/db';
import { countChars } from './progress';
import { eulReul } from './josa';

/** 지금 차시에 이 활동이 열려 있는지 (지난 차시 활동은 계속 열려 있다) */
export function isActivityOpen(activity: ActivityId, session: number): boolean {
  return session >= ACTIVITY_OPENS[activity];
}

/** 기획서 동료 검토: 다음 번호 모둠을 검토한다 (마지막 모둠은 1모둠). 모둠이 2개 미만이면 없음 */
export function reviewTarget(myGroup: number, groupCount: number): number | null {
  if (groupCount < 2 || myGroup < 1 || myGroup > groupCount) return null;
  return (myGroup % groupCount) + 1;
}

/** 기획서 제출 전에 아직 채우지 않은 것 (사람 말로) */
export function planMissing(plan: GroupPlan): string[] {
  const miss: string[] = [];
  for (const f of PLAN_FIELDS) {
    if (countChars(plan[f.id]) < f.min) miss.push(f.min > 5 ? `${f.label} (${f.min}자 이상)` : f.label);
  }
  if (!plan.format) miss.push('콘텐츠 형식');
  if (plan.format === 'other' && !plan.formatOther.trim()) miss.push('기타 형식 이름');
  if (plan.factIds.length === 0) miss.push('근거 사실 카드 (1장 이상)');
  if (plan.principleIds.length === 0) miss.push('중심 원칙 (1개 이상)');
  return miss;
}

/** 점검표: 모두 확인했는지 */
export function checksDone(checks: Record<string, boolean>): { done: number; total: number; all: boolean } {
  const done = ALL_CHECK_IDS.filter((id) => checks[id] === true).length;
  return { done, total: ALL_CHECK_IDS.length, all: done === ALL_CHECK_IDS.length };
}

/** AI 를 쓰지 않았다고 적었는지 */
export function noAiUsed(tools: string): boolean {
  const t = tools.replace(/\s/g, '');
  return t === '' || t === '없음' || t === '사용하지않음' || t === '안씀';
}

/** AI 활용 표기 문구 추천 (학생이 고쳐 쓸 수 있다) */
export function suggestAiLabel(log: Pick<AiLog, 'tools'>): string {
  if (noAiUsed(log.tools)) return '이 작품은 생성형 AI를 사용하지 않고 모둠이 직접 만들었습니다.';
  const tools = log.tools.trim();
  // ‘…AI’는 ‘에이아이’로 읽으므로 ‘를’
  const josa = /AI$/i.test(tools) ? '를' : eulReul(tools);
  return `이 작품은 ${tools}${josa} 활용해 만들었고, 모둠이 직접 검토하고 고쳤습니다.`;
}

/** 제출 링크: https 로 시작하고 빈칸이 없어야 한다 (보안 규칙과 같은 검사) */
export function isValidWorkUrl(url: string): boolean {
  return /^https:\/\/[^ ]+$/.test(url) && url.length >= 12 && url.length <= 300;
}

/** 모둠 명단을 번호 순으로 */
export function membersOf(members: Record<string, GroupMember>): { number: number; nickname: string; roles: RoleId[] }[] {
  return Object.entries(members)
    .map(([k, v]) => ({ number: Number(k), nickname: v.nickname, roles: v.roles ?? [] }))
    .sort((a, b) => a.number - b.number);
}

/** 아직 아무도 맡지 않은 역할 */
export function missingRoles(members: Record<string, GroupMember>): RoleId[] {
  const taken = new Set(Object.values(members).flatMap((m) => m.roles ?? []));
  return ROLES.map((r) => r.id).filter((id) => !taken.has(id));
}

/** 모둠 이름 (없으면 ‘n모둠’) */
export function groupLabel(g: Pick<GroupDoc, 'no' | 'name'>): string {
  return g.name.trim() ? `${g.no}모둠 · ${g.name.trim()}` : `${g.no}모둠`;
}

/** 발표 평가 평균 (항목별, 소수 첫째 자리) */
export function averageScores(reviews: Pick<FinalReviewDoc, 'scores'>[]): Record<(typeof RUBRIC)[number]['id'], number> & { count: number } {
  const out = { ethics: 0, history: 0, creative: 0, delivery: 0, count: reviews.length };
  if (reviews.length === 0) return out;
  for (const r of RUBRIC) {
    const sum = reviews.reduce((s, x) => s + (x.scores?.[r.id] ?? 0), 0);
    out[r.id] = Math.round((sum / reviews.length) * 10) / 10;
  }
  return out;
}
