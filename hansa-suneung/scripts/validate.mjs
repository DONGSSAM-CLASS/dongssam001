// scripts/validate.mjs — 배포 데이터 무결성 검사(Node, 의존성 없음).
// 오류가 있으면 exit code 1 로 배포(빌드)를 막는다. npm run verify-data 로 실행되며 build 전에 자동 실행.
// Node 로 구현해 빌드가 Python 설치 여부와 무관하게 동작한다(PDF 파싱 extract.py 만 Python 필요).
//
// 검사 항목:
//   [오류] 존재하지 않는 unitIds / examId 참조
//   [오류] verified:true 인데 topic 비어 있음
//   [오류] 중복 itemId
//   [오류] 한 시험의 문항 수가 totalItems 초과
//   [오류] (초안이 있으면) evidence.sourceFile 이 data/raw 의 실제 파일과 불일치
//   [경고] 한 시험의 문항 수가 totalItems 미만(입력 진행 중)
//   [경고] 저작권: 배포용 items.json 에 evidence 포함
import { readFileSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = dirname(HERE);
const DATA = join(ROOT, 'public', 'data');
const RAW_DIR = join(ROOT, 'data', 'raw');
const DRAFT = join(ROOT, 'data', 'items.draft.json');

const errors = [];
const warnings = [];

const load = (name) => JSON.parse(readFileSync(join(DATA, name), 'utf-8'));

function collectUnitIds(units, acc) {
  for (const u of units) {
    acc.add(u.id);
    if (Array.isArray(u.children)) collectUnitIds(u.children, acc);
  }
}

const curriculum = load('curriculum.json');
const exams = load('exams.json');
const items = load('items.json');

const unitIds = new Set();
collectUnitIds(curriculum.units ?? [], unitIds);
const examIds = new Set(exams.map((e) => e.examId));

// 1) 중복 itemId
const seen = new Set();
for (const it of items) {
  if (seen.has(it.itemId)) errors.push(`중복 itemId: ${it.itemId}`);
  seen.add(it.itemId);
}

// 2) unitIds / verified-topic / examId / evidence
for (const it of items) {
  for (const uid of it.unitIds ?? []) {
    if (!unitIds.has(uid)) errors.push(`${it.itemId}: 존재하지 않는 unitId 참조 → ${uid}`);
  }
  if (it.verified && !(it.topic ?? '').trim()) {
    errors.push(`${it.itemId}: verified=true 인데 topic 이 비어 있음`);
  }
  if (!examIds.has(it.examId)) {
    errors.push(`${it.itemId}: 존재하지 않는 examId 참조 → ${it.examId}`);
  }
  if ('evidence' in it) {
    warnings.push(`${it.itemId}: 배포용 items.json 에 evidence 가 포함됨 (저작권 — 배포 전 제거 권장)`);
  }
}

// 3) 시험별 문항 수 vs totalItems
for (const e of exams) {
  const cnt = items.filter((it) => it.examId === e.examId).length;
  const total = e.totalItems;
  if (Number.isInteger(total)) {
    if (cnt > total) errors.push(`${e.examId}: 등록 문항 수(${cnt})가 totalItems(${total})를 초과`);
    else if (cnt > 0 && cnt < total)
      warnings.push(`${e.examId}: 등록 문항 수(${cnt}) < totalItems(${total}) — 입력 진행 중`);
  }
}

// 4) 초안(있으면) evidence.sourceFile 실제 파일 존재 확인
if (existsSync(DRAFT)) {
  const draft = JSON.parse(readFileSync(DRAFT, 'utf-8'));
  for (const it of draft) {
    const src = it.evidence?.sourceFile;
    if (src && !existsSync(join(RAW_DIR, src))) {
      errors.push(`[draft] ${it.itemId}: evidence.sourceFile 이 실제 파일과 불일치 → ${src}`);
    }
  }
}

console.log(`검증 대상: 단원 ${unitIds.size}개 · 시험 ${exams.length}개 · 문항 ${items.length}개`);
for (const w of warnings) console.log('  ⚠️ ', w);
for (const e of errors) console.log('  ❌ ', e);

if (errors.length) {
  console.log(`\n무결성 검사 실패: 오류 ${errors.length}건. 배포를 중단합니다.`);
  process.exit(1);
}
console.log(`\n무결성 검사 통과 (경고 ${warnings.length}건).`);
