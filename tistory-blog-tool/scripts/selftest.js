#!/usr/bin/env node
// 자체 테스트 (npm test) — 임시 작업 폴더에서 품질 게이트와 업로더 흐름을 검증한다.
// 1) 게이트: 정상 글 통과 / 유사문서·광고 클릭 유도·미검증 사실·자리표시자·키워드 중복·하루 한도 → 오류
// 2) 빌드: 티스토리 HTML·미리보기·썸네일·대시보드 생성
// 3) 업로더: 가짜 티스토리(test/mock-tistory.js)에 비공개 저장 → 사진 배치·카테고리·태그·본문 대조·front matter 기록
//    + 승인 없는 --schedule 거부, 이미 올린 글 거부
// 브라우저가 필요한 단계는 Chromium 이 없으면 건너뛴다 (CHROMIUM_PATH 로 지정 가능).

const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFile } = require('child_process');

const TOOL = path.resolve(__dirname, '..');
const EXAMPLE = path.join(TOOL, 'examples', '2026-09-27', '01-google-sheets-find-duplicates.md');
let failed = 0;
const ok = (cond, msg) => {
  console.log(`${cond ? '✅' : '❌'} ${msg}`);
  if (!cond) failed++;
};

// 비동기 실행 — 가짜 티스토리 서버가 같은 프로세스에 있어서 동기 실행(execFileSync)이면 응답을 못 한다
function run(root, script, args = []) {
  return new Promise((resolve) => {
    execFile(
      process.execPath,
      [path.join(TOOL, 'scripts', script), ...args],
      { env: { ...process.env, TBT_ROOT: root }, encoding: 'utf8', timeout: 180000 },
      (err, stdout, stderr) => resolve({ code: err ? (typeof err.code === 'number' ? err.code : 1) : 0, out: `${stdout || ''}${stderr || ''}` }),
    );
  });
}

function setup(blogUrl) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'tbt-'));
  for (const d of ['config', 'data', 'posts']) fs.mkdirSync(path.join(root, d), { recursive: true });
  const cfg = JSON.parse(fs.readFileSync(path.join(TOOL, 'config', 'blog.json'), 'utf8'));
  Object.assign(cfg, {
    blogUrl: blogUrl || 'https://example.tistory.com',
    blogName: '테스트 블로그',
    categories: ['업무 꿀팁', '생활 돈 정보'],
    browser: { headless: true, executablePath: process.env.CHROMIUM_PATH || null, channel: null },
  });
  fs.writeFileSync(path.join(root, 'config', 'blog.json'), JSON.stringify(cfg, null, 2));
  return root;
}

function today() {
  const d = new Date();
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

function writePost(root, name, transform) {
  const dir = path.join(root, 'posts', today());
  fs.mkdirSync(dir, { recursive: true });
  let src = fs.readFileSync(EXAMPLE, 'utf8').replace('example: true\n', '');
  src = transform ? transform(src) : src;
  const file = path.join(dir, name);
  fs.writeFileSync(file, src);
  return file;
}

async function gateTests() {
  console.log('\n── 1. 품질 게이트 ──');
  const root = setup();
  writePost(root, '01-sheets.md');
  let r = await run(root, 'check.js', [today()]);
  ok(r.code === 0, '정상 글 통과');

  // 유사문서: 키워드·제목만 바꾼 복제
  writePost(root, '02-copy.md', (s) =>
    s.replace(/slug: .*/, 'slug: sheets-copy').replace(/mainKeyword: .*/, 'mainKeyword: 구글시트 중복 제거').replace(/title: .*/, 'title: 구글시트 중복 제거 방법 총정리, 초보도 3분이면 끝'),
  );
  r = await run(root, 'check.js', [today()]);
  ok(/유사문서/.test(r.out) && r.code === 1, '템플릿 복제 글 → 유사문서 오류');
  fs.unlinkSync(path.join(root, 'posts', today(), '02-copy.md'));

  // 같은 메인 키워드
  writePost(root, '02-samekw.md', (s) => s.replace(/slug: .*/, 'slug: other').replace(/^구글 스프레드시트 중복값 찾기는 세 가지[^\n]*\n/m, '전혀 다른 도입 문장으로 시작하는 글이에요.\n'));
  r = await run(root, 'check.js', [path.join(root, 'posts', today(), '02-samekw.md')]);
  ok(/이미 쓴 글이 있습니다/.test(r.out), '같은 메인 키워드 → 키워드 잠식 오류');
  fs.unlinkSync(path.join(root, 'posts', today(), '02-samekw.md'));

  // 광고 클릭 유도 + 자리표시자
  const f3 = writePost(root, '03-bait.md', (s) => s.replace(/slug: .*/, 'slug: bait').replace(/mainKeyword: .*/, 'mainKeyword: 광고 테스트').replace('## 정리', '## 정리\n\n도움이 됐다면 아래 광고 한 번씩 클릭 부탁드려요.\n신청은 ○○에서 하세요.'));
  r = await run(root, 'check.js', [f3]);
  ok(/광고 클릭 유도/.test(r.out), '광고 클릭 유도 문구 → 오류');
  ok(/자리표시자/.test(r.out), '○○ 자리표시자 → 오류');
  fs.unlinkSync(f3);

  // YMYL 미검증 사실
  const f4 = writePost(root, '04-ymyl.md', (s) =>
    s
      .replace(/slug: .*/, 'slug: ymyl')
      .replace(/mainKeyword: .*/, 'mainKeyword: 근로장려금 신청')
      .replace('ymyl: false', 'ymyl: true\nsources:\n  - { id: S1, title: 국세청, url: "https://www.nts.go.kr", checkedAt: null }\nfacts:\n  - { claim: "최대 330만 원", source: S1, verified: false, evidence: "" }')
      .replace('## 정리', '## 정리\n\n2026년 9월 기준 최대 330만 원이고 신청은 5월 31일까지예요.'),
  );
  r = await run(root, 'check.js', [f4]);
  ok(/미검증 사실/.test(r.out), 'YMYL 미검증 사실 → 오류');
  ok(/facts 에 없는 숫자/.test(r.out) && /5월/.test(r.out), 'facts 에 없는 숫자(5월 31일) → 오류');
  fs.unlinkSync(f4);

  // 하루 한도: 6개
  for (let i = 2; i <= 6; i++)
    writePost(root, `0${i}-q.md`, (s) => s.replace(/slug: .*/, `slug: q${i}`).replace(/mainKeyword: .*/, `mainKeyword: 테스트 키워드 ${'가나다라마'[i - 2]}`));
  r = await run(root, 'check.js', [today()]);
  ok(/한도 5개 초과/.test(r.out), '하루 6개 → 한도 초과 오류');
  fs.rmSync(root, { recursive: true, force: true });
}

async function browserTests() {
  let chromium;
  try {
    ({ chromium } = require('playwright'));
    const b = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined });
    await b.close();
  } catch (e) {
    console.log(`\n(브라우저 단계 건너뜀 — Chromium 실행 불가: ${e.message.split('\n')[0]})`);
    return;
  }
  console.log('\n── 2. 빌드 ──');
  const mock = await require('../test/mock-tistory').start();
  const root = setup(mock.url);
  const file = writePost(root, '01-sheets.md', (s) => s.replace('## 방법 2.', '![조건부 서식 규칙 패널에 COUNTIF 수식을 넣은 화면](images/rule.png "맞춤 수식 입력 위치")\n\n## 방법 2.'));
  // 본문 사진용 이미지 만들기
  const b = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined });
  const pg = await b.newPage({ viewport: { width: 600, height: 300 } });
  await pg.setContent('<body style="margin:0;background:#e8f0fe;font:24px sans-serif;display:flex;align-items:center;justify-content:center;height:300px">=COUNTIF(B:B, B1)&gt;1</body>');
  fs.mkdirSync(path.join(path.dirname(file), 'images'), { recursive: true });
  await pg.screenshot({ path: path.join(path.dirname(file), 'images', 'rule.png') });
  await b.close();

  let r = await run(root, 'build.js', [today()]);
  const outDir = path.join(root, 'out', today());
  ok(r.code === 0 && fs.existsSync(path.join(outDir, '01-sheets.thumb.png')), '썸네일 생성');
  ok(fs.existsSync(path.join(outDir, '01-sheets.preview.html')) && fs.existsSync(path.join(outDir, 'index.html')), '미리보기·대시보드 생성');
  const html = fs.readFileSync(path.join(outDir, '01-sheets.tistory.html'), 'utf8');
  ok(/IMGMARK-1/.test(html) && /data-ke-size="size26"/.test(html) && /목차/.test(html), '티스토리 HTML: 사진 표식·소제목 속성·목차');

  console.log('\n── 3. 업로더 (가짜 티스토리) ──');
  r = await run(root, 'tistory_upload.js', [today(), '--schedule']);
  ok(r.code === 1 && /승인/.test(r.out), '승인 없는 --schedule 거부');
  r = await run(root, 'tistory_upload.js', [today(), '--dry-run']);
  ok(r.code === 0 && mock.posts.length === 0 && /dry-run/.test(r.out), 'dry-run: 끝까지 입력하되 저장 안 함');
  r = await run(root, 'tistory_upload.js', [today()]);
  if (r.code !== 0) console.log(r.out);
  ok(r.code === 0 && mock.posts.length === 1, '비공개 저장 성공');
  const saved = mock.posts[0] || { html: '' };
  ok(saved.open === 0, '비공개(open0)로 저장');
  ok(saved.category === '업무 꿀팁' && /#COUNTIF/.test(saved.tags), '카테고리·태그 입력');
  ok((saved.html.match(/<figure/g) || []).length === 2 && !/IMGMARK/.test(saved.html), '썸네일+본문 사진 2장, 표식 자리로 이동');
  ok(saved.html.indexOf('<figure') < saved.html.indexOf('구글 스프레드시트 중복값 찾기는') && saved.html.indexOf('맞춤 수식 입력 위치') > saved.html.indexOf('방법 1.'), '사진 순서: 썸네일 맨 위 · 본문 사진은 방법 1 뒤');
  ok(/alt="조건부 서식 규칙 패널/.test(saved.html), '사진 대체텍스트(alt) 기록');
  ok(/저장 확인: 본문 앞·뒤 대조 일치/.test(r.out), '저장 후 본문 대조');
  const fm = fs.readFileSync(file, 'utf8');
  ok(/status: uploaded/.test(fm) && /url: .*\/entry\/1/.test(fm), 'front matter 에 상태·URL 기록');
  r = await run(root, 'tistory_upload.js', [today()]);
  ok(r.code === 1 && /이미 올린 글/.test(r.out), '같은 글 두 번 업로드 거부');
  mock.server.close();
  fs.rmSync(root, { recursive: true, force: true });
}

(async () => {
  await gateTests();
  await browserTests();
  console.log(failed ? `\n❌ 실패 ${failed}건` : '\n✅ 모든 자체 테스트 통과');
  process.exit(failed ? 1 : 0);
})();
