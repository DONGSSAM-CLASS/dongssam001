/**
 * 에뮬레이터 시드 — 교사 1명 · 학급 1개(코드 DEMO24) · 열린 세션 1개 · 관리자 권한을 만든다.
 * 실행: npm run emulators (다른 터미널) → npm run seed
 * 교사 로그인: teacher@example.com / password123 (에뮬레이터 전용, 실제 프로젝트에 쓰지 마세요)
 *
 * 주의: 세션 문서는 학급 문서가 "이미 존재해야" 만들 수 있다(규칙의 ownsClass 는 get() 을 쓰므로
 * 같은 배치 안에서 갓 만든 학급을 보지 못한다). 그래서 학급/코드 → 세션 순서로 나누어 커밋한다.
 * 재실행해도 안전하도록 이미 있는 문서는 건드리지 않는다(규칙상 createdAt 은 수정할 수 없음).
 */
import { initializeApp } from 'firebase/app';
import { connectAuthEmulator, createUserWithEmailAndPassword, getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import { connectFirestoreEmulator, doc, getDoc, getFirestore, serverTimestamp, setDoc, writeBatch } from 'firebase/firestore';

const host = process.env.EMULATOR_HOST ?? '127.0.0.1';
const app = initializeApp({ apiKey: 'demo-api-key', projectId: 'demo-history-globe', appId: '1:demo:web:demo' });
const auth = getAuth(app);
const db = getFirestore(app);
connectAuthEmulator(auth, `http://${host}:9099`, { disableWarnings: true });
connectFirestoreEmulator(db, host, 8080);

const EMAIL = 'teacher@example.com';
const PASSWORD = 'password123';
const CODE = 'DEMO24';
const CLASS_ID = 'demo_class';
const SESSION_ID = 'demo_session';

async function ensure(path: [string, string], data: Record<string, unknown>, label: string) {
  const ref = doc(db, path[0], path[1]);
  const snap = await getDoc(ref).catch(() => null);
  if (snap?.exists()) {
    console.log(`· ${label} 이미 있음 (건너뜀)`);
    return false;
  }
  await setDoc(ref, data);
  console.log(`✔ ${label} 생성`);
  return true;
}

async function main() {
  let user;
  try {
    user = (await createUserWithEmailAndPassword(auth, EMAIL, PASSWORD)).user;
  } catch {
    user = (await signInWithEmailAndPassword(auth, EMAIL, PASSWORD)).user;
  }
  const uid = user.uid;

  await ensure(['users', uid], {
    role: 'teacher', displayName: '데모 교사', email: EMAIL,
    schoolLevel: '중학교', schoolName: '히스토리중학교', subjects: ['역사①'], createdAt: serverTimestamp(),
  }, '교사 프로필');

  // 1) 학급 + 학급코드 (class_codes 규칙은 getAfter 를 쓰므로 같은 배치에서 가능)
  const classSnap = await getDoc(doc(db, 'classes', CLASS_ID)).catch(() => null);
  if (!classSnap?.exists()) {
    const b = writeBatch(db);
    b.set(doc(db, 'classes', CLASS_ID), {
      teacherId: uid, name: '2학년 3반', code: CODE, authPrefix: CODE,
      schoolLevel: '중학교', subject: '역사①', archived: false,
      settings: { walkKmPerDay: 30, horseKmPerDay: 60, sailKmPerDay: 120 },
      createdAt: serverTimestamp(), codeUpdatedAt: serverTimestamp(),
    });
    b.set(doc(db, 'class_codes', CODE), { classId: CLASS_ID, teacherId: uid, authPrefix: CODE, active: true, resets: {} });
    await b.commit();
    console.log('✔ 학급 + 학급코드 생성');
  } else {
    console.log('· 학급 이미 있음 (건너뜀)');
  }

  // 2) 세션 (학급이 존재한 뒤에만 생성 가능)
  await ensure(['sessions', SESSION_ID], {
    teacherId: uid, classId: CLASS_ID, title: '1200년의 세계 — 송·고려·몽골·십자군', status: 'open',
    yearRange: [1100, 1300], focusYear: 1200,
    layers: { polities: true, figures: true, places: true, routes: true, modernBorders: false },
    highlightPolities: ['goryeo', 'southern_song', 'jin_jurchen', 'mongol_empire', 'ayyubid', 'hre'],
    highlightFigures: ['genghis_khan', 'saladin', 'zhu_xi', 'choe_chungheon'],
    achievementStandards: ['[9역04-01]', '[9역03-03]'], worksheet: [],
    follow: { enabled: false, year: 1200, camera: { lat: 35, lon: 100, zoom: 2.6 }, updatedAt: serverTimestamp() },
    createdAt: serverTimestamp(), updatedAt: serverTimestamp(),
  }, '수업 세션(open)');

  // 관리자 지정은 규칙상 관리자만 가능 → 최초 1명은 REST 로 규칙을 우회해 기록 (에뮬레이터 전용)
  const res = await fetch(`http://${host}:8080/v1/projects/demo-history-globe/databases/(default)/documents/admins/${uid}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', Authorization: 'Bearer owner' },
    body: JSON.stringify({ fields: { grantedBy: { stringValue: 'seed' }, createdAt: { integerValue: String(Date.now()) } } }),
  });
  console.log(`\n교사 ${EMAIL} / ${PASSWORD} · 학급코드 ${CODE} · 세션 ${SESSION_ID}(open) · 관리자 ${res.ok ? 'OK' : 'FAIL ' + res.status}`);
  process.exit(0);
}
main().catch((e) => {
  console.error(e);
  process.exit(1);
});
