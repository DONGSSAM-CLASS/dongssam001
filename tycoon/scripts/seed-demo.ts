/**
 * 데모 학급 시드 스크립트 (에뮬레이터 전용).
 *
 *   npm run seed
 *
 * Admin SDK 는 Security Rules 를 우회하므로 이 스크립트는 규칙 검증 대상이 아닙니다.
 * 실제 앱이 만드는 것과 똑같은 모양의 문서를 심어, 바로 시연할 수 있게 합니다.
 */
import { cert, initializeApp } from 'firebase-admin/app';
import { FieldValue, getFirestore } from 'firebase-admin/firestore';
import { MINISTRY_TEMPLATE } from '../src/data/ministryTemplate';
import { DEFAULT_ECONOMY } from '../src/types';

process.env.FIRESTORE_EMULATOR_HOST ??= '127.0.0.1:8180';
process.env.FIREBASE_AUTH_EMULATOR_HOST ??= '127.0.0.1:9399';

const PROJECT_ID = process.env.GCLOUD_PROJECT ?? 'demo-tycoon';
initializeApp(
  process.env.GOOGLE_APPLICATION_CREDENTIALS
    ? { credential: cert(process.env.GOOGLE_APPLICATION_CREDENTIALS), projectId: PROJECT_ID }
    : { projectId: PROJECT_ID },
);
const db = getFirestore();

const CLASS_ID = 'demo-class';
const CLASS_CODE = 'DEMO24';
const AUTH_PREFIX = CLASS_CODE.toLowerCase();
const TEACHER_UID = 'demo-teacher';

const NAMES = [
  '김서준', '이하은', '박도윤', '최지우', '정시우', '강서연', '조하준', '윤예린', '장주원', '임수아',
  '한지호', '오유진', '서건우', '신다은', '권민재', '황서윤', '안준호', '송채원', '류현우', '홍소율',
  '전지훈', '문나윤', '배승현', '백가은', '노태윤',
];

function pad(n: number) { return String(n).padStart(2, '0'); }

async function main() {
  console.log(`데모 학급을 만듭니다 → 프로젝트 ${PROJECT_ID}`);

  await db.recursiveDelete(db.collection('classes').doc(CLASS_ID)).catch(() => undefined);

  await db.doc(`classes/${CLASS_ID}`).set({
    name: '2학년 4반 (데모)',
    teacherId: TEACHER_UID,
    classCode: CLASS_CODE,
    authPrefix: AUTH_PREFIX,
    allowNegativeBalance: false,
    createdAt: FieldValue.serverTimestamp(),
  });
  await db.doc(`classCodes/${CLASS_CODE}`).set({
    classId: CLASS_ID, teacherId: TEACHER_UID, authPrefix: AUTH_PREFIX,
    generations: Object.fromEntries(NAMES.map((_, i) => [pad(i + 1), 0])),
  });
  await db.doc(`classes/${CLASS_ID}/settings/economy`).set(DEFAULT_ECONOMY);

  const batch = db.batch();
  for (const id of ['MINT', 'TREASURY']) {
    batch.set(db.doc(`classes/${CLASS_ID}/accounts/${id}`), {
      type: 'SYSTEM', ownerNumber: null, balance: 0, lastTxId: null,
      updatedAt: FieldValue.serverTimestamp(),
    });
  }
  for (const { id, ...ministry } of MINISTRY_TEMPLATE) {
    batch.set(db.doc(`classes/${CLASS_ID}/ministries/${id}`), ministry);
  }
  NAMES.forEach((name, index) => {
    const number = pad(index + 1);
    // 1번은 기획재정부 장관, 2·3번은 학급회장(국무총리·국회의장)으로 시연용 배정
    const roles = index === 0 ? ['FINANCE_MINISTER']
      : index === 1 ? ['PRIME_MINISTER', 'MINISTER']
      : index === 2 ? ['SPEAKER', 'MINISTER']
      : index < 14 ? ['MINISTER'] : [];
    batch.set(db.doc(`classes/${CLASS_ID}/students/${number}`), {
      number, name, roles,
      ministryId: index < 14 ? MINISTRY_TEMPLATE[index % MINISTRY_TEMPLATE.length].id : null,
      creditScore: 1000, debts: 0, uid: null,
    });
    batch.set(db.doc(`classes/${CLASS_ID}/roster/${number}`), {
      number, name, pin: pad(index + 1) + '00'.slice(0, 2), authGeneration: 0,
      updatedAt: FieldValue.serverTimestamp(),
    });
    batch.set(db.doc(`classes/${CLASS_ID}/accounts/S${number}`), {
      type: 'STUDENT', ownerNumber: number, balance: 0, lastTxId: null,
      updatedAt: FieldValue.serverTimestamp(),
    });
  });
  await batch.commit();

  // 국고 발행 20만 코인 — 앱과 똑같이 복식부기로 기록합니다.
  await moveCoins('MINT', 'MINT', 'TREASURY', 200000, '학기 초 국고 발행');

  console.log(`완료. 학급 코드 ${CLASS_CODE}, 학생 ${NAMES.length}명, 부처 ${MINISTRY_TEMPLATE.length}개.`);
  console.log('학생 로그인 예시 → 코드 DEMO24 / 번호 1 / PIN 0100');
}

async function moveCoins(type: string, from: string, to: string, amount: number, reason: string) {
  const txRef = db.collection(`classes/${CLASS_ID}/transactions`).doc();
  await db.runTransaction(async (t) => {
    const fromRef = db.doc(`classes/${CLASS_ID}/accounts/${from}`);
    const toRef = db.doc(`classes/${CLASS_ID}/accounts/${to}`);
    const [f, g] = await t.getAll(fromRef, toRef);
    t.set(txRef, {
      type, fromAccount: from, toAccount: to, amount, reason,
      actorUid: TEACHER_UID, refDoc: null, payrollMonth: null,
      createdAt: FieldValue.serverTimestamp(),
    });
    t.update(fromRef, { balance: (f.data()!.balance as number) - amount, lastTxId: txRef.id, updatedAt: FieldValue.serverTimestamp() });
    t.update(toRef, { balance: (g.data()!.balance as number) + amount, lastTxId: txRef.id, updatedAt: FieldValue.serverTimestamp() });
  });
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
