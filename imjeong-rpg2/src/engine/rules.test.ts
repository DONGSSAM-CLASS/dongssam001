import { quests } from '../data/quests';
import {
  INITIAL_RESOURCES,
  LETTER_MIN,
  POINTS,
  applyDelta,
  canDonate,
  canFinish,
  computePointsEarned,
  gradeQuest,
  letterChecks,
  letterProblem,
  lerpAngle,
  resolveQuest,
  stableShuffle,
  totalDonated,
  upsertLetter,
  yawToward,
} from './rules';

const q = (id: string) => quests.find((x) => x.id === id)!;

describe('채점', () => {
  it('하나 고르기', () => {
    expect(gradeQuest(q('q-name'), ['daehan-minguk'])).toBe(true);
    expect(gradeQuest(q('q-name'), ['joseon'])).toBe(false);
  });
  it('모두 고르기 — 순서와 상관없이, 빠짐없이', () => {
    const quest = q('q-rights');
    expect(gradeQuest(quest, ['vote', 'abolish', 'equality', 'freedoms'])).toBe(true);
    expect(gradeQuest(quest, ['vote', 'equality', 'freedoms'])).toBe(false);
    expect(gradeQuest(quest, ['vote', 'abolish', 'equality', 'freedoms', 'rich-vote'])).toBe(false);
  });
  it('순서 배열 — 순서가 틀리면 오답', () => {
    const quest = q('q-constitution-order');
    expect(gradeQuest(quest, quest.answer)).toBe(true);
    expect(gradeQuest(quest, [...quest.answer].reverse())).toBe(false);
  });
});

describe('포인트', () => {
  it('첫 시도 정답 100, 다시 풀어 정답 50, 오답 0', () => {
    const quest = q('q-name');
    expect(resolveQuest(quest, ['daehan-minguk'], INITIAL_RESOURCES, false).points).toBe(POINTS.questFirstTry);
    expect(resolveQuest(quest, ['daehan-minguk'], INITIAL_RESOURCES, true).points).toBe(POINTS.questRetry);
    expect(resolveQuest(quest, ['joseon'], INITIAL_RESOURCES, false).points).toBe(0);
  });
  it('모든 퀘스트를 한 번에 맞히면 넉넉한 포인트가 모인다', () => {
    const total = quests.length * POINTS.questFirstTry + 17 * POINTS.relic + 6 * POINTS.actComplete;
    expect(total).toBeGreaterThan(3000);
  });
});

describe('지표', () => {
  it('0~100 범위를 넘지 않는다', () => {
    const r = applyDelta(INITIAL_RESOURCES, { trust: 500, law: -500, funds: -99999 });
    expect(r.trust).toBe(100);
    expect(r.law).toBe(0);
    expect(r.funds).toBe(0);
  });
});

describe('기부와 편지', () => {
  it('단위에 맞고 가진 만큼만 기부할 수 있다', () => {
    expect(canDonate(300, 100)).toBe(true);
    expect(canDonate(300, 350)).toBe(false);
    expect(canDonate(300, 70)).toBe(false);
    expect(canDonate(300, 0)).toBe(false);
  });
  it('기부 합계', () => {
    expect(totalDonated({ a: 100, b: 250 })).toBe(350);
  });
  it('편지는 공백을 빼고 최소 글자 수를 넘어야 한다', () => {
    expect(letterProblem('고맙습니다')).not.toBeNull();
    expect(letterProblem('가'.repeat(LETTER_MIN))).toBeNull();
    expect(letterProblem(' '.repeat(200))).not.toBeNull();
  });
  it('같은 분께 다시 쓰면 바뀐다', () => {
    const one = upsertLetter([], { figureId: 'kimgu', body: 'a', writtenAt: 1 });
    const two = upsertLetter(one, { figureId: 'kimgu', body: 'b', writtenAt: 2 });
    expect(two).toHaveLength(1);
    expect(two[0].body).toBe('b');
  });
  it('모든 퀘스트 + 기부 + 편지가 있어야 감사 증서가 열린다', () => {
    const all = Object.fromEntries(quests.map((x) => [x.id, true]));
    const letter = [{ figureId: 'kimgu', body: 'x', writtenAt: 1 }];
    expect(canFinish(quests, all, { kimgu: 100 }, letter)).toBe(true);
    expect(canFinish(quests, all, {}, letter)).toBe(false);
    expect(canFinish(quests, all, { kimgu: 100 }, [])).toBe(false);
    expect(canFinish(quests, { ...all, 'q-name': false }, { kimgu: 100 }, letter)).toBe(false);
  });
});

describe('보조 함수', () => {
  it('선택지 섞기는 항상 같은 결과를 낸다', () => {
    const a = stableShuffle(q('q-rights').choices, 'x').map((c) => c.id);
    const b = stableShuffle(q('q-rights').choices, 'x').map((c) => c.id);
    expect(a).toEqual(b);
  });
  it('시선 방향 — yaw 0 은 -z 를 본다', () => {
    expect(yawToward(0, -1)).toBeCloseTo(0);
    expect(yawToward(-1, 0)).toBeCloseTo(Math.PI / 2);
  });
  it('각도 보간은 짧은 쪽으로 돈다', () => {
    expect(lerpAngle(3, -3, 1)).toBeCloseTo(3 + (2 * Math.PI - 6));
  });
});

describe('편지 점검표', () => {
  it('감사·사실·다짐을 알아본다', () => {
    const c = letterChecks('선생님 감사합니다. 충칭에서 주석으로 일하셨지요. 앞으로 잊지 않겠습니다.', ['주석', '충칭']);
    expect(c).toEqual({ thanks: true, fact: true, pledge: true });
    expect(letterChecks('안녕하세요', ['주석']).fact).toBe(false);
  });
});

describe('보훈 다짐과 감사 증서', () => {
  it('다짐이 비어 있으면 감사 증서가 열리지 않는다', () => {
    const all = Object.fromEntries(quests.map((x) => [x.id, true]));
    const letter = [{ figureId: 'kimgu', body: 'x', writtenAt: 1 }];
    expect(canFinish(quests, all, { kimgu: 100 }, letter, '')).toBe(false);
    expect(canFinish(quests, all, { kimgu: 100 }, letter, '나는 앞으로')).toBe(true);
  });
});

describe('포인트 다시 계산', () => {
  it('한 번에 다 맞히면 퀘스트·막 보너스·조각·노트가 모두 더해진다', () => {
    const all = Object.fromEntries(quests.map((x) => [x.id, true]));
    expect(computePointsEarned(quests, all, [], 17, 6, 6)).toBe(
      quests.length * POINTS.questFirstTry + 6 * POINTS.actComplete + 17 * POINTS.relic + 6 * POINTS.note,
    );
    expect(computePointsEarned(quests, { 'q-name': true }, ['q-name'], 0, 0, 6)).toBe(POINTS.questRetry);
  });
});
