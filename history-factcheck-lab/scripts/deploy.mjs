#!/usr/bin/env node
/**
 * 배포 전 점검 + 빌드 + Firebase Hosting 배포.
 *
 *   npm run deploy
 *
 * 배포는 되돌리기 어렵고 인터넷에 공개되는 작업이므로, 실수하기 쉬운 것들을
 * 먼저 막아 준다. 점검에 걸리면 무엇을 어떻게 고치면 되는지 알려 주고 멈춘다.
 */
import { execSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const DRY = process.argv.includes('--dry-run');

function fail(title, ...lines) {
  console.error(`\n✗ ${title}\n`);
  lines.forEach((l) => console.error(`  ${l}`));
  console.error('');
  process.exit(1);
}

function step(msg) {
  console.log(`\n▶ ${msg}`);
}

function run(cmd) {
  execSync(cmd, { cwd: ROOT, stdio: 'inherit' });
}

/* 1. 교사 모드 암호가 기본값인지 */
step('교사 모드 암호 확인');
const envPath = join(ROOT, '.env.local');
if (!existsSync(envPath)) {
  fail(
    '.env.local 이 없습니다 — 교사 모드 암호가 기본값(teacher)으로 배포됩니다.',
    'cp .env.example .env.local 로 만든 뒤 VITE_TEACHER_PASSCODE 값을 바꿔 주세요.',
  );
}
const envText = readFileSync(envPath, 'utf8');
const match = envText.match(/^\s*VITE_TEACHER_PASSCODE\s*=\s*(.+)\s*$/m);
const passcode = match?.[1]?.trim();
if (!passcode) {
  fail('.env.local 에 VITE_TEACHER_PASSCODE 가 없습니다.', '예: VITE_TEACHER_PASSCODE=원하는암호');
}
if (passcode.toLowerCase() === 'teacher') {
  fail(
    '교사 모드 암호가 아직 기본값(teacher)입니다.',
    '.env.local 의 VITE_TEACHER_PASSCODE 를 다른 값으로 바꿔 주세요.',
  );
}
console.log(`  암호가 설정되어 있습니다 (${passcode.length}자).`);

/* 2. Firebase 프로젝트 ID가 플레이스홀더인지 */
step('Firebase 프로젝트 확인');
const rcPath = join(ROOT, '.firebaserc');
if (!existsSync(rcPath)) fail('.firebaserc 가 없습니다.');
const rc = JSON.parse(readFileSync(rcPath, 'utf8'));
const projectId = rc.projects?.default;
if (!projectId || projectId === 'YOUR_PROJECT_ID') {
  fail(
    'Firebase 프로젝트 ID가 아직 설정되지 않았습니다.',
    '',
    '아직 프로젝트가 없다면 https://console.firebase.google.com 에서 하나 만든 뒤,',
    '아래 명령으로 이 폴더에 연결해 주세요.',
    '',
    '  npx firebase login',
    '  npx firebase use --add',
    '',
    '또는 .firebaserc 의 YOUR_PROJECT_ID 를 실제 프로젝트 ID로 직접 바꿔도 됩니다.',
  );
}
console.log(`  프로젝트: ${projectId}`);

/* 3. 로그인 여부 */
step('Firebase 로그인 확인');
try {
  const out = execSync('npx --no-install firebase login:list', {
    cwd: ROOT,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  if (/No authorized accounts/i.test(out)) throw new Error('not logged in');
  console.log(`  ${out.trim().split('\n').slice(0, 2).join(' ')}`);
} catch {
  fail(
    'Firebase 에 로그인되어 있지 않습니다.',
    '아래 명령을 먼저 실행해 주세요. 브라우저가 열립니다.',
    '',
    '  npx firebase login',
  );
}

/* 4. 자체 점검 */
step('자체 점검 (데이터·채점기 무결성)');
run('node scripts/self-check.mjs');

/* 5. 빌드 */
step('빌드');
run('npm run build');

/* 6. 빌드 결과에 기본 암호가 남아 있지 않은지 재확인 */
step('빌드 결과 확인');
const distCheck = execSync(
  `grep -rl ${JSON.stringify(passcode)} dist/assets/ || true`,
  { cwd: ROOT, encoding: 'utf8' },
).trim();
if (!distCheck) {
  fail(
    '빌드 결과물에서 설정한 암호를 찾지 못했습니다.',
    '.env.local 이 빌드에 반영되지 않았을 수 있습니다. npm run build 를 직접 실행해 확인해 주세요.',
  );
}
console.log('  설정한 암호가 빌드에 반영되었습니다.');

/* 7. 배포 */
if (DRY) {
  console.log('\n--dry-run 이므로 여기서 멈춥니다. 실제 배포는 아래 명령입니다.\n');
  console.log(`  npx firebase deploy --only hosting --project ${projectId}\n`);
  process.exit(0);
}

step('Firebase Hosting 배포');
console.log('  인터넷에 공개됩니다. 중단하려면 지금 Ctrl+C 를 누르세요.\n');
run(`npx firebase deploy --only hosting --project ${projectId}`);

console.log('\n✓ 배포가 끝났습니다.');
console.log(`  https://${projectId}.web.app`);
console.log('\n배포 뒤 확인할 것');
console.log('  1. /#/teacher 에서 새 암호로 들어가지는지');
console.log('  2. 학생 기기(모바일)에서 워크벤치 탭이 정상인지');
console.log('  3. npm run verify-links 로 사료 링크가 살아 있는지\n');
