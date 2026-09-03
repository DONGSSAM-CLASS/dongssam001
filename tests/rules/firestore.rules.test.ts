/**
 * Firestore Security Rules 테스트
 * 실행: npm run test:rules  (firebase emulators:exec 가 Firestore 에뮬레이터를 띄우고 FIRESTORE_EMULATOR_HOST 를 주입)
 */
import { readFileSync } from 'node:fs';
import { afterAll, beforeAll, beforeEach, describe, it } from 'vitest';
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
  type RulesTestContext,
  type RulesTestEnvironment,
} from '@firebase/rules-unit-testing';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  setDoc,
  updateDoc,
  where,
  writeBatch,
} from 'firebase/firestore';

const PROJECT_ID = 'demo-history-globe';
let env: RulesTestEnvironment;

// ── 고정 픽스처 ──────────────────────────────────────────
const T1 = { uid: 'teacher1', email: 'kim@school.kr' }; // 학급 소유 교사
const T2 = { uid: 'teacher2', email: 'lee@school.kr' }; // 다른 교사
const ADMIN = { uid: 'admin1', email: 'admin@school.kr' };
const CLASS_ID = 'class1';
const CODE = 'ABC234'; // authPrefix 이자 최초 학급코드
// Firebase Auth 는 이메일을 소문자로 정규화한다 → 가상 이메일 접두어는 항상 소문자
const S7 = { uid: 'stu7', email: `${CODE.toLowerCase()}-7@student.local` }; // 가입된 학생(7번)
const S8 = { uid: 'stu8', email: `${CODE.toLowerCase()}-8@student.local` }; // 아직 가입 안 한 학생(8번)
const OTHER_CLASS_ID = 'class2';
const OTHER_CODE = 'XYZ789';
const S_OTHER = { uid: 'stuX', email: `${OTHER_CODE.toLowerCase()}-3@student.local` };

function ctx(user: { uid: string; email: string } | null): RulesTestContext {
  return user ? env.authenticatedContext(user.uid, { email: user.email }) : env.unauthenticatedContext();
}
const now = () => Date.now();

async function seed() {
  await env.withSecurityRulesDisabled(async (c) => {
    const db = c.firestore();
    await setDoc(doc(db, 'users', T1.uid), { role: 'teacher', displayName: '김교사', schoolLevel: '중학교', schoolName: '가상중', subjects: ['역사①'], createdAt: now() });
    await setDoc(doc(db, 'users', T2.uid), { role: 'teacher', displayName: '이교사', schoolLevel: '고등학교', schoolName: '가상고', subjects: ['세계사'], createdAt: now() });
    await setDoc(doc(db, 'users', ADMIN.uid), { role: 'teacher', displayName: '관리자', schoolLevel: '중학교', schoolName: '가상중', subjects: [], createdAt: now() });
    await setDoc(doc(db, 'admins', ADMIN.uid), { grantedBy: 'console', createdAt: now() });

    await setDoc(doc(db, 'classes', CLASS_ID), { teacherId: T1.uid, name: '2-1', code: CODE, authPrefix: CODE, schoolLevel: '중학교', subject: '역사①', archived: false, settings: { walkKmPerDay: 30, sailKmPerDay: 120, horseKmPerDay: 60 }, createdAt: now(), codeUpdatedAt: now() });
    await setDoc(doc(db, 'class_codes', CODE), { classId: CLASS_ID, teacherId: T1.uid, authPrefix: CODE, active: true });
    await setDoc(doc(db, 'classes', OTHER_CLASS_ID), { teacherId: T2.uid, name: '1-3', code: OTHER_CODE, authPrefix: OTHER_CODE, schoolLevel: '고등학교', subject: '세계사', archived: false, settings: { walkKmPerDay: 30, sailKmPerDay: 120, horseKmPerDay: 60 }, createdAt: now(), codeUpdatedAt: now() });
    await setDoc(doc(db, 'class_codes', OTHER_CODE), { classId: OTHER_CLASS_ID, teacherId: T2.uid, authPrefix: OTHER_CODE, active: true });

    await setDoc(doc(db, 'users', S7.uid), { role: 'student', displayName: '학생7', classId: CLASS_ID, number: 7, active: true, createdAt: now() });
    await setDoc(doc(db, 'class_members', `${CLASS_ID}_7`), { classId: CLASS_ID, number: 7, uid: S7.uid, displayName: '학생7', active: true, authGeneration: 0, resetPending: false, joinedAt: now(), lastSeenAt: now() });
    await setDoc(doc(db, 'users', S_OTHER.uid), { role: 'student', displayName: '타반학생', classId: OTHER_CLASS_ID, number: 3, active: true, createdAt: now() });
    await setDoc(doc(db, 'class_members', `${OTHER_CLASS_ID}_3`), { classId: OTHER_CLASS_ID, number: 3, uid: S_OTHER.uid, displayName: '타반학생', active: true, authGeneration: 0, resetPending: false, joinedAt: now(), lastSeenAt: now() });

    await setDoc(doc(db, 'sessions', 'sess_open'), { teacherId: T1.uid, classId: CLASS_ID, title: '1200년의 세계', status: 'open', yearRange: [1100, 1300], focusYear: 1200, layers: {}, highlightPolities: [], highlightFigures: [], achievementStandards: [], worksheet: [], follow: { enabled: false, year: 1200, camera: { lat: 30, lon: 110, zoom: 1 }, updatedAt: now() }, createdAt: now(), updatedAt: now() });
    await setDoc(doc(db, 'sessions', 'sess_draft'), { teacherId: T1.uid, classId: CLASS_ID, title: '초안', status: 'draft', yearRange: [0, 100], focusYear: 50, layers: {}, highlightPolities: [], highlightFigures: [], achievementStandards: [], worksheet: [], follow: { enabled: false, year: 50, camera: { lat: 0, lon: 0, zoom: 1 }, updatedAt: now() }, createdAt: now(), updatedAt: now() });
    await setDoc(doc(db, 'sessions', 'sess_closed'), { teacherId: T1.uid, classId: CLASS_ID, title: '지난 수업', status: 'closed', yearRange: [0, 100], focusYear: 50, layers: {}, highlightPolities: [], highlightFigures: [], achievementStandards: [], worksheet: [], follow: { enabled: false, year: 50, camera: { lat: 0, lon: 0, zoom: 1 }, updatedAt: now() }, createdAt: now(), updatedAt: now() });

    await setDoc(doc(db, 'missions', 'm1'), { teacherId: T1.uid, classId: CLASS_ID, sessionId: 'sess_open', title: '3대륙 마킹', description: '', requirements: [], published: true, dueAt: null, createdAt: now() });
    await setDoc(doc(db, 'missions', 'm_hidden'), { teacherId: T1.uid, classId: CLASS_ID, sessionId: 'sess_open', title: '비공개', description: '', requirements: [], published: false, dueAt: null, createdAt: now() });

    await setDoc(doc(db, 'teacher_overrides', `${T1.uid}_figure_genghis_khan`), { teacherId: T1.uid, kind: 'figure', targetId: 'genghis_khan', op: 'edit', data: { note: '수정' }, updatedAt: now() });
    await setDoc(doc(db, 'teacher_overrides', `${T2.uid}_polity_goryeo`), { teacherId: T2.uid, kind: 'polity', targetId: 'goryeo', op: 'hide', data: {}, updatedAt: now() });
  });
}

beforeAll(async () => {
  const hostPort = process.env.FIRESTORE_EMULATOR_HOST ?? '127.0.0.1:8080';
  const [host, port] = hostPort.split(':');
  env = await initializeTestEnvironment({
    projectId: PROJECT_ID,
    firestore: { rules: readFileSync('firestore.rules', 'utf8'), host, port: Number(port) },
  });
});
beforeEach(async () => {
  await env.clearFirestore();
  await seed();
});
afterAll(async () => {
  await env.cleanup();
});

// ── users ──────────────────────────────────────────────
describe('users', () => {
  it('교사는 일반 이메일로 자기 프로필을 만들 수 있다', async () => {
    const db = ctx({ uid: 'newT', email: 'new@school.kr' }).firestore();
    await assertSucceeds(setDoc(doc(db, 'users', 'newT'), { role: 'teacher', displayName: '신규', schoolLevel: '중학교', schoolName: '가상중', subjects: ['역사①'], createdAt: now() }));
  });
  it('학생 가상 이메일로는 교사 프로필을 만들 수 없다', async () => {
    const db = ctx(S8).firestore();
    await assertFails(setDoc(doc(db, 'users', S8.uid), { role: 'teacher', displayName: '해킹', schoolLevel: '중학교', schoolName: 'x', subjects: [], createdAt: now() }));
  });
  it('다른 사람 uid 로 프로필을 만들 수 없다', async () => {
    const db = ctx({ uid: 'newT', email: 'new@school.kr' }).firestore();
    await assertFails(setDoc(doc(db, 'users', 'someoneElse'), { role: 'teacher', displayName: 'x', schoolLevel: '중학교', schoolName: 'x', subjects: [], createdAt: now() }));
  });
  it('본인은 role 을 바꿀 수 없다', async () => {
    const db = ctx(S7).firestore();
    await assertFails(updateDoc(doc(db, 'users', S7.uid), { role: 'teacher' }));
    await assertSucceeds(updateDoc(doc(db, 'users', S7.uid), { nickname: '별명' }));
  });
  it('담당 교사만 학생을 비활성화할 수 있다', async () => {
    await assertSucceeds(updateDoc(doc(ctx(T1).firestore(), 'users', S7.uid), { active: false }));
    await assertFails(updateDoc(doc(ctx(T2).firestore(), 'users', S7.uid), { active: false }));
  });
  it('담당 교사는 학생 프로필을 읽을 수 있고 다른 교사는 읽을 수 없다', async () => {
    await assertSucceeds(getDoc(doc(ctx(T1).firestore(), 'users', S7.uid)));
    await assertFails(getDoc(doc(ctx(T2).firestore(), 'users', S7.uid)));
    await assertFails(getDoc(doc(ctx(null).firestore(), 'users', S7.uid)));
  });
});

// ── classes / class_codes ─────────────────────────────
describe('classes & class_codes', () => {
  it('로그인 없이 학급코드 문서를 ID로 조회할 수 있지만 목록 조회는 불가', async () => {
    const db = ctx(null).firestore();
    await assertSucceeds(getDoc(doc(db, 'class_codes', CODE)));
    await assertFails(getDocs(collection(db, 'class_codes')));
    await assertFails(getDoc(doc(db, 'classes', CLASS_ID)));
  });
  it('교사는 학급 + 학급코드를 한 배치로 만들 수 있다', async () => {
    const db = ctx(T1).firestore();
    const b = writeBatch(db);
    b.set(doc(db, 'classes', 'c_new'), { teacherId: T1.uid, name: '2-5', code: 'QWE456', authPrefix: 'QWE456', schoolLevel: '중학교', subject: '역사①', archived: false, settings: { walkKmPerDay: 30, sailKmPerDay: 120, horseKmPerDay: 60 }, createdAt: now(), codeUpdatedAt: now() });
    b.set(doc(db, 'class_codes', 'QWE456'), { classId: 'c_new', teacherId: T1.uid, authPrefix: 'QWE456', active: true });
    await assertSucceeds(b.commit());
  });
  it('다른 교사 명의(teacherId)로 학급을 만들 수 없고, 코드 형식이 틀리면 거부된다', async () => {
    const db = ctx(T1).firestore();
    await assertFails(setDoc(doc(db, 'classes', 'c_bad1'), { teacherId: T2.uid, name: 'x', code: 'QWE456', authPrefix: 'QWE456', schoolLevel: '중학교', subject: '역사①', archived: false, createdAt: now(), codeUpdatedAt: now() }));
    await assertFails(setDoc(doc(db, 'classes', 'c_bad2'), { teacherId: T1.uid, name: 'x', code: 'abc', authPrefix: 'abc', schoolLevel: '중학교', subject: '역사①', archived: false, createdAt: now(), codeUpdatedAt: now() }));
  });
  it('학급코드 문서의 resets(초기화 세대)는 소유 교사만 갱신하고 누구나 읽는다', async () => {
    await assertSucceeds(updateDoc(doc(ctx(T1).firestore(), 'class_codes', CODE), { resets: { '7': 1 } }));
    await assertFails(updateDoc(doc(ctx(T2).firestore(), 'class_codes', CODE), { resets: { '7': 2 } }));
    await assertFails(updateDoc(doc(ctx(S7).firestore(), 'class_codes', CODE), { resets: { '7': 2 } }));
    await assertFails(updateDoc(doc(ctx(T1).firestore(), 'class_codes', CODE), { classId: OTHER_CLASS_ID }));
    const snap = await getDoc(doc(ctx(null).firestore(), 'class_codes', CODE));
    if (!snap.data()?.resets) throw new Error('resets should be readable');
  });
  it('학급코드 재발급: code 는 바꿀 수 있지만 authPrefix·teacherId 는 못 바꾼다', async () => {
    const db = ctx(T1).firestore();
    await assertSucceeds(updateDoc(doc(db, 'classes', CLASS_ID), { code: 'NEW999', codeUpdatedAt: now() }));
    await assertFails(updateDoc(doc(db, 'classes', CLASS_ID), { authPrefix: 'NEW999' }));
    await assertFails(updateDoc(doc(db, 'classes', CLASS_ID), { teacherId: T2.uid }));
    await assertFails(updateDoc(doc(ctx(T2).firestore(), 'classes', CLASS_ID), { name: '탈취' }));
  });
  it('학생은 자기 학급만 읽을 수 있고, 교사는 자기 학급 목록만 조회할 수 있다', async () => {
    await assertSucceeds(getDoc(doc(ctx(S7).firestore(), 'classes', CLASS_ID)));
    await assertFails(getDoc(doc(ctx(S7).firestore(), 'classes', OTHER_CLASS_ID)));
    const tdb = ctx(T1).firestore();
    await assertSucceeds(getDocs(query(collection(tdb, 'classes'), where('teacherId', '==', T1.uid))));
    await assertFails(getDocs(collection(tdb, 'classes')));
  });
});

// ── student signup (users + class_members) ───────────
describe('student signup', () => {
  const profile = { role: 'student', displayName: '학생8', classId: CLASS_ID, number: 8, active: true, createdAt: now() };
  const member = { classId: CLASS_ID, number: 8, uid: S8.uid, displayName: '학생8', active: true, authGeneration: 0, resetPending: false, joinedAt: now(), lastSeenAt: now() };

  it('가상 이메일 접두어·번호가 학급과 일치하면 가입 배치가 성공한다', async () => {
    const db = ctx(S8).firestore();
    const b = writeBatch(db);
    b.set(doc(db, 'users', S8.uid), profile);
    b.set(doc(db, 'class_members', `${CLASS_ID}_8`), member);
    await assertSucceeds(b.commit());
  });
  it('다른 학급(classId)으로는 가입할 수 없다', async () => {
    const db = ctx(S8).firestore();
    await assertFails(setDoc(doc(db, 'users', S8.uid), { ...profile, classId: OTHER_CLASS_ID }));
  });
  it('이메일 번호와 다른 번호로는 가입할 수 없다', async () => {
    const db = ctx(S8).firestore();
    await assertFails(setDoc(doc(db, 'users', S8.uid), { ...profile, number: 9 }));
    await assertFails(setDoc(doc(db, 'class_members', `${CLASS_ID}_9`), { ...member, number: 9 }));
  });
  it('이미 가입된 번호(7번) 자리는 다른 uid 가 덮어쓸 수 없다', async () => {
    const attacker = { uid: 'stu7b', email: `${CODE.toLowerCase()}-7@student.local` };
    const db = ctx(attacker).firestore();
    await assertFails(setDoc(doc(db, 'class_members', `${CLASS_ID}_7`), { ...member, number: 7, uid: attacker.uid }));
  });
  it('교사가 미리 등록한 빈 자리(uid 없음)는 해당 번호 학생이 채울 수 있다', async () => {
    await env.withSecurityRulesDisabled(async (c) => {
      await setDoc(doc(c.firestore(), 'class_members', `${CLASS_ID}_8`), { classId: CLASS_ID, number: 8, uid: null, displayName: '미리등록8', active: true, authGeneration: 0, resetPending: false, joinedAt: null, lastSeenAt: null });
    });
    const db = ctx(S8).firestore();
    const b = writeBatch(db);
    b.set(doc(db, 'users', S8.uid), profile);
    b.update(doc(db, 'class_members', `${CLASS_ID}_8`), { uid: S8.uid, joinedAt: now(), lastSeenAt: now() });
    await assertSucceeds(b.commit());
  });
  it('교사는 자기 학급 사이에서만 학생을 이동시킬 수 있다', async () => {
    // T1 이 두 번째 학급을 소유
    await env.withSecurityRulesDisabled(async (c) => {
      await setDoc(doc(c.firestore(), 'classes', 'class1b'), { teacherId: T1.uid, name: '2-2', code: 'AAA111', authPrefix: 'AAA111', schoolLevel: '중학교', subject: '역사①', archived: false, settings: { walkKmPerDay: 30, sailKmPerDay: 120, horseKmPerDay: 60 }, createdAt: now(), codeUpdatedAt: now() });
    });
    const db = ctx(T1).firestore();
    const b = writeBatch(db);
    b.set(doc(db, 'class_members', 'class1b_7'), { classId: 'class1b', number: 7, uid: S7.uid, displayName: '학생7', active: true, authGeneration: 0, resetPending: false, joinedAt: now(), lastSeenAt: now() });
    b.update(doc(db, 'users', S7.uid), { classId: 'class1b', number: 7 });
    b.delete(doc(db, 'class_members', `${CLASS_ID}_7`));
    await assertSucceeds(b.commit());
    // 다른 교사(T2)는 T1 의 학급에 명단을 만들 수 없고, T1 의 학생을 자기 학급으로 옮길 수도 없다.
    // (T2 가 자기 학급에 남의 uid 로 행을 만들어도 학생의 users.classId 를 바꿀 수 없어 접근 권한은 생기지 않는다)
    const db2 = ctx(T2).firestore();
    await assertFails(setDoc(doc(db2, 'class_members', 'class1b_9'), { classId: 'class1b', number: 9, uid: null, displayName: '침입', active: true, authGeneration: 0, resetPending: false, joinedAt: null, lastSeenAt: null }));
    await assertFails(updateDoc(doc(db2, 'users', S7.uid), { classId: OTHER_CLASS_ID }));
  });
  it('비밀번호 초기화(세대 1) 후 새 계정이 자리를 이어받는다', async () => {
    // 교사가 초기화
    await assertSucceeds(updateDoc(doc(ctx(T1).firestore(), 'class_members', `${CLASS_ID}_7`), { authGeneration: 1, resetPending: true }));
    // 새 세대 계정
    const s7v2 = { uid: 'stu7v2', email: `${CODE.toLowerCase()}-7-1@student.local` };
    const db = ctx(s7v2).firestore();
    const b = writeBatch(db);
    b.set(doc(db, 'users', s7v2.uid), { ...profile, number: 7, displayName: '학생7' });
    b.update(doc(db, 'class_members', `${CLASS_ID}_7`), { uid: s7v2.uid, resetPending: false, joinedAt: now() });
    await assertSucceeds(b.commit());
    // 세대가 맞지 않는 계정은 거부
    const wrongGen = { uid: 'stu7v3', email: `${CODE.toLowerCase()}-7-2@student.local` };
    await assertFails(updateDoc(doc(ctx(wrongGen).firestore(), 'class_members', `${CLASS_ID}_7`), { uid: wrongGen.uid, resetPending: false }));
  });
});

// ── sessions ─────────────────────────────────────────
describe('sessions', () => {
  it('학생은 공개(open/closed) 세션만 읽고 초안은 못 읽는다', async () => {
    const db = ctx(S7).firestore();
    await assertSucceeds(getDoc(doc(db, 'sessions', 'sess_open')));
    await assertSucceeds(getDoc(doc(db, 'sessions', 'sess_closed')));
    await assertFails(getDoc(doc(db, 'sessions', 'sess_draft')));
    await assertSucceeds(getDocs(query(collection(db, 'sessions'), where('classId', '==', CLASS_ID), where('status', 'in', ['open', 'closed']))));
    await assertFails(getDocs(query(collection(db, 'sessions'), where('classId', '==', CLASS_ID))));
  });
  it('다른 학급 학생은 세션을 읽을 수 없다', async () => {
    await assertFails(getDoc(doc(ctx(S_OTHER).firestore(), 'sessions', 'sess_open')));
  });
  it('학급을 만드는 배치 안에서는 세션을 만들 수 없다 (ownsClass 는 get() 이므로 배치 이전 상태를 본다)', async () => {
    const db = ctx(T1).firestore();
    const b = writeBatch(db);
    b.set(doc(db, 'classes', 'c_batch'), { teacherId: T1.uid, name: '3-1', code: 'BATCH1', authPrefix: 'BATCH1', schoolLevel: '중학교', subject: '역사①', archived: false, settings: { walkKmPerDay: 30, sailKmPerDay: 120, horseKmPerDay: 60 }, createdAt: now(), codeUpdatedAt: now() });
    b.set(doc(db, 'sessions', 's_batch'), { teacherId: T1.uid, classId: 'c_batch', title: '같은 배치', status: 'draft', yearRange: [0, 100], focusYear: 50, layers: {}, highlightPolities: [], highlightFigures: [], achievementStandards: [], worksheet: [], follow: { enabled: false, year: 50, camera: { lat: 0, lon: 0, zoom: 1 }, updatedAt: now() }, createdAt: now(), updatedAt: now() });
    await assertFails(b.commit());
  });
  it('소유 교사만 세션을 만들고 수정한다', async () => {
    const base = { teacherId: T1.uid, classId: CLASS_ID, title: '새 세션', status: 'draft', yearRange: [0, 100], focusYear: 50, layers: {}, highlightPolities: [], highlightFigures: [], achievementStandards: [], worksheet: [], follow: { enabled: false, year: 50, camera: { lat: 0, lon: 0, zoom: 1 }, updatedAt: now() }, createdAt: now(), updatedAt: now() };
    await assertSucceeds(setDoc(doc(ctx(T1).firestore(), 'sessions', 's_new'), base));
    await assertFails(setDoc(doc(ctx(T2).firestore(), 'sessions', 's_new2'), { ...base, teacherId: T2.uid }));
    await assertFails(setDoc(doc(ctx(S7).firestore(), 'sessions', 's_new3'), base));
    await assertSucceeds(updateDoc(doc(ctx(T1).firestore(), 'sessions', 'sess_open'), { 'follow.enabled': true, 'follow.year': 1274 }));
    await assertFails(updateDoc(doc(ctx(T1).firestore(), 'sessions', 'sess_open'), { classId: OTHER_CLASS_ID }));
    await assertFails(updateDoc(doc(ctx(S7).firestore(), 'sessions', 'sess_open'), { title: '낙서' }));
  });
});

// ── student_work ─────────────────────────────────────
describe('student_work', () => {
  const work = { sessionId: 'sess_open', classId: CLASS_ID, number: 7, uid: S7.uid, pins: [{ id: 'p1', name: '하카타', lat: 33.59, lon: 130.4, year: 1274, memo: '', createdAt: now() }], routes: [], updatedAt: now() };

  it('학생은 열린 세션에 자기 문서(세션당 1개)를 만들고 갱신할 수 있다', async () => {
    const db = ctx(S7).firestore();
    await assertSucceeds(setDoc(doc(db, 'student_work', 'sess_open_7'), work));
    await assertSucceeds(updateDoc(doc(db, 'student_work', 'sess_open_7'), { pins: [...work.pins, { ...work.pins[0], id: 'p2' }], updatedAt: now() }));
    await assertSucceeds(getDoc(doc(db, 'student_work', 'sess_open_7')));
  });
  it('문서 ID 규칙(sessionId_number)을 어기거나 남의 번호로는 쓸 수 없다', async () => {
    const db = ctx(S7).firestore();
    await assertFails(setDoc(doc(db, 'student_work', 'sess_open_8'), { ...work, number: 8 }));
    await assertFails(setDoc(doc(db, 'student_work', 'whatever'), work));
  });
  it('닫힌 세션·초안 세션에는 쓸 수 없다', async () => {
    const db = ctx(S7).firestore();
    await assertFails(setDoc(doc(db, 'student_work', 'sess_closed_7'), { ...work, sessionId: 'sess_closed' }));
    await assertFails(setDoc(doc(db, 'student_work', 'sess_draft_7'), { ...work, sessionId: 'sess_draft' }));
  });
  it('다른 학급 학생은 쓰거나 읽을 수 없다', async () => {
    const db = ctx(S_OTHER).firestore();
    await assertFails(setDoc(doc(db, 'student_work', 'sess_open_3'), { ...work, number: 3, uid: S_OTHER.uid }));
  });
  it('담당 교사는 학급 전체 기록을 실시간 조회할 수 있고 다른 교사는 못 한다', async () => {
    await setDoc(doc(ctx(S7).firestore(), 'student_work', 'sess_open_7'), work);
    await assertSucceeds(getDocs(query(collection(ctx(T1).firestore(), 'student_work'), where('classId', '==', CLASS_ID))));
    await assertFails(getDocs(query(collection(ctx(T2).firestore(), 'student_work'), where('classId', '==', CLASS_ID))));
    await assertFails(getDoc(doc(ctx(T2).firestore(), 'student_work', 'sess_open_7')));
  });
  it('핀 200개 초과 문서는 거부된다', async () => {
    const db = ctx(S7).firestore();
    const pins = Array.from({ length: 201 }, (_, i) => ({ id: `p${i}`, name: 'x', lat: 0, lon: 0, year: 0, memo: '', createdAt: 0 }));
    await assertFails(setDoc(doc(db, 'student_work', 'sess_open_7'), { ...work, pins }));
  });
});

// ── missions / submissions ───────────────────────────
describe('missions & submissions', () => {
  it('학생은 공개된 미션만 읽는다', async () => {
    const db = ctx(S7).firestore();
    await assertSucceeds(getDoc(doc(db, 'missions', 'm1')));
    await assertFails(getDoc(doc(db, 'missions', 'm_hidden')));
  });
  it('학생은 공개 미션에 자기 제출물을 만들고, 교사는 피드백만 쓸 수 있다', async () => {
    const sub = { missionId: 'm1', sessionId: 'sess_open', classId: CLASS_ID, number: 7, uid: S7.uid, answers: {}, pinIds: [], routeIds: [], status: 'submitted', submittedAt: now(), updatedAt: now() };
    await assertSucceeds(setDoc(doc(ctx(S7).firestore(), 'submissions', 'm1_7'), sub));
    await assertFails(setDoc(doc(ctx(S7).firestore(), 'submissions', 'm_hidden_7'), { ...sub, missionId: 'm_hidden' }));
    await assertSucceeds(updateDoc(doc(ctx(T1).firestore(), 'submissions', 'm1_7'), { feedback: '잘했어요', score: 5, reviewedAt: now() }));
    await assertFails(updateDoc(doc(ctx(T1).firestore(), 'submissions', 'm1_7'), { answers: { q1: '조작' } }));
    await assertFails(getDoc(doc(ctx(S_OTHER).firestore(), 'submissions', 'm1_7')));
  });
});

// ── teacher_overrides ────────────────────────────────
describe('teacher_overrides', () => {
  it('교사 수정본은 그 교사의 학급 학생에게만 보인다', async () => {
    await assertSucceeds(getDoc(doc(ctx(S7).firestore(), 'teacher_overrides', `${T1.uid}_figure_genghis_khan`)));
    await assertFails(getDoc(doc(ctx(S7).firestore(), 'teacher_overrides', `${T2.uid}_polity_goryeo`)));
    await assertSucceeds(getDocs(query(collection(ctx(S7).firestore(), 'teacher_overrides'), where('teacherId', '==', T1.uid))));
    await assertFails(getDoc(doc(ctx(T2).firestore(), 'teacher_overrides', `${T1.uid}_figure_genghis_khan`)));
  });
  it('교사는 자기 명의·ID 규칙을 지킨 수정본만 만들 수 있다', async () => {
    const db = ctx(T1).firestore();
    await assertSucceeds(setDoc(doc(db, 'teacher_overrides', `${T1.uid}_polity_goryeo`), { teacherId: T1.uid, kind: 'polity', targetId: 'goryeo', op: 'edit', data: {}, updatedAt: now() }));
    await assertFails(setDoc(doc(db, 'teacher_overrides', `${T1.uid}_polity_joseon`), { teacherId: T2.uid, kind: 'polity', targetId: 'joseon', op: 'edit', data: {}, updatedAt: now() }));
    await assertFails(setDoc(doc(db, 'teacher_overrides', 'random_id'), { teacherId: T1.uid, kind: 'polity', targetId: 'joseon', op: 'edit', data: {}, updatedAt: now() }));
  });
});

// ── admins / data_reviews ────────────────────────────
describe('admins & data_reviews', () => {
  it('관리자 여부는 admins/{uid} 문서로 판별하며 본인만 조회 가능', async () => {
    await assertSucceeds(getDoc(doc(ctx(ADMIN).firestore(), 'admins', ADMIN.uid)));
    await assertSucceeds(getDoc(doc(ctx(T1).firestore(), 'admins', T1.uid))); // 없음(존재하지 않음) 확인용 읽기는 허용
    await assertFails(getDoc(doc(ctx(T1).firestore(), 'admins', ADMIN.uid)));
    await assertFails(setDoc(doc(ctx(T1).firestore(), 'admins', T1.uid), { grantedBy: 'self', createdAt: now() }));
  });
  it('검수 상태는 관리자만 쓰고 교사는 읽기만 한다', async () => {
    const review = { kind: 'polity', itemId: 'goryeo', status: 'approved', note: '확인', reviewerUid: ADMIN.uid, updatedAt: now(), history: [] };
    await assertSucceeds(setDoc(doc(ctx(ADMIN).firestore(), 'data_reviews', 'polity_goryeo'), review));
    await assertFails(setDoc(doc(ctx(T1).firestore(), 'data_reviews', 'polity_joseon'), { ...review, itemId: 'joseon', reviewerUid: T1.uid }));
    await assertSucceeds(getDoc(doc(ctx(T1).firestore(), 'data_reviews', 'polity_goryeo')));
    await assertFails(getDoc(doc(ctx(S7).firestore(), 'data_reviews', 'polity_goryeo')));
  });
  it('정의되지 않은 컬렉션은 모두 거부', async () => {
    await assertFails(setDoc(doc(ctx(ADMIN).firestore(), 'random', 'x'), { a: 1 }));
    await assertFails(getDoc(doc(ctx(ADMIN).firestore(), 'random', 'x')));
  });
});
