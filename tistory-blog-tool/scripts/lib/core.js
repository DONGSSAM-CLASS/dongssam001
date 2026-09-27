// 공통: 설정·글(front matter + 마크다운) 로드/저장·경로·글 목록.
// 글 파일 = posts/YYYY-MM-DD/NN-slug.md  (front matter 가 단일 진실 원천 — 상태·URL·검수 점수도 여기에 기록)

const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

// TBT_ROOT: 자체 테스트(npm test)가 임시 작업 폴더를 쓰게 하는 용도
const ROOT = process.env.TBT_ROOT ? path.resolve(process.env.TBT_ROOT) : path.resolve(__dirname, '..', '..');
const POSTS_DIR = path.join(ROOT, 'posts');
const OUT_DIR = path.join(ROOT, 'out');
const DATA_DIR = path.join(ROOT, 'data');

function loadConfig() {
  const file = path.join(ROOT, 'config', 'blog.json');
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

function isUnset(v) {
  return v == null || v === '' || String(v).includes('❓');
}

const FM_RE = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/;

function parsePost(text, file = '') {
  const m = String(text).replace(/^﻿/, '').match(FM_RE);
  if (!m) throw new Error(`front matter(--- ... ---)가 없습니다: ${file}`);
  let meta;
  try {
    meta = yaml.load(m[1], { schema: yaml.CORE_SCHEMA }) || {}; // CORE: 날짜를 Date 로 바꾸지 않고 문자열 그대로
  } catch (e) {
    throw new Error(`front matter YAML 파싱 실패 (${file}): ${e.message}`);
  }
  return { meta, body: m[2] };
}

function resolvePath(p) {
  if (!p) return p;
  return path.isAbsolute(p) ? p : path.join(ROOT, p);
}

function loadPost(file) {
  const abs = resolvePath(file);
  if (!fs.existsSync(abs)) throw new Error(`글 파일이 없습니다: ${file}`);
  const { meta, body } = parsePost(fs.readFileSync(abs, 'utf8'), file);
  return { file: abs, rel: path.relative(ROOT, abs).split(path.sep).join('/'), dir: path.dirname(abs), meta, body };
}

// front matter 일부만 갱신 (본문은 그대로) — 업로드 결과·검수 점수 기록용
function updateMeta(file, patch) {
  const post = loadPost(file);
  const meta = { ...post.meta, ...patch };
  const fm = yaml.dump(meta, { schema: yaml.CORE_SCHEMA, lineWidth: 1000, noRefs: true, quotingType: '"' });
  fs.writeFileSync(post.file, `---\n${fm}---\n${post.body.startsWith('\n') ? '' : '\n'}${post.body}`);
  return meta;
}

// posts/ 아래 모든 글 (examples/ 는 제외)
function listPosts({ date } = {}) {
  if (!fs.existsSync(POSTS_DIR)) return [];
  const dirs = fs
    .readdirSync(POSTS_DIR, { withFileTypes: true })
    .filter((d) => d.isDirectory() && /^\d{4}-\d{2}-\d{2}$/.test(d.name))
    .map((d) => d.name)
    .filter((d) => !date || d === date)
    .sort();
  const files = [];
  for (const d of dirs) {
    fs.readdirSync(path.join(POSTS_DIR, d))
      .filter((f) => f.endsWith('.md'))
      .sort()
      .forEach((f) => files.push(path.join(POSTS_DIR, d, f)));
  }
  return files;
}

function loadAllPosts(opts) {
  const out = [];
  for (const f of listPosts(opts)) {
    try {
      out.push(loadPost(f));
    } catch (e) {
      out.push({ file: f, rel: path.relative(ROOT, f), error: e.message, meta: {}, body: '' });
    }
  }
  return out;
}

// 블로그에 이미 있는 글 (이 툴 이전 글 포함) — scripts/sync_existing.js 가 RSS·사이트맵으로 채운다
function loadExisting() {
  const file = path.join(DATA_DIR, 'existing-posts.json');
  if (!fs.existsSync(file)) return [];
  try {
    const j = JSON.parse(fs.readFileSync(file, 'utf8'));
    return Array.isArray(j.posts) ? j.posts : [];
  } catch {
    return [];
  }
}

function today() {
  const d = new Date();
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

// 인자 파싱: 위치 인자 + --key value / --flag
function parseArgs(argv) {
  const pos = [];
  const opt = {};
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a.startsWith('--')) {
      const key = a.slice(2);
      const next = argv[i + 1];
      if (next !== undefined && !next.startsWith('--')) {
        opt[key] = next;
        i++;
      } else opt[key] = true;
    } else pos.push(a);
  }
  return { pos, opt };
}

// 인자가 날짜면 그날 글 전부, 아니면 파일 목록
function resolveTargets(pos) {
  if (!pos.length) return listPosts({ date: today() });
  const files = [];
  for (const p of pos) {
    if (/^\d{4}-\d{2}-\d{2}$/.test(p)) files.push(...listPosts({ date: p }));
    else files.push(resolvePath(p));
  }
  return files;
}

function outPathsFor(post) {
  const date = path.basename(post.dir);
  const base = path.basename(post.file, '.md');
  const dir = path.join(OUT_DIR, /^\d{4}-\d{2}-\d{2}$/.test(date) ? date : 'misc');
  return {
    dir,
    html: path.join(dir, `${base}.tistory.html`),
    preview: path.join(dir, `${base}.preview.html`),
    thumb: path.join(dir, `${base}.thumb.png`),
    uploadLog: path.join(dir, `${base}.upload.log.txt`),
  };
}

module.exports = {
  ROOT,
  POSTS_DIR,
  OUT_DIR,
  DATA_DIR,
  loadConfig,
  isUnset,
  parsePost,
  loadPost,
  updateMeta,
  listPosts,
  loadAllPosts,
  loadExisting,
  resolvePath,
  today,
  parseArgs,
  resolveTargets,
  outPathsFor,
};
