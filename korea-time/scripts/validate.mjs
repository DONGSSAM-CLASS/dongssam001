// 데이터 무결성 검사 — 정답 번호 범위, 사료 참조, 중복 id 등을 확인한다.
import { CHAPTERS, FINAL_GATE, KEY_SHARDS } from '../js/data/chapters.js';
import { SOURCES } from '../js/data/sources.js';
import { STANDARDS } from '../js/data/standards.js';
import { PORTRAIT_KEYS, SCENE_KEYS } from '../js/art.js';

const errors = [];
const ids = new Set();
const err = (m) => errors.push(m);

function checkPuzzle(ch, p) {
  if (!p.id) return err(`${ch.id}: 퍼즐 id 없음`);
  if (ids.has(p.id)) err(`퍼즐 id 중복: ${p.id}`);
  ids.add(p.id);
  if (!p.prompt) err(`${p.id}: prompt 없음`);
  if (!p.explain) err(`${p.id}: 해설(explain) 없음`);

  const n = (p.options || []).length;
  if (p.kind === 'choice') {
    if (n < 2) err(`${p.id}: 선택지가 부족`);
    if (!(Number.isInteger(p.answer) && p.answer >= 0 && p.answer < n)) err(`${p.id}: answer 범위 오류`);
  } else if (p.kind === 'multi') {
    if (!Array.isArray(p.answer) || !p.answer.length) return err(`${p.id}: answer 배열 없음`);
    p.answer.forEach((a) => { if (!(a >= 0 && a < n)) err(`${p.id}: answer ${a} 범위 오류`); });
    if (new Set(p.answer).size !== p.answer.length) err(`${p.id}: answer 중복`);
  } else if (p.kind === 'order') {
    if (!Array.isArray(p.answer) || p.answer.length !== n) return err(`${p.id}: order answer 길이 불일치`);
    if ([...p.answer].sort((a, b) => a - b).join() !== [...Array(n).keys()].join())
      err(`${p.id}: order answer 는 0..${n - 1} 의 순열이어야 함`);
  } else if (p.kind === 'input') {
    if (!Array.isArray(p.accept) || !p.accept.length) err(`${p.id}: accept 없음`);
  } else {
    err(`${p.id}: 알 수 없는 kind "${p.kind}"`);
  }
}

if (CHAPTERS.length !== KEY_SHARDS.length) err('장 수와 열쇠 조각 수가 다름');

CHAPTERS.forEach((ch, i) => {
  if (ch.no !== i + 1) err(`${ch.id}: no 가 순서와 다름`);
  if (!STANDARDS[ch.standard]) err(`${ch.id}: 알 수 없는 성취기준 ${ch.standard}`);
  if (!SCENE_KEYS.includes(ch.art)) err(`${ch.id}: 없는 장면 아트 "${ch.art}"`);
  if (ch.shard.glyph !== KEY_SHARDS[i]) err(`${ch.id}: 조각 글자 불일치`);
  if (!ch.intro || !ch.intro.ms || !ch.intro.hs) err(`${ch.id}: intro 두 난이도 모두 필요`);

  ch.beats.forEach((b, bi) => {
    const at = `${ch.id}.beat${bi}`;
    if (!b.who || !b.lines || !b.lines.length) err(`${at}: who/lines 누락`);
    if (b.portrait && !PORTRAIT_KEYS.includes(b.portrait)) err(`${at}: 없는 초상 "${b.portrait}"`);
    [b.source, ...(b.extraSources || [])].filter(Boolean).forEach((s) => {
      if (!SOURCES[s]) err(`${at}: 없는 사료 "${s}"`);
    });
  });

  ch.puzzles.forEach((p) => checkPuzzle(ch, p));
  if (ch.hsExtra) checkPuzzle(ch, ch.hsExtra);
  ch.puzzles.forEach((p) => (p.extraSources || []).forEach((s) => {
    if (!SOURCES[s]) err(`${p.id}: 없는 사료 "${s}"`);
  }));
});

checkPuzzle({ id: 'final' }, FINAL_GATE.puzzle);

Object.entries(SOURCES).forEach(([k, s]) => {
  if (!s.apa) err(`사료 ${k}: APA 출처 없음`);
  if (!s.easy) err(`사료 ${k}: 쉬운 해석 없음`);
  if (!s.original && !s.reading) err(`사료 ${k}: 원문/국역 모두 없음`);
  if (/교과서|textbook/i.test(s.apa)) err(`사료 ${k}: 출처에 교과서가 적혀 있음`);
});

const used = new Set();
CHAPTERS.forEach((ch) => ch.beats.forEach((b) => {
  [b.source, ...(b.extraSources || [])].filter(Boolean).forEach((s) => used.add(s));
}));
CHAPTERS.forEach((ch) => ch.puzzles.forEach((p) => (p.extraSources || []).forEach((s) => used.add(s))));
const unused = Object.keys(SOURCES).filter((k) => !used.has(k));

const msTotal = CHAPTERS.reduce((n, c) => n + c.puzzles.length, 0) + 1;
const hsTotal = msTotal + CHAPTERS.filter((c) => c.hsExtra).length;

console.log(`장 ${CHAPTERS.length} · 대화 ${CHAPTERS.reduce((n, c) => n + c.beats.length, 0)} · ` +
  `사료 ${Object.keys(SOURCES).length} · 문제 중학 ${msTotal} / 고교 ${hsTotal}`);
if (unused.length) console.log(`· 아직 대화에 안 붙은 사료: ${unused.join(', ')}`);

if (errors.length) {
  console.error('\n검사 실패:');
  errors.forEach((e) => console.error(' ✗ ' + e));
  process.exit(1);
}
console.log('✓ 데이터 검사 통과');
