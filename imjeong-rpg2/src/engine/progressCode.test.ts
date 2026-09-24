import { decodeProgress, encodeProgress } from './progressCode';
import { quests } from '../data/quests';
import { relics } from '../data/relics';

const Q = quests.map((q) => q.id);
const R = relics.map((r) => r.id);

describe('진행 코드', () => {
  it('적은 그대로 되돌아온다', () => {
    const snap = {
      level: 'high' as const,
      prologueDone: true,
      completed: Q.slice(0, 11),
      missed: [Q[2], Q[7]],
      relics: [R[0], R[5], R[16]],
      notes: [1, 2],
    };
    const code = encodeProgress(snap, Q, R);
    expect(code).toMatch(/^[0-9A-Z]{4}(-[0-9A-Z]{1,4})+$/);
    expect(code.replace(/-/g, '').length).toBeLessThan(24);
    expect(decodeProgress(code, Q, R)).toEqual(snap);
  });

  it('소문자·띄어쓰기·O/I 로 적어도 읽는다', () => {
    const snap = { level: 'middle' as const, prologueDone: true, completed: Q, missed: [], relics: R, notes: [1, 2, 3, 4, 5, 6] };
    const code = encodeProgress(snap, Q, R);
    const messy = code.toLowerCase().replace(/-/g, ' ').replace(/0/g, 'o').replace(/1/g, 'i');
    expect(decodeProgress(messy, Q, R)).toEqual(snap);
  });

  it('한 글자라도 틀리면 거절한다', () => {
    const code = encodeProgress({ level: 'middle', prologueDone: false, completed: [Q[0]], missed: [], relics: [], notes: [] }, Q, R);
    const i = code.search(/[0-9A-Z]/);
    const wrong = code.slice(0, i) + (code[i] === '7' ? '8' : '7') + code.slice(i + 1);
    expect(decodeProgress(wrong, Q, R)).toBeNull();
    expect(decodeProgress('ABCD', Q, R)).toBeNull();
  });
});
