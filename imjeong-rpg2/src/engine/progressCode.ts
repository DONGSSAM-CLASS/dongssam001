/**
 * 진행 코드 — 서버 없이 기록을 옮기는 짧은 글자.
 *
 * 학교 컴퓨터실에서는 다음 시간에 다른 자리에 앉기도 하고, 공용 기기라 기록이 지워지기도 한다.
 * 학생이 수업 끝에 코드를 적어 두면 다음 시간 어느 기기에서든 「진행 코드로 이어하기」로 돌아온다.
 * 교사는 교사 화면에서 학생들의 코드를 붙여 넣어 누가 어디까지 했는지 볼 수 있다.
 *
 * 담는 것: 난이도 · 프롤로그 · 맞힌 퀘스트 · 다시 풀어 맞힌 퀘스트 · 주운 기록 조각 · 쓴 생각 노트
 * 담지 않는 것: 편지와 생각 노트의 글(길어서), 기부(마지막에 하는 활동) — 개인정보도 담지 않는다.
 */

const ALPHABET = '0123456789ABCDEFGHJKMNPQRSTVWXYZ'; // Crockford Base32 (I·L·O·U 없음 — 헷갈리지 않게)
const VERSION = 1n;

export interface ProgressSnapshot {
  level: 'middle' | 'high';
  prologueDone: boolean;
  completed: string[];
  missed: string[];
  relics: string[];
  notes: number[];
}

function bits(ids: string[], universe: string[]): bigint {
  let v = 0n;
  universe.forEach((id, i) => {
    if (ids.includes(id)) v |= 1n << BigInt(i);
  });
  return v;
}

function unbits(v: bigint, universe: string[]): string[] {
  return universe.filter((_, i) => (v >> BigInt(i)) & 1n);
}

function checksum(body: string): string {
  let a = 7;
  let b = 3;
  for (const ch of body) {
    a = (a + ALPHABET.indexOf(ch) + 1) % 32;
    b = (b * 5 + a) % 32;
  }
  return ALPHABET[a] + ALPHABET[b];
}

export function encodeProgress(s: ProgressSnapshot, questIds: string[], relicIds: string[]): string {
  const q = questIds.length;
  const r = relicIds.length;
  let v = VERSION;
  let shift = 4n;
  const push = (value: bigint, width: number) => {
    v |= value << shift;
    shift += BigInt(width);
  };
  push(s.level === 'high' ? 1n : 0n, 1);
  push(s.prologueDone ? 1n : 0n, 1);
  push(bits(s.completed, questIds), q);
  push(bits(s.missed, questIds), q);
  push(bits(s.relics, relicIds), r);
  push(bits(s.notes.map(String), ['1', '2', '3', '4', '5', '6']), 6);

  let body = '';
  const length = Math.ceil(Number(shift) / 5);
  for (let i = 0; i < length; i += 1) {
    body += ALPHABET[Number((v >> BigInt(i * 5)) & 31n)];
  }
  const full = body + checksum(body);
  return full.match(/.{1,4}/g)!.join('-');
}

export function decodeProgress(code: string, questIds: string[], relicIds: string[]): ProgressSnapshot | null {
  const clean = code
    .toUpperCase()
    .replace(/[^0-9A-Z]/g, '')
    .replace(/O/g, '0')
    .replace(/[IL]/g, '1');
  if (clean.length < 4) return null;
  const body = clean.slice(0, -2);
  if (checksum(body) !== clean.slice(-2)) return null;
  let v = 0n;
  for (let i = 0; i < body.length; i += 1) {
    const d = ALPHABET.indexOf(body[i]);
    if (d < 0) return null;
    v |= BigInt(d) << BigInt(i * 5);
  }
  if ((v & 15n) !== VERSION) return null;
  let shift = 4n;
  const take = (width: number) => {
    const value = (v >> shift) & ((1n << BigInt(width)) - 1n);
    shift += BigInt(width);
    return value;
  };
  const level = take(1) === 1n ? 'high' : 'middle';
  const prologueDone = take(1) === 1n;
  const completed = unbits(take(questIds.length), questIds);
  const missed = unbits(take(questIds.length), questIds);
  const relics = unbits(take(relicIds.length), relicIds);
  const notes = unbits(take(6), ['1', '2', '3', '4', '5', '6']).map(Number);
  return { level, prologueDone, completed, missed, relics, notes };
}
