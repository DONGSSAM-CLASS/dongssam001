#!/usr/bin/env node
// 주제 대기열 (data/topic-queue.json) 관리 — /plan 이 채우고 /daily 가 하루치를 뽑는다.
//
//   node scripts/queue.js list [--status queued]
//   node scripts/queue.js pick [N] [--date YYYY-MM-DD] [--dry]   오늘 쓸 N개 선택(기본 dailyQuota) → status: writing
//   node scripts/queue.js add '<JSON 객체 또는 배열>'
//   node scripts/queue.js set <id> <queued|writing|drafted|done|skipped> [--post posts/...md] [--note 사유]
//   node scripts/queue.js stats
//
// 선택 규칙: 발행 적기(window) 안 → 우선순위 높은 순 → 적기 마감 임박 순.
//            하루 안에서 같은 클러스터 2개·같은 형식 2개 초과 금지, 이미 쓴 메인 키워드 제외.

const fs = require('fs');
const path = require('path');
const { DATA_DIR, loadConfig, loadAllPosts, parseArgs, today, listPosts } = require('./lib/core');
const { normalize } = require('./lib/similarity');

const FILE = path.join(DATA_DIR, 'topic-queue.json');
const STATUSES = ['queued', 'writing', 'drafted', 'done', 'skipped'];

function load() {
  if (!fs.existsSync(FILE)) return { topics: [] };
  return JSON.parse(fs.readFileSync(FILE, 'utf8'));
}
function save(q) {
  fs.writeFileSync(FILE, JSON.stringify(q, null, 2) + '\n');
}
function nextId(q) {
  const n = q.topics.reduce((mx, t) => Math.max(mx, Number(String(t.id).replace(/\D/g, '')) || 0), 0) + 1;
  return `t${String(n).padStart(3, '0')}`;
}
function inWindow(t, date) {
  if (!t.window) return true;
  const [from, to] = String(t.window).split('~').map((s) => s && s.trim());
  return (!from || date >= from) && (!to || date <= to);
}

function pick(q, n, date) {
  const used = new Set(loadAllPosts().map((p) => normalize(p.meta.mainKeyword || '')).filter(Boolean));
  const cands = q.topics
    .filter((t) => t.status === 'queued' && inWindow(t, date) && !used.has(normalize(t.mainKeyword)))
    .sort((a, b) => (b.priority || 3) - (a.priority || 3) || String((a.window || '~9999').split('~')[1] || '9999').localeCompare(String((b.window || '~9999').split('~')[1] || '9999')));
  const chosen = [];
  const cnt = (key, v) => chosen.filter((t) => t[key] === v).length;
  for (const t of cands) {
    if (chosen.length >= n) break;
    if (t.cluster && cnt('cluster', t.cluster) >= 2) continue;
    if (t.format && cnt('format', t.format) >= 2) continue;
    if (chosen.some((c) => normalize(c.mainKeyword) === normalize(t.mainKeyword))) continue;
    chosen.push(t);
  }
  // 다양성 조건 때문에 모자라면 조건 완화 없이 모자란 채로 둔다 (억지로 채우지 않음)
  return chosen;
}

function main() {
  const { pos, opt } = parseArgs(process.argv.slice(2));
  const cmd = pos[0] || 'list';
  const q = load();

  if (cmd === 'list') {
    const rows = q.topics.filter((t) => !opt.status || t.status === opt.status);
    rows.forEach((t) => console.log(`${t.id}\t${t.status}\tP${t.priority || 3}\t${t.cluster || '-'}\t${t.format || '-'}\t${t.mainKeyword}\t${t.window || ''}`));
    console.log(`(${rows.length}개)`);
    return;
  }
  if (cmd === 'stats') {
    const by = {};
    q.topics.forEach((t) => (by[t.status] = (by[t.status] || 0) + 1));
    console.log(JSON.stringify(by));
    const queued = q.topics.filter((t) => t.status === 'queued').length;
    const quota = loadConfig().dailyQuota || 5;
    console.log(`대기 ${queued}개 ≈ ${(queued / quota).toFixed(1)}일치${queued < quota * 3 ? ' — /plan 으로 보충 권장' : ''}`);
    return;
  }
  if (cmd === 'pick') {
    const date = opt.date || today();
    const quota = loadConfig().dailyQuota || 5;
    const already = listPosts({ date }).length;
    const n = Math.min(Number(pos[1] || quota), Math.max(0, quota - already));
    if (n <= 0) {
      console.log(JSON.stringify({ date, picked: [], note: `${date} 에 이미 ${already}개 — 하루 한도 ${quota}개` }, null, 2));
      return;
    }
    const chosen = pick(q, n, date);
    let seq = already;
    const out = chosen.map((t) => ({ ...t, fileHint: `posts/${date}/${String(++seq).padStart(2, '0')}-<slug>.md` }));
    if (!opt.dry) {
      chosen.forEach((t) => {
        t.status = 'writing';
        t.date = date;
      });
      save(q);
    }
    console.log(JSON.stringify({ date, picked: out, shortBy: n - chosen.length }, null, 2));
    return;
  }
  if (cmd === 'add') {
    const raw = pos.slice(1).join(' ');
    const items = [].concat(JSON.parse(raw));
    const have = new Set(q.topics.map((t) => normalize(t.mainKeyword)));
    items.forEach((it) => {
      if (!it.mainKeyword) throw new Error('mainKeyword 필수');
      if (have.has(normalize(it.mainKeyword))) return console.log(`중복 건너뜀: ${it.mainKeyword}`);
      const t = { id: nextId(q), status: 'queued', priority: 3, ...it };
      q.topics.push(t);
      have.add(normalize(t.mainKeyword));
      console.log(`추가: ${t.id} ${t.mainKeyword}`);
    });
    save(q);
    return;
  }
  if (cmd === 'set') {
    const [, id, status] = pos;
    if (!STATUSES.includes(status)) throw new Error(`상태는 ${STATUSES.join('|')}`);
    const t = q.topics.find((x) => x.id === id);
    if (!t) throw new Error(`없는 id: ${id}`);
    t.status = status;
    if (opt.post) t.post = opt.post;
    if (opt.note) t.note = opt.note;
    save(q);
    console.log(`${id} → ${status}`);
    return;
  }
  throw new Error(`알 수 없는 명령: ${cmd}`);
}

try {
  main();
} catch (e) {
  console.error(`❌ ${e.message}`);
  process.exit(1);
}
