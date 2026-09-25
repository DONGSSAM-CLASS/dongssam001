/**
 * Firestore 보안 규칙 테스트 (Firebase 에뮬레이터)
 *   npm run test:rules
 * 교사/학생/다른 교사/다른 학급 학생이 할 수 있는 일과 없는 일을 모두 확인한다.
 */
import { readFileSync } from 'node:fs';
import { afterAll, beforeAll, beforeEach, describe, it } from 'vitest';
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
  type RulesTestEnvironment,
} from '@firebase/rules-unit-testing';
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  writeBatch,
  arrayUnion,
  setLogLevel,
  Timestamp,
  type Firestore,
} from 'firebase/firestore';
import { studentDocId } from '../src/lib/hash';

let env: RulesTestEnvironment;

const TEACHER = 'teacherA';
const OTHER_TEACHER = 'teacherB';
const STUDENT = 'anonStudent1';
const STUDENT2 = 'anonStudent2';
const NEW_DEVICE = 'anonStudent1-newDevice';
const OUTSIDER = 'anonOutsider';

const CLASS = 'classA';
const CODE = 'K7MPQ2';
const PIN = '2580';

function teacherDb(uid = TEACHER): Firestore {
  return env.authenticatedContext(uid, { firebase: { sign_in_provider: 'google.com' } }).firestore() as unknown as Firestore;
}
function anonDb(uid: string): Firestore {
  return env.authenticatedContext(uid, { firebase: { sign_in_provider: 'anonymous' } }).firestore() as unknown as Firestore;
}
function guestDb(): Firestore {
  return env.unauthenticatedContext().firestore() as unknown as Firestore;
}

/** 교사가 학급을 만든다 (앱과 같은 방식: 학급 + 코드를 한 번에) */
async function createClass(db: Firestore, classId = CLASS, code = CODE, uid = TEACHER) {
  const b = writeBatch(db);
  b.set(doc(db, 'classes', classId), {
    name: '2학년 3반',
    code,
    teacherUid: uid,
    unlocked: { ch1: false, ch2: false, ch3: false, finale: false },
    showDistribution: false,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  b.set(doc(db, 'classCodes', code), { classId, className: '2학년 3반', teacherUid: uid, createdAt: serverTimestamp() });
  return b.commit();
}

function freshStudent(uid: string, number: number, nickname = '파란연필') {
  return {
    uid,
    number,
    nickname,
    progress: {},
    choices: {},
    emotions: {},
    answers: {},
    cards: [],
    declaration: null,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };
}

/** 학생이 입장한다 (앱과 같은 방식: 기록 + 번호 자리 + 멤버) */
async function join(db: Firestore, uid: string, number: number, pin = PIN, classId = CLASS) {
  const sid = await studentDocId(classId, number, pin);
  const b = writeBatch(db);
  b.set(doc(db, 'classes', classId, 'students', sid), freshStudent(uid, number));
  b.set(doc(db, 'classes', classId, 'seats', String(number)), { studentId: sid });
  b.set(doc(db, 'classes', classId, 'members', uid), { studentId: sid, number, joinedAt: serverTimestamp() });
  await b.commit();
  return sid;
}

beforeAll(async () => {
  setLogLevel('silent'); // 일부러 거부되는 요청의 로그를 숨긴다
  env = await initializeTestEnvironment({
    projectId: 'demo-cold-war-witness',
    firestore: { rules: readFileSync('firestore.rules', 'utf8'), host: '127.0.0.1', port: 8080 },
  });
});
afterAll(async () => {
  await env?.cleanup();
});
beforeEach(async () => {
  await env.clearFirestore();
  await createClass(teacherDb());
});

describe('학급과 학급 코드', () => {
  it('교사는 자기 학급을 만들고, 읽고, 목록으로 볼 수 있다', async () => {
    const t = teacherDb();
    await assertSucceeds(getDoc(doc(t, 'classes', CLASS)));
    await assertSucceeds(getDocs(query(collection(t, 'classes'), where('teacherUid', '==', TEACHER))));
  });

  it('다른 교사는 남의 학급을 읽거나 목록으로 볼 수 없다', async () => {
    const o = teacherDb(OTHER_TEACHER);
    await assertFails(getDoc(doc(o, 'classes', CLASS)));
    await assertFails(getDocs(query(collection(o, 'classes'), where('teacherUid', '==', TEACHER))));
    await assertFails(getDocs(collection(o, 'classes')));
  });

  it('익명 학생은 학급을 만들 수 없다', async () => {
    await assertFails(createClass(anonDb(STUDENT), 'classX', 'ABCDEF', STUDENT));
  });

  it('학급 코드: 로그인한 사람은 한 건 조회만, 목록 조회는 누구도 못 한다', async () => {
    await assertSucceeds(getDoc(doc(anonDb(STUDENT), 'classCodes', CODE)));
    await assertFails(getDoc(doc(guestDb(), 'classCodes', CODE)));
    await assertFails(getDocs(collection(anonDb(STUDENT), 'classCodes')));
    await assertFails(getDocs(collection(teacherDb(), 'classCodes')));
  });

  it('이미 있는 학급 코드는 다른 교사가 덮어쓸 수 없다', async () => {
    await assertFails(createClass(teacherDb(OTHER_TEACHER), 'classB', CODE, OTHER_TEACHER));
  });

  it('잘못된 모양의 코드(헷갈리는 글자 O, 0 포함)는 만들 수 없다', async () => {
    await assertFails(createClass(teacherDb(), 'classC', 'AB0DEO'));
  });

  it('교사는 챕터 잠금·분포 공개만 바꿀 수 있고, 학급 주인은 바꿀 수 없다', async () => {
    const t = teacherDb();
    await assertSucceeds(updateDoc(doc(t, 'classes', CLASS), { 'unlocked.ch1': true, updatedAt: serverTimestamp() }));
    await assertSucceeds(updateDoc(doc(t, 'classes', CLASS), { showDistribution: true, updatedAt: serverTimestamp() }));
    await assertFails(updateDoc(doc(t, 'classes', CLASS), { teacherUid: OTHER_TEACHER, updatedAt: serverTimestamp() }));
    await assertFails(updateDoc(doc(t, 'classes', CLASS), { 'unlocked.ch9': true, updatedAt: serverTimestamp() }));
    await assertFails(updateDoc(doc(teacherDb(OTHER_TEACHER), 'classes', CLASS), { 'unlocked.ch1': true, updatedAt: serverTimestamp() }));
  });

  it('학생은 학급 설정을 바꿀 수 없다', async () => {
    const s = anonDb(STUDENT);
    await join(s, STUDENT, 7);
    await assertFails(updateDoc(doc(s, 'classes', CLASS), { 'unlocked.ch1': true, updatedAt: serverTimestamp() }));
  });
});

describe('학생 입장', () => {
  it('처음 입장: 기록·번호 자리·멤버를 한 번에 만들고, 학급 문서와 자기 기록을 읽을 수 있다', async () => {
    const s = anonDb(STUDENT);
    const sid = await assertSucceeds(join(s, STUDENT, 7));
    await assertSucceeds(getDoc(doc(s, 'classes', CLASS)));
    await assertSucceeds(getDoc(doc(s, 'classes', CLASS, 'students', sid)));
  });

  it('입장하지 않은 익명 사용자는 코드를 알아도 학급 문서를 읽을 수 없다', async () => {
    await assertFails(getDoc(doc(anonDb(OUTSIDER), 'classes', CLASS)));
  });

  it('같은 번호로 두 번째 학생은 들어올 수 없다', async () => {
    await join(anonDb(STUDENT), STUDENT, 7);
    await assertFails(join(anonDb(STUDENT2), STUDENT2, 7, '1111'));
  });

  it('번호 자리 없이 기록만 만들 수는 없다', async () => {
    const s = anonDb(STUDENT);
    const sid = await studentDocId(CLASS, 5, PIN);
    await assertFails(setDoc(doc(s, 'classes', CLASS, 'students', sid), freshStudent(STUDENT, 5)));
  });

  it('입장할 때 미리 채운 기록(카드·선택)은 만들 수 없다', async () => {
    const s = anonDb(STUDENT);
    const sid = await studentDocId(CLASS, 8, PIN);
    const b = writeBatch(s);
    b.set(doc(s, 'classes', CLASS, 'students', sid), { ...freshStudent(STUDENT, 8), cards: ['privacy'] });
    b.set(doc(s, 'classes', CLASS, 'seats', '8'), { studentId: sid });
    await assertFails(b.commit());
  });

  it('닉네임이 10자를 넘거나, 없는 학급이면 입장할 수 없다', async () => {
    const s = anonDb(STUDENT);
    const sid = await studentDocId(CLASS, 9, PIN);
    const b = writeBatch(s);
    b.set(doc(s, 'classes', CLASS, 'students', sid), freshStudent(STUDENT, 9, '열한글자가넘는닉네임이야'));
    b.set(doc(s, 'classes', CLASS, 'seats', '9'), { studentId: sid });
    await assertFails(b.commit());
    await assertFails(join(s, STUDENT, 3, PIN, 'noSuchClass'));
  });

  it('남의 uid 로 기록을 만들 수 없다', async () => {
    const s = anonDb(STUDENT);
    const sid = await studentDocId(CLASS, 11, PIN);
    const b = writeBatch(s);
    b.set(doc(s, 'classes', CLASS, 'students', sid), freshStudent(STUDENT2, 11));
    b.set(doc(s, 'classes', CLASS, 'seats', '11'), { studentId: sid });
    await assertFails(b.commit());
  });

  it('교사 계정으로는 학생처럼 입장할 수 없다', async () => {
    await assertFails(join(teacherDb(), TEACHER, 12));
  });
});

describe('학생 기록 읽기·쓰기', () => {
  let sid: string;
  let s: Firestore;
  beforeEach(async () => {
    s = anonDb(STUDENT);
    sid = await join(s, STUDENT, 7);
  });
  const ref = (db: Firestore) => doc(db, 'classes', CLASS, 'students', sid);

  it('다른 학생은 내 기록을 읽거나 쓸 수 없고, 학생 목록도 볼 수 없다', async () => {
    const o = anonDb(STUDENT2);
    await join(o, STUDENT2, 8, '1111');
    await assertFails(getDoc(ref(o)));
    await assertFails(updateDoc(ref(o), { 'answers.ch1-q1': '낙서', updatedAt: serverTimestamp() }));
    await assertFails(getDocs(collection(o, 'classes', CLASS, 'students')));
    await assertFails(getDocs(collection(o, 'classes', CLASS, 'members')));
    await assertFails(getDoc(doc(o, 'classes', CLASS, 'seats', '7')));
  });

  it('장면 저장: 감정 + 선택 + 진행 단계', async () => {
    await assertSucceeds(
      updateDoc(ref(s), {
        'emotions.ch1-s1': 'anxious',
        'choices.ch1-s1': 'b',
        'progress.ch1': 's1',
        updatedAt: serverTimestamp(),
      }),
    );
  });

  it('한 번 고른 선택·감정은 바꾸거나 지울 수 없다', async () => {
    await updateDoc(ref(s), { 'emotions.ch1-s1': 'anxious', 'choices.ch1-s1': 'b', updatedAt: serverTimestamp() });
    await assertFails(updateDoc(ref(s), { 'choices.ch1-s1': 'a', updatedAt: serverTimestamp() }));
    await assertFails(updateDoc(ref(s), { 'emotions.ch1-s1': 'calm', updatedAt: serverTimestamp() }));
    await assertFails(updateDoc(ref(s), { choices: {}, updatedAt: serverTimestamp() }));
  });

  it('없는 장면·선택지·감정·단계 값은 쓸 수 없다', async () => {
    await assertFails(updateDoc(ref(s), { 'choices.ch9-s1': 'a', updatedAt: serverTimestamp() }));
    await assertFails(updateDoc(ref(s), { 'choices.ch1-s2': 'd', updatedAt: serverTimestamp() }));
    await assertFails(updateDoc(ref(s), { 'emotions.ch1-s2': 'happy', updatedAt: serverTimestamp() }));
    await assertFails(updateDoc(ref(s), { 'progress.ch1': 's9', updatedAt: serverTimestamp() }));
  });

  it('서술형 답변은 500자까지만', async () => {
    await assertSucceeds(updateDoc(ref(s), { 'answers.ch1-q1': '가'.repeat(500), updatedAt: serverTimestamp() }));
    await assertFails(updateDoc(ref(s), { 'answers.ch1-q2': '가'.repeat(501), updatedAt: serverTimestamp() }));
    await assertFails(updateDoc(ref(s), { 'answers.hack': '가', updatedAt: serverTimestamp() }));
    await assertFails(updateDoc(ref(s), { 'answers.ch1-q2': 123, updatedAt: serverTimestamp() }));
  });

  it('원칙 카드는 7개 원칙 id 만', async () => {
    await assertSucceeds(updateDoc(ref(s), { cards: arrayUnion('privacy', 'humanCentric'), 'progress.ch1': 'wrapup', updatedAt: serverTimestamp() }));
    await assertFails(updateDoc(ref(s), { cards: arrayUnion('superPower'), updatedAt: serverTimestamp() }));
  });

  it('선언문: 길이 제한과 제출 시각 검증', async () => {
    const good = { keep: '프라이버시 보호', principleId: 'privacy', era: '슈타지의 감시', lesson: '믿음이 깨진다는 것', free: '' };
    await assertSucceeds(updateDoc(ref(s), { declaration: { ...good, submittedAt: serverTimestamp() }, updatedAt: serverTimestamp() }));
    await assertFails(updateDoc(ref(s), { declaration: { ...good, free: '가'.repeat(301), submittedAt: serverTimestamp() }, updatedAt: serverTimestamp() }));
    await assertFails(updateDoc(ref(s), { declaration: { ...good, keep: '', submittedAt: serverTimestamp() }, updatedAt: serverTimestamp() }));
    await assertFails(updateDoc(ref(s), { declaration: { ...good, principleId: 'nope', submittedAt: serverTimestamp() }, updatedAt: serverTimestamp() }));
    await assertFails(
      updateDoc(ref(s), { declaration: { ...good, submittedAt: Timestamp.fromDate(new Date(2000, 0, 1)) }, updatedAt: serverTimestamp() }),
    );
  });

  it('번호·닉네임·uid·만든 시각은 스스로 바꿀 수 없고, updatedAt 은 서버 시각이어야 한다', async () => {
    await assertFails(updateDoc(ref(s), { number: 1, updatedAt: serverTimestamp() }));
    await assertFails(updateDoc(ref(s), { nickname: '바꿈', updatedAt: serverTimestamp() }));
    await assertFails(updateDoc(ref(s), { 'answers.ch1-q1': '안녕', updatedAt: Timestamp.fromDate(new Date(2000, 0, 1)) }));
    await assertFails(updateDoc(ref(s), { 'answers.ch1-q1': '안녕', hacked: true, updatedAt: serverTimestamp() }));
  });

  it('학생은 자기 기록을 지울 수 없다', async () => {
    await assertFails(deleteDoc(ref(s)));
  });
});

describe('다른 기기에서 이어 하기 (PIN)', () => {
  let sid: string;
  beforeEach(async () => {
    sid = await join(anonDb(STUDENT), STUDENT, 7);
  });

  async function recover(db: Firestore, uid: string, pin: string, number = 7) {
    const id = await studentDocId(CLASS, number, pin);
    const b = writeBatch(db);
    b.update(doc(db, 'classes', CLASS, 'students', id), { uid, updatedAt: serverTimestamp() });
    b.set(doc(db, 'classes', CLASS, 'members', uid), { studentId: id, number, joinedAt: serverTimestamp() });
    return b.commit();
  }

  it('맞는 PIN: 새 기기로 옮겨 오고, 이제 새 기기가 읽고 쓴다', async () => {
    const n = anonDb(NEW_DEVICE);
    await assertSucceeds(recover(n, NEW_DEVICE, PIN));
    await assertSucceeds(getDoc(doc(n, 'classes', CLASS, 'students', sid)));
    await assertSucceeds(getDoc(doc(n, 'classes', CLASS)));
    // 옛 기기는 더 이상 읽을 수 없다
    await assertFails(getDoc(doc(anonDb(STUDENT), 'classes', CLASS, 'students', sid)));
  });

  it('틀린 PIN 으로는 옮길 수 없다', async () => {
    await assertFails(recover(anonDb(NEW_DEVICE), NEW_DEVICE, '0000'));
  });

  it('옮기면서 다른 필드를 함께 바꿀 수는 없다', async () => {
    const n = anonDb(NEW_DEVICE);
    await assertFails(updateDoc(doc(n, 'classes', CLASS, 'students', sid), { uid: NEW_DEVICE, nickname: '가로채기', updatedAt: serverTimestamp() }));
    await assertFails(updateDoc(doc(n, 'classes', CLASS, 'students', sid), { uid: STUDENT2, updatedAt: serverTimestamp() }));
  });

  it('멤버 문서는 자기 기록을 가리킬 때만 만들 수 있다', async () => {
    const o = anonDb(OUTSIDER);
    await assertFails(setDoc(doc(o, 'classes', CLASS, 'members', OUTSIDER), { studentId: sid, number: 7, joinedAt: serverTimestamp() }));
    await assertFails(setDoc(doc(o, 'classes', CLASS, 'members', STUDENT), { studentId: sid, number: 7, joinedAt: serverTimestamp() }));
  });
});

describe('교사의 학생 데이터 관리', () => {
  let sid: string;
  beforeEach(async () => {
    sid = await join(anonDb(STUDENT), STUDENT, 7);
  });

  it('교사는 자기 학급 학생 기록·자리·멤버를 읽을 수 있다', async () => {
    const t = teacherDb();
    await assertSucceeds(getDocs(collection(t, 'classes', CLASS, 'students')));
    await assertSucceeds(getDocs(collection(t, 'classes', CLASS, 'seats')));
    await assertSucceeds(getDocs(collection(t, 'classes', CLASS, 'members')));
  });

  it('다른 교사는 남의 학급 학생 기록을 읽을 수 없다', async () => {
    const o = teacherDb(OTHER_TEACHER);
    await assertFails(getDocs(collection(o, 'classes', CLASS, 'students')));
    await assertFails(getDoc(doc(o, 'classes', CLASS, 'students', sid)));
  });

  it('교사는 학생의 답변을 고칠 수 없다', async () => {
    await assertFails(updateDoc(doc(teacherDb(), 'classes', CLASS, 'students', sid), { 'answers.ch1-q1': '교사가 씀', updatedAt: serverTimestamp() }));
  });

  it('PIN 초기화: 새 주소로 기록을 옮기고 자리를 바꾼 뒤, 학생이 임시 PIN 으로 들어온다', async () => {
    const t = teacherDb();
    const snap = await getDoc(doc(t, 'classes', CLASS, 'students', sid));
    const data = snap.data()!;
    const newSid = await studentDocId(CLASS, 7, '4321');
    const b = writeBatch(t);
    b.set(doc(t, 'classes', CLASS, 'students', newSid), { ...data, updatedAt: serverTimestamp() });
    b.delete(doc(t, 'classes', CLASS, 'students', sid));
    b.set(doc(t, 'classes', CLASS, 'seats', '7'), { studentId: newSid });
    await assertSucceeds(b.commit());

    const n = anonDb(NEW_DEVICE);
    const r = writeBatch(n);
    r.update(doc(n, 'classes', CLASS, 'students', newSid), { uid: NEW_DEVICE, updatedAt: serverTimestamp() });
    r.set(doc(n, 'classes', CLASS, 'members', NEW_DEVICE), { studentId: newSid, number: 7, joinedAt: serverTimestamp() });
    await assertSucceeds(r.commit());
  });

  it('다른 교사는 PIN 초기화를 할 수 없다', async () => {
    const o = teacherDb(OTHER_TEACHER);
    const newSid = await studentDocId(CLASS, 7, '4321');
    const b = writeBatch(o);
    b.set(doc(o, 'classes', CLASS, 'students', newSid), freshStudent(STUDENT, 7));
    b.set(doc(o, 'classes', CLASS, 'seats', '7'), { studentId: newSid });
    await assertFails(b.commit());
  });

  it('학급 삭제: 교사는 학생·자리·멤버·코드·학급을 모두 지울 수 있고, 다른 교사는 못 한다', async () => {
    const o = teacherDb(OTHER_TEACHER);
    await assertFails(deleteDoc(doc(o, 'classes', CLASS, 'students', sid)));
    await assertFails(deleteDoc(doc(o, 'classCodes', CODE)));
    await assertFails(deleteDoc(doc(o, 'classes', CLASS)));

    const t = teacherDb();
    await assertSucceeds(deleteDoc(doc(t, 'classes', CLASS, 'students', sid)));
    await assertSucceeds(deleteDoc(doc(t, 'classes', CLASS, 'seats', '7')));
    await assertSucceeds(deleteDoc(doc(t, 'classes', CLASS, 'members', STUDENT)));
    await assertSucceeds(deleteDoc(doc(t, 'classCodes', CODE)));
    await assertSucceeds(deleteDoc(doc(t, 'classes', CLASS)));
  });
});

describe('선택 분포 공개 · 하이라이트', () => {
  beforeEach(async () => {
    await join(anonDb(STUDENT), STUDENT, 7);
  });
  const stats = { choices: { 'ch1-s1': { a: 3, b: 10, c: 2 } }, updatedAt: serverTimestamp() };

  it('교사만 분포를 쓸 수 있다', async () => {
    await assertSucceeds(setDoc(doc(teacherDb(), 'classes', CLASS, 'public', 'stats'), stats));
    await assertFails(setDoc(doc(anonDb(STUDENT), 'classes', CLASS, 'public', 'stats'), stats));
    await assertFails(setDoc(doc(teacherDb(), 'classes', CLASS, 'public', 'stats'), { ...stats, names: ['7번'] }));
  });

  it('학생은 공개가 켜져 있을 때만 분포를 읽는다', async () => {
    await setDoc(doc(teacherDb(), 'classes', CLASS, 'public', 'stats'), stats);
    const s = anonDb(STUDENT);
    await assertFails(getDoc(doc(s, 'classes', CLASS, 'public', 'stats')));
    await updateDoc(doc(teacherDb(), 'classes', CLASS), { showDistribution: true, updatedAt: serverTimestamp() });
    await assertSucceeds(getDoc(doc(s, 'classes', CLASS, 'public', 'stats')));
    // 입장하지 않은 사람은 공개여도 못 읽는다
    await assertFails(getDoc(doc(anonDb(OUTSIDER), 'classes', CLASS, 'public', 'stats')));
  });

  it('하이라이트는 교사만 읽고 쓴다', async () => {
    const item = { items: { '7:ch1-q1': true }, updatedAt: serverTimestamp() };
    await assertSucceeds(setDoc(doc(teacherDb(), 'classes', CLASS, 'teacherOnly', 'highlights'), item));
    await assertFails(getDoc(doc(anonDb(STUDENT), 'classes', CLASS, 'teacherOnly', 'highlights')));
    await assertFails(setDoc(doc(anonDb(STUDENT), 'classes', CLASS, 'teacherOnly', 'highlights'), item));
    await assertFails(getDoc(doc(teacherDb(OTHER_TEACHER), 'classes', CLASS, 'teacherOnly', 'highlights')));
  });
});

describe('규칙에 없는 경로', () => {
  it('아무도 읽고 쓸 수 없다', async () => {
    await assertFails(setDoc(doc(teacherDb(), 'secrets', 'x'), { a: 1 }));
    await assertFails(getDoc(doc(anonDb(STUDENT), 'secrets', 'x')));
  });
});
