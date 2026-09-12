// ---------------------------------------------------------------------------
// firestore.rules 권한 검사
//   학생이 남의 기록을 보지 못하는지, 교사가 남의 학급을 건드리지 못하는지,
//   다른 반을 사칭해 가입할 수 없는지를 실제 에뮬레이터로 확인한다.
//
//   실행:  npx firebase-tools emulators:exec --only firestore \
//            --project demo-korea-time "node tests/rules.test.mjs"
// ---------------------------------------------------------------------------
import {
  initializeTestEnvironment, assertSucceeds, assertFails,
} from '@firebase/rules-unit-testing';
import {
  doc, getDoc, setDoc, updateDoc, deleteDoc, collection, getDocs, query, where,
} from 'firebase/firestore';
import { readFileSync } from 'fs';

const env = await initializeTestEnvironment({
  projectId: 'demo-korea-time',
  firestore: { rules: readFileSync(new URL('../firestore.rules', import.meta.url), 'utf8'), host: '127.0.0.1', port: 8080 },
});

let pass = 0;
const fails = [];
async function test(name, fn) {
  try { await fn(); pass++; console.log('  ✓ ' + name); }
  catch (e) { fails.push(name + ' — ' + (e.message || e)); console.log('  ✗ ' + name); }
}

// ── 미리 심어 두는 데이터 ───────────────────────────────────────────────
await env.withSecurityRulesDisabled(async (ctx) => {
  const db = ctx.firestore();
  await setDoc(doc(db, 'teachers/T1'), { name: '김동은', email: 't1@school.kr' });
  await setDoc(doc(db, 'teachers/T2'), { name: '다른 교사', email: 't2@school.kr' });
  await setDoc(doc(db, 'classes/C1'), { code: 'ABC123', name: '3학년 2반', teacherId: 'T1', teacherName: '김동은', open: true, resets: {} });
  await setDoc(doc(db, 'classes/C2'), { code: 'XYZ789', name: '남의 반', teacherId: 'T2', teacherName: '다른 교사', open: true, resets: {} });
  await setDoc(doc(db, 'students/S7'), { classId: 'C1', classCode: 'ABC123', className: '3학년 2반', number: 7, nickname: '개경탐정', tier: 'ms', generation: 0 });
  await setDoc(doc(db, 'students/S8'), { classId: 'C1', classCode: 'ABC123', className: '3학년 2반', number: 8, nickname: '벽란도', tier: 'hs', generation: 0 });
  await setDoc(doc(db, 'progress/C1_7'), { classId: 'C1', number: 7, nickname: '개경탐정', tier: 'ms', percent: 30 });
  await setDoc(doc(db, 'progress/C1_8'), { classId: 'C1', number: 8, nickname: '벽란도', tier: 'hs', percent: 60 });
});

const t1 = env.authenticatedContext('T1', { email: 't1@school.kr' }).firestore();
const t2 = env.authenticatedContext('T2', { email: 't2@school.kr' }).firestore();
const s7 = env.authenticatedContext('S7', { email: 'abc123-7@koreatime.local' }).firestore();
const s8 = env.authenticatedContext('S8', { email: 'abc123-8@koreatime.local' }).firestore();
const anon = env.unauthenticatedContext().firestore();

console.log('\n[학생]');
await test('자기 기록은 읽는다', () => assertSucceeds(getDoc(doc(s7, 'progress/C1_7'))));
await test('자기 기록은 쓴다', () => assertSucceeds(setDoc(doc(s7, 'progress/C1_7'), { classId: 'C1', number: 7, percent: 40 }, { merge: true })));
await test('같은 반 친구 기록은 못 읽는다', () => assertFails(getDoc(doc(s7, 'progress/C1_8'))));
await test('같은 반 친구 기록은 못 고친다', () => assertFails(setDoc(doc(s7, 'progress/C1_8'), { percent: 100 }, { merge: true })));
await test('기록 전체 목록은 못 본다', () => assertFails(getDocs(collection(s7, 'progress'))));
await test('자기 기록을 지우지 못한다(교사만)', () => assertFails(deleteDoc(doc(s7, 'progress/C1_7'))));
await test('자기 번호를 바꿔치기 못한다', () => assertFails(updateDoc(doc(s7, 'progress/C1_7'), { number: 8 })));
await test('별명은 스스로 바꾼다', () => assertSucceeds(updateDoc(doc(s7, 'students/S7'), { nickname: '새별명' })));
await test('학급을 옮기지 못한다', () => assertFails(updateDoc(doc(s7, 'students/S7'), { classId: 'C2' })));
await test('남의 학생 문서를 못 고친다', () => assertFails(updateDoc(doc(s7, 'students/S8'), { nickname: '장난' })));
await test('학급을 만들지 못한다', () => assertFails(setDoc(doc(s7, 'classes/C9'), { code: 'QQQ111', name: '가짜', teacherId: 'S7', open: true, resets: {} })));
await test('학급의 가입 잠금을 못 건드린다', () => assertFails(updateDoc(doc(s7, 'classes/C1'), { open: false })));
await test('교사 문서를 만들지 못한다', () => assertFails(setDoc(doc(s7, 'teachers/S7'), { name: '가짜교사', email: 'x@x.kr' })));

console.log('\n[다른 반 사칭]');
// 로그인 이메일은 abc123-8 인데 9번으로 가입을 시도한다
await test('이메일 번호와 다른 번호로 가입 불가', () => assertFails(
  setDoc(doc(s8, 'students/S8x'), { classId: 'C1', classCode: 'ABC123', className: '3반', number: 9, nickname: '가짜', tier: 'ms', generation: 0 })));
// abc123 코드로 로그인했는데 C2(XYZ789) 반으로 가입을 시도한다
await test('다른 학급으로 가입 불가', () => assertFails(
  setDoc(doc(s8, 'students/S8y'), { classId: 'C2', classCode: 'XYZ789', className: '남의 반', number: 8, nickname: '가짜', tier: 'ms', generation: 0 })));

console.log('\n[교사]');
await test('자기 학급의 학생 기록을 본다', () => assertSucceeds(getDoc(doc(t1, 'progress/C1_7'))));
await test('자기 학급 현황을 조회한다', () => assertSucceeds(getDocs(query(collection(t1, 'progress'), where('classId', '==', 'C1')))));
await test('자기 학급의 가입을 잠근다', () => assertSucceeds(updateDoc(doc(t1, 'classes/C1'), { open: false })));
await test('비밀번호 초기화(세대 올리기)', () => assertSucceeds(updateDoc(doc(t1, 'classes/C1'), { 'resets.7': 1 })));
await test('자기 학급 학생의 기록을 지운다', () => assertSucceeds(deleteDoc(doc(t1, 'progress/C1_8'))));
await test('남의 학급을 못 고친다', () => assertFails(updateDoc(doc(t1, 'classes/C2'), { open: false })));
await test('남의 학급을 못 지운다', () => assertFails(deleteDoc(doc(t1, 'classes/C2'))));
await test('학급을 남에게 넘기지 못한다', () => assertFails(updateDoc(doc(t1, 'classes/C1'), { teacherId: 'T2' })));
await test('남의 학급을 가로채지 못한다', () => assertFails(updateDoc(doc(t2, 'classes/C1'), { teacherId: 'T2' })));
await test('학급 코드를 못 바꾼다', () => assertFails(updateDoc(doc(t1, 'classes/C1'), { code: 'HACK99' })));
await test('남의 교사 문서를 못 읽는다', () => assertFails(getDoc(doc(t1, 'teachers/T2'))));
await test('학급을 새로 만든다', () => assertSucceeds(setDoc(doc(t1, 'classes/C3'), { code: 'NEW123', name: '새 반', teacherId: 'T1', teacherName: '김동은', open: true, resets: {} })));
await test('남 이름으로 학급을 만들지 못한다', () => assertFails(setDoc(doc(t1, 'classes/C4'), { code: 'NEW456', name: '가로채기', teacherId: 'T2', teacherName: '다른 교사', open: true, resets: {} })));
await test('학생 기록을 대신 쓰지 못한다', () => assertFails(setDoc(doc(t1, 'progress/C1_7'), { classId: 'C1', number: 7, percent: 100 }, { merge: true })));

console.log('\n[로그인 안 한 사용자]');
await test('학급은 코드로 찾을 수 있다(가입 전이라 필요)', () => assertSucceeds(getDocs(query(collection(anon, 'classes'), where('code', '==', 'ABC123')))));
await test('학생 기록은 못 읽는다', () => assertFails(getDoc(doc(anon, 'progress/C1_7'))));
await test('학생 명단은 못 읽는다', () => assertFails(getDocs(collection(anon, 'students'))));
await test('아무것도 쓰지 못한다', () => assertFails(setDoc(doc(anon, 'progress/C1_7'), { percent: 0 }, { merge: true })));
await test('규칙에 없는 경로는 막힌다', () => assertFails(getDoc(doc(anon, 'secret/x'))));

await env.cleanup();
console.log(`\n통과 ${pass} / ${pass + fails.length}`);
if (fails.length) { console.error('\n실패:'); fails.forEach((f) => console.error('  ✗ ' + f)); process.exit(1); }
console.log('✓ 보안 규칙 검사 통과');
