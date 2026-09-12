// ---------------------------------------------------------------------------
// store.js — 게임 진행 상태. 브라우저와 Firestore 양쪽에 저장한다.
//   웹사이트를 껐다 켜도 이어서 할 수 있게 하는 것이 목적.
// ---------------------------------------------------------------------------
import { CHAPTERS } from './data/chapters.js';
import * as FB from './firebase.js';

const LOCAL_KEY = 'koreaTime.save.v1';

function blank() {
  return {
    tier: 'ms',            // 'ms' 중학생용 | 'hs' 고등학생용
    chapterIndex: 0,       // 지금 진행 중인 장 (0~5), 6이면 마지막 관문
    beatIndex: 0,          // 그 장의 몇 번째 대화까지 보았는가
    phase: 'beats',        // 'beats' | 'puzzles' | 'shard' | 'final' | 'done'
    puzzleIndex: 0,
    solved: {},            // { 'p1-1': true }
    wrong: {},             // { 'p1-1': 2 }  틀린 횟수
    hintsUsed: {},         // { 'p1-1': true }
    shards: [],            // 모은 열쇠 조각 glyph
    clues: [],             // 수첩에 모인 단서 { chapter, title, text }
    records: [],           // 장을 깰 때마다 얻는 기록
    startedAt: 0,
    elapsedMs: 0,
    finishedAt: 0,
  };
}

export const save = blank();
export let student = null;      // 로그인한 학생 프로필 (없으면 체험 모드)
let tickStart = 0;
let dirty = false;
let flushTimer = null;

export function setStudent(profile) {
  student = profile;
  if (profile && profile.tier) save.tier = profile.tier;
}

export function reset(tier) {
  Object.assign(save, blank());
  if (tier) save.tier = tier;
  save.startedAt = Date.now();
  markDirty(true);
}

export function isHigh() {
  return save.tier === 'hs';
}

// ── 시간 재기 ──────────────────────────────────────────────────────────
export function startClock() {
  if (!save.startedAt) save.startedAt = Date.now();
  tickStart = Date.now();
}
export function pauseClock() {
  if (tickStart) {
    save.elapsedMs += Date.now() - tickStart;
    tickStart = 0;
  }
}
export function elapsed() {
  return save.elapsedMs + (tickStart ? Date.now() - tickStart : 0);
}
export function formatTime(ms) {
  const s = Math.max(0, Math.floor(ms / 1000));
  return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
}

// ── 저장 / 불러오기 ────────────────────────────────────────────────────
export function markDirty(now) {
  dirty = true;
  writeLocal();
  if (now) return flush();
  if (!flushTimer) flushTimer = setTimeout(flush, 2500);
}

function writeLocal() {
  try {
    localStorage.setItem(LOCAL_KEY, JSON.stringify({ ...save, elapsedMs: elapsed() }));
  } catch (_) { /* 사생활 보호 모드 등에서 저장이 막힐 수 있다 */ }
}

export async function flush() {
  clearTimeout(flushTimer);
  flushTimer = null;
  if (!dirty) return;
  dirty = false;
  writeLocal();
  if (student && FB.isCloud()) {
    try {
      await FB.saveProgress(student, {
        tier: save.tier,
        chapterIndex: save.chapterIndex,
        beatIndex: save.beatIndex,
        phase: save.phase,
        puzzleIndex: save.puzzleIndex,
        solved: save.solved,
        wrong: save.wrong,
        hintsUsed: save.hintsUsed,
        shards: save.shards,
        records: save.records,
        clueCount: save.clues.length,
        startedAt: save.startedAt,
        elapsedMs: elapsed(),
        finishedAt: save.finishedAt,
        solvedCount: solvedCount(),
        totalPuzzles: totalPuzzles(save.tier),
        percent: percent(),
      });
    } catch (err) {
      console.warn('[KOREA TIME] 기록 저장 실패(다음에 다시 시도합니다)', err);
      dirty = true;
    }
  }
}

function adopt(data) {
  if (!data) return false;
  const keys = Object.keys(blank());
  keys.forEach((k) => {
    if (data[k] !== undefined && data[k] !== null) save[k] = data[k];
  });
  save.clues = Array.isArray(save.clues) ? save.clues : [];
  save.shards = Array.isArray(save.shards) ? save.shards : [];
  save.records = Array.isArray(save.records) ? save.records : [];
  return true;
}

/** 저장된 진행이 있으면 불러온다. 클라우드 기록을 우선한다. */
export async function restore() {
  let local = null;
  try {
    local = JSON.parse(localStorage.getItem(LOCAL_KEY) || 'null');
  } catch (_) { local = null; }

  let cloud = null;
  if (student && FB.isCloud()) {
    try { cloud = await FB.loadProgress(student); } catch (_) { cloud = null; }
  }
  // 더 많이 진행한 쪽을 택한다
  const score = (s) => (s ? (s.chapterIndex || 0) * 100 + Object.keys(s.solved || {}).length : -1);
  const pick = score(cloud) >= score(local) ? cloud : local;
  if (!pick) return false;

  // 클라우드 기록에는 clues 배열이 없다(용량 절약) → 진행한 장에서 다시 채운다
  if (pick === cloud) pick.clues = rebuildClues(pick.chapterIndex || 0, pick.beatIndex || 0);
  return adopt(pick);
}

function rebuildClues(chapterIndex, beatIndex) {
  const out = [];
  CHAPTERS.forEach((ch, ci) => {
    if (ci > chapterIndex) return;
    ch.beats.forEach((b, bi) => {
      if (ci === chapterIndex && bi >= beatIndex) return;
      if (b.clue) out.push({ chapter: ch.no, chapterTitle: ch.title, ...b.clue });
    });
  });
  return out;
}

export function hasSave() {
  try {
    const s = JSON.parse(localStorage.getItem(LOCAL_KEY) || 'null');
    return !!s && (s.chapterIndex > 0 || s.beatIndex > 0 || Object.keys(s.solved || {}).length > 0);
  } catch (_) { return false; }
}

export function clearLocal() {
  try { localStorage.removeItem(LOCAL_KEY); } catch (_) {}
}

// ── 진행률 계산 ────────────────────────────────────────────────────────
export function puzzlesOf(chapter, tier) {
  const list = chapter.puzzles.slice();
  if (tier === 'hs' && chapter.hsExtra) list.push(chapter.hsExtra);
  return list;
}

export function totalPuzzles(tier) {
  return CHAPTERS.reduce((n, ch) => n + puzzlesOf(ch, tier).length, 0) + 1; // +1 = 시간의 문
}

export function solvedCount() {
  return Object.keys(save.solved).filter((k) => save.solved[k]).length;
}

export function percent() {
  return Math.min(100, Math.round((solvedCount() / totalPuzzles(save.tier)) * 100));
}

export function addClue(chapter, clue) {
  if (!clue) return;
  if (save.clues.some((c) => c.title === clue.title && c.chapter === chapter.no)) return;
  save.clues.push({ chapter: chapter.no, chapterTitle: chapter.title, ...clue });
}

/** 정답 여부 판정 */
export function checkAnswer(puzzle, response) {
  if (puzzle.kind === 'choice') return Number(response) === puzzle.answer;
  if (puzzle.kind === 'multi') {
    const a = [...puzzle.answer].sort().join(',');
    const b = [...(response || [])].map(Number).sort().join(',');
    return a === b;
  }
  if (puzzle.kind === 'order') {
    return JSON.stringify(puzzle.answer) === JSON.stringify((response || []).map(Number));
  }
  if (puzzle.kind === 'input') {
    const norm = (s) => String(s || '').replace(/[\s·,.()\-]/g, '').toLowerCase();
    return puzzle.accept.some((a) => norm(a) === norm(response));
  }
  return false;
}
