#!/usr/bin/env node
/**
 * 사료 URL 검증 스크립트.
 *
 *   npm run verify-links              # 검증만 하고 결과를 표로 보여 준다
 *   npm run verify-links -- --write   # 결과에 따라 각 사료의 urlVerified를 갱신한다
 *   npm run verify-links -- --only kr-balhae-ruling-class
 *   npm run verify-links -- --json report.json
 *
 * 하는 일
 *  1. 화이트리스트 도메인인지 확인한다. (목록 밖 도메인은 실패로 처리)
 *  2. 실제로 조회해 200 응답이 오는지 확인한다.
 *  3. 응답 본문에 그 자료를 가리키는 표시(제목 조각 등)가 있는지 확인한다.
 *
 * 주의
 *  - 이 스크립트는 네트워크가 열린 환경에서 돌려야 한다. 교내망이나 사내 프록시가
 *    외부 접속을 막고 있으면 실제로 살아 있는 링크도 실패로 나온다. 그 경우는
 *    '링크가 죽었다'가 아니라 '확인하지 못했다'로 읽어야 한다.
 *  - urlVerified는 --write를 줄 때만 바뀐다. 기본값은 읽기 전용이다.
 */
import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const HERE = dirname(fileURLToPath(import.meta.url));
const DATA = join(HERE, '..', 'src', 'data');

/** 6번 화이트리스트. 여기 없는 도메인은 승인 없이 쓰지 않는다. */
export const WHITELIST = [
  // 한국사
  'db.history.go.kr',
  'contents.history.go.kr',
  'sillok.history.go.kr',
  'sjw.history.go.kr',
  'db.itkc.or.kr',
  'encykorea.aks.ac.kr',
  'khs.go.kr',
  'museum.go.kr',
  'emuseum.go.kr',
  'archives.go.kr',
  'nahf.or.kr',
  'contents.nahf.or.kr',
  'i815.or.kr',
  'hangeul.go.kr',
  // 세계사
  'loc.gov',
  'nationalarchives.gov.uk',
  'archives.gov',
  'sourcebooks.fordham.edu',
  'avalon.law.yale.edu',
  'bl.uk',
  'europeana.eu',
  'si.edu',
  'unesco.org',
  'gutenberg.org',
  'sheg.stanford.edu',
];

const args = process.argv.slice(2);
const WRITE = args.includes('--write');
const ONLY = args.includes('--only') ? args[args.indexOf('--only') + 1] : null;
const JSON_OUT = args.includes('--json') ? args[args.indexOf('--json') + 1] : null;
const TIMEOUT_MS = 20000;
const CONCURRENCY = 4;

function hostAllowed(hostname) {
  const host = hostname.toLowerCase();
  return WHITELIST.some((d) => host === d || host.endsWith(`.${d}`));
}

/** 제목에서 본문 대조에 쓸 만한 조각을 뽑는다. */
function titleProbe(title) {
  const cleaned = (title ?? '')
    .replace(/\[[^\]]*\]/g, ' ')
    .replace(/\([^)]*\)/g, ' ')
    .replace(/[『』「」·]/g, ' ')
    .trim();
  const first = cleaned.split(/\s+/).filter((w) => w.length >= 2)[0];
  return first ?? null;
}

async function fetchOnce(url, method) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    return await fetch(url, {
      method,
      redirect: 'follow',
      signal: controller.signal,
      headers: {
        // 일부 공공 아카이브는 UA가 없으면 응답을 거부한다.
        // HTTP 헤더는 ASCII만 담을 수 있으므로 한글을 넣지 않는다.
        'User-Agent':
          'Mozilla/5.0 (compatible; history-factcheck-lab link checker; educational use)',
        'Accept-Language': 'ko,en;q=0.8',
      },
    });
  } finally {
    clearTimeout(timer);
  }
}

async function checkUrl(source) {
  const { url, title } = source;
  let parsed;
  try {
    parsed = new URL(url);
  } catch {
    return { status: 'FAIL', code: null, reason: 'URL 형식이 아님' };
  }

  if (!hostAllowed(parsed.hostname)) {
    return {
      status: 'FAIL',
      code: null,
      reason: `화이트리스트에 없는 도메인 (${parsed.hostname})`,
    };
  }

  let res;
  try {
    // HEAD를 막아 둔 서버가 많아 405/501이면 GET으로 다시 시도한다.
    res = await fetchOnce(url, 'HEAD');
    if (!res.ok && [403, 405, 501].includes(res.status)) res = await fetchOnce(url, 'GET');
    else if (res.ok) res = await fetchOnce(url, 'GET');
  } catch (err) {
    const reason = err.name === 'AbortError' ? `${TIMEOUT_MS / 1000}초 안에 응답 없음` : err.message;
    return { status: 'UNREACHABLE', code: null, reason };
  }

  if (res.status === 403 || res.status === 407 || res.status === 451) {
    // 차단이지 '없는 페이지'가 아니다. 학교 방화벽·프록시에서 흔히 나온다.
    return {
      status: 'BLOCKED',
      code: res.status,
      reason: `HTTP ${res.status} — 서버나 중간 프록시가 접근을 막음 (페이지가 없다는 뜻은 아님)`,
    };
  }

  if (!res.ok) {
    const dead = [404, 410].includes(res.status);
    return {
      status: 'FAIL',
      code: res.status,
      reason: dead ? `HTTP ${res.status} — 페이지가 사라졌다` : `HTTP ${res.status}`,
    };
  }

  let body = '';
  try {
    body = await res.text();
  } catch {
    /* 본문을 못 읽어도 200이면 링크 자체는 살아 있다 */
  }

  const probe = titleProbe(title);
  if (probe && body && !body.includes(probe)) {
    return {
      status: 'CHECK',
      code: res.status,
      reason: `200이지만 본문에서 '${probe}'를 찾지 못함 — 페이지 내용이 바뀌었는지 사람이 확인 필요`,
    };
  }

  return { status: 'OK', code: res.status, reason: probe ? `본문에서 '${probe}' 확인` : '200 응답' };
}

async function runPool(items, worker) {
  const results = new Array(items.length);
  let cursor = 0;
  await Promise.all(
    Array.from({ length: Math.min(CONCURRENCY, items.length) }, async () => {
      for (;;) {
        const i = cursor;
        cursor += 1;
        if (i >= items.length) return;
        results[i] = await worker(items[i], i);
      }
    }),
  );
  return results;
}

/* ---------- 실행 ---------- */

const files = readdirSync(DATA).filter((f) => f.startsWith('cases.') && f.endsWith('.json'));
const loaded = files.map((f) => ({ file: f, cases: JSON.parse(readFileSync(join(DATA, f), 'utf8')) }));

const targets = [];
loaded.forEach(({ file, cases }) => {
  cases.forEach((c) => {
    if (ONLY && c.id !== ONLY) return;
    c.sources.forEach((s) => {
      if (s.synthetic || !s.url) return; // 수업용 가상 예시는 검증 대상이 아니다
      targets.push({ file, caseId: c.id, source: s });
    });
  });
});

if (targets.length === 0) {
  console.log('검증할 URL이 없습니다.');
  process.exit(0);
}

console.log(`\nURL ${targets.length}건을 확인합니다 (동시 ${CONCURRENCY}건, 제한시간 ${TIMEOUT_MS / 1000}초)\n`);

const results = await runPool(targets, async (t) => ({ ...t, result: await checkUrl(t.source) }));

const ICON = { OK: '✓', CHECK: '?', FAIL: '✗', BLOCKED: '⊘', UNREACHABLE: '…' };
const byStatus = { OK: [], CHECK: [], FAIL: [], BLOCKED: [], UNREACHABLE: [] };
results.forEach((r) => byStatus[r.result.status].push(r));

results.forEach((r) => {
  console.log(`${ICON[r.result.status]} [${r.caseId}] ${r.source.id}  ${r.source.title}`);
  console.log(`    ${r.source.url}`);
  console.log(`    → ${r.result.reason}\n`);
});

console.log('─'.repeat(70));
console.log(
  `합계 ${results.length}건 · 확인 ${byStatus.OK.length} · 사람 확인 필요 ${byStatus.CHECK.length} · ` +
    `죽은 링크 ${byStatus.FAIL.length} · 차단됨 ${byStatus.BLOCKED.length} · 접속 불가 ${byStatus.UNREACHABLE.length}`,
);

const unresolved = [...byStatus.FAIL, ...byStatus.BLOCKED, ...byStatus.UNREACHABLE, ...byStatus.CHECK];
if (unresolved.length) {
  console.log('\n[사람이 확인해야 할 링크]');
  unresolved.forEach((r) => {
    console.log(`  · ${r.caseId} / ${r.source.id}: ${r.result.reason}`);
    console.log(`    ${r.source.url}`);
  });
}

const notReached = byStatus.BLOCKED.length + byStatus.UNREACHABLE.length;
if (notReached === results.length && results.length > 0) {
  console.log(
    '\n※ 한 건도 열리지 않았습니다. 링크가 전부 죽었다기보다는 이 컴퓨터의 네트워크가\n' +
      '  외부 접속을 막고 있을 가능성이 큽니다. 교내망 밖에서 한 번 더 돌려 보세요.\n' +
      "  이 상태의 결과는 '링크가 죽었다'가 아니라 '확인하지 못했다'로 읽어야 합니다.",
  );
} else if (notReached > 0) {
  console.log(
    `\n※ ${notReached}건은 차단되거나 응답이 없어 확인하지 못했습니다. 죽은 링크와는 다릅니다.`,
  );
}

if (JSON_OUT) {
  writeFileSync(
    JSON_OUT,
    JSON.stringify(
      {
        checkedAt: new Date().toISOString(),
        summary: Object.fromEntries(Object.entries(byStatus).map(([k, v]) => [k, v.length])),
        results: results.map((r) => ({
          caseId: r.caseId,
          sourceId: r.source.id,
          url: r.source.url,
          ...r.result,
        })),
      },
      null,
      2,
    ),
  );
  console.log(`\nJSON 보고서를 ${JSON_OUT}에 저장했습니다.`);
}

if (WRITE) {
  const verdict = new Map(results.map((r) => [`${r.caseId}::${r.source.id}`, r.result.status === 'OK']));
  loaded.forEach(({ file, cases }) => {
    let touched = false;
    cases.forEach((c) => {
      c.sources.forEach((s) => {
        const key = `${c.id}::${s.id}`;
        if (!verdict.has(key)) return;
        const next = verdict.get(key);
        if (s.urlVerified !== next) {
          s.urlVerified = next;
          touched = true;
        }
      });
    });
    if (touched) {
      writeFileSync(join(DATA, file), `${JSON.stringify(cases, null, 2)}\n`);
      console.log(`${file}의 urlVerified를 갱신했습니다.`);
    }
  });
} else {
  console.log('\n(urlVerified를 갱신하려면 --write 를 붙여 다시 실행하세요.)');
}

process.exit(byStatus.FAIL.length > 0 ? 1 : 0);
