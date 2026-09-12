// ---------------------------------------------------------------------------
// firebase.js — Firebase 초기화 · 교사/학생 계정 · 학급 · 학습 기록
//
// 개인정보 원칙 (학교에서 그대로 쓸 수 있도록)
//   · 학생에게서 이메일·전화번호·실명을 받지 않는다.
//   · 학생 로그인은 <학급코드-출석번호>로 만든 '가상 이메일'을 쓴다.
//       예) ABC123-07@koreatime.local  →  실제로 메일이 오가지 않는 내부 식별자
//   · 화면에 보이는 이름은 학생이 직접 정하는 '별명'이다. 실명을 권하지 않는다.
//   · 교사만 이메일로 가입한다(비밀번호 찾기를 위해 필요).
//
// 비밀번호 재설정
//   무료(Spark) 요금제에서는 Cloud Functions 를 쓸 수 없어 교사가 학생 비밀번호를
//   직접 바꿔 줄 수 없다. 그래서 '세대(generation)' 방식을 쓴다.
//     교사가 [비밀번호 초기화] → 그 번호의 세대가 1 올라간다
//     → 학생은 같은 번호로 '다시 가입'하여 새 비밀번호를 정한다
//     → 학습 기록은 uid 가 아니라 (학급, 번호)로 저장되므로 그대로 이어진다.
//
// Firebase 설정이 없으면 '체험 모드'로 돌아간다(브라우저에만 저장, 학급 기능 없음).
// ---------------------------------------------------------------------------

const SDK = 'https://www.gstatic.com/firebasejs/10.14.1';
const STUDENT_DOMAIN = 'koreatime.local';

let app = null;
let auth = null;
let db = null;
let fb = null; // 불러온 SDK 함수 모음
let ready = false;

export const state = {
  mode: 'local', // 'cloud' | 'local'
  user: null, // { uid, role, ... }
  profile: null,
  error: null,
};

// ── 설정 읽기 ──────────────────────────────────────────────────────────
// 1순위: window.KOREA_TIME_FIREBASE (index.html 에서 주입)
// 2순위: firebase-config.js 파일
export async function loadConfig() {
  if (window.KOREA_TIME_FIREBASE && window.KOREA_TIME_FIREBASE.apiKey) {
    return window.KOREA_TIME_FIREBASE;
  }
  try {
    const mod = await import('./firebase-config.js');
    const cfg = mod.firebaseConfig || mod.default;
    if (cfg && cfg.apiKey && !String(cfg.apiKey).startsWith('여기에')) return cfg;
  } catch (_) {
    /* 설정 파일이 없으면 체험 모드 */
  }
  return null;
}

export async function initFirebase() {
  if (ready) return state.mode;
  const cfg = await loadConfig();
  if (!cfg) {
    state.mode = 'local';
    ready = true;
    return 'local';
  }
  try {
    const [appMod, authMod, fsMod] = await Promise.all([
      import(`${SDK}/firebase-app.js`),
      import(`${SDK}/firebase-auth.js`),
      import(`${SDK}/firebase-firestore.js`),
    ]);
    app = appMod.initializeApp(cfg);
    auth = authMod.getAuth(app);
    db = fsMod.getFirestore(app);
    fb = { ...authMod, ...fsMod };
    await authMod.setPersistence(auth, authMod.browserLocalPersistence).catch(() => {});
    state.mode = 'cloud';
  } catch (err) {
    console.warn('[KOREA TIME] Firebase 초기화 실패 — 체험 모드로 전환합니다.', err);
    state.mode = 'local';
    state.error = err && err.message;
  }
  ready = true;
  return state.mode;
}

export function isCloud() {
  return state.mode === 'cloud' && !!db;
}

export function onAuth(cb) {
  if (!isCloud()) {
    cb(null);
    return () => {};
  }
  return fb.onAuthStateChanged(auth, cb);
}

// ── 유틸 ───────────────────────────────────────────────────────────────
export function normalizeCode(code) {
  return String(code || '').trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
}

function studentEmail(code, number, generation) {
  const g = Number(generation) > 0 ? `-${generation}` : '';
  return `${normalizeCode(code).toLowerCase()}-${Number(number)}${g}@${STUDENT_DOMAIN}`;
}

function makeCode() {
  // 헷갈리는 글자(O/0, I/1)를 뺀 6자리
  const pool = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let s = '';
  for (let i = 0; i < 6; i++) s += pool[Math.floor(Math.random() * pool.length)];
  return s;
}

export function progressId(classId, number) {
  return `${classId}_${Number(number)}`;
}

const KOR_ERROR = {
  'auth/email-already-in-use': '이미 가입된 계정이에요. 로그인 화면에서 들어와 주세요.',
  'auth/invalid-email': '이메일 형식이 올바르지 않아요.',
  'auth/weak-password': '비밀번호는 6자 이상으로 정해 주세요.',
  'auth/wrong-password': '비밀번호가 달라요. 다시 확인해 주세요.',
  'auth/invalid-credential': '번호나 비밀번호가 맞지 않아요. 다시 확인해 주세요.',
  'auth/user-not-found': '아직 가입하지 않은 것 같아요. [처음 시작하기]로 가입해 주세요.',
  'auth/too-many-requests': '너무 여러 번 시도했어요. 잠시 뒤에 다시 해 주세요.',
  'auth/network-request-failed': '인터넷 연결이 불안정해요. 잠시 뒤 다시 시도해 주세요.',
};

export function friendlyError(err) {
  if (!err) return '알 수 없는 문제가 생겼어요.';
  const code = err.code || '';
  return KOR_ERROR[code] || err.message || '문제가 생겼어요. 다시 시도해 주세요.';
}

// ── 교사 ───────────────────────────────────────────────────────────────
export async function teacherSignUp(email, password, name) {
  const cred = await fb.createUserWithEmailAndPassword(auth, email.trim(), password);
  await fb.setDoc(fb.doc(db, 'teachers', cred.user.uid), {
    name: (name || '').trim() || '선생님',
    email: email.trim(),
    createdAt: fb.serverTimestamp(),
  });
  return cred.user;
}

export async function teacherSignIn(email, password) {
  const cred = await fb.signInWithEmailAndPassword(auth, email.trim(), password);
  return cred.user;
}

export async function sendTeacherReset(email) {
  await fb.sendPasswordResetEmail(auth, email.trim());
}

export async function getTeacher(uid) {
  const snap = await fb.getDoc(fb.doc(db, 'teachers', uid));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

export async function createClass(teacherUid, teacherName, className) {
  // 코드가 겹치지 않을 때까지 몇 번 시도한다
  for (let i = 0; i < 8; i++) {
    const code = makeCode();
    const exist = await fb.getDocs(
      fb.query(fb.collection(db, 'classes'), fb.where('code', '==', code), fb.limit(1))
    );
    if (!exist.empty) continue;
    const ref = await fb.addDoc(fb.collection(db, 'classes'), {
      code,
      name: (className || '').trim() || '우리 반',
      teacherId: teacherUid,
      teacherName: teacherName || '선생님',
      open: true,
      resets: {}, // { "7": 2 } → 7번 학생의 세대
      createdAt: fb.serverTimestamp(),
    });
    return { id: ref.id, code };
  }
  throw new Error('학급 코드를 만들지 못했어요. 다시 시도해 주세요.');
}

export async function listClasses(teacherUid) {
  const snap = await fb.getDocs(
    fb.query(fb.collection(db, 'classes'), fb.where('teacherId', '==', teacherUid))
  );
  return snap.docs
    .map((d) => ({ id: d.id, ...d.data() }))
    .sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
}

export async function setClassOpen(classId, open) {
  await fb.updateDoc(fb.doc(db, 'classes', classId), { open: !!open });
}

export async function deleteClass(classId) {
  await fb.deleteDoc(fb.doc(db, 'classes', classId));
}

export async function findClassByCode(code) {
  const c = normalizeCode(code);
  if (c.length !== 6) return null;
  const snap = await fb.getDocs(
    fb.query(fb.collection(db, 'classes'), fb.where('code', '==', c), fb.limit(1))
  );
  if (snap.empty) return null;
  const d = snap.docs[0];
  return { id: d.id, ...d.data() };
}

/** 교사가 학생의 비밀번호를 초기화한다 = 그 번호의 세대를 1 올린다. */
export async function resetStudentPassword(classId, number) {
  const ref = fb.doc(db, 'classes', classId);
  const snap = await fb.getDoc(ref);
  const resets = (snap.data() || {}).resets || {};
  const next = Number(resets[String(number)] || 0) + 1;
  await fb.updateDoc(ref, { [`resets.${number}`]: next });
  return next;
}

// ── 학생 ───────────────────────────────────────────────────────────────
export async function studentSignUp({ code, number, nickname, password, tier }) {
  const klass = await findClassByCode(code);
  if (!klass) throw new Error('그런 학급 코드가 없어요. 선생님께 다시 확인해 주세요.');
  if (klass.open === false) throw new Error('지금은 이 학급에 들어올 수 없어요. 선생님께 말씀드려 주세요.');

  const gen = Number((klass.resets || {})[String(number)] || 0);
  const email = studentEmail(klass.code, number, gen);
  const cred = await fb.createUserWithEmailAndPassword(auth, email, password);

  await fb.setDoc(fb.doc(db, 'students', cred.user.uid), {
    classId: klass.id,
    classCode: klass.code,
    className: klass.name,
    number: Number(number),
    nickname: (nickname || '').trim() || `${number}번`,
    tier: tier === 'hs' ? 'hs' : 'ms',
    generation: gen,
    createdAt: fb.serverTimestamp(),
  });
  return cred.user;
}

export async function studentSignIn({ code, number, password }) {
  const klass = await findClassByCode(code);
  if (!klass) throw new Error('그런 학급 코드가 없어요. 선생님께 다시 확인해 주세요.');
  const gen = Number((klass.resets || {})[String(number)] || 0);
  const email = studentEmail(klass.code, number, gen);
  const cred = await fb.signInWithEmailAndPassword(auth, email, password);
  return cred.user;
}

export async function getStudent(uid) {
  const snap = await fb.getDoc(fb.doc(db, 'students', uid));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

export async function signOutNow() {
  if (isCloud() && auth.currentUser) await fb.signOut(auth);
}

// ── 학습 기록 ──────────────────────────────────────────────────────────
// 문서 id = `${classId}_${number}` → 비밀번호를 초기화해 uid 가 바뀌어도 기록이 이어진다.
export async function saveProgress(student, data) {
  if (!isCloud() || !student) return;
  const id = progressId(student.classId, student.number);
  await fb.setDoc(
    fb.doc(db, 'progress', id),
    {
      classId: student.classId,
      number: Number(student.number),
      nickname: student.nickname,
      tier: student.tier,
      ...data,
      updatedAt: fb.serverTimestamp(),
    },
    { merge: true }
  );
}

export async function loadProgress(student) {
  if (!isCloud() || !student) return null;
  const snap = await fb.getDoc(fb.doc(db, 'progress', progressId(student.classId, student.number)));
  return snap.exists() ? snap.data() : null;
}

export async function listProgress(classId) {
  const snap = await fb.getDocs(
    fb.query(fb.collection(db, 'progress'), fb.where('classId', '==', classId))
  );
  return snap.docs.map((d) => ({ id: d.id, ...d.data() })).sort((a, b) => a.number - b.number);
}

/** 교사 대시보드 실시간 구독. 해제 함수를 돌려준다. */
export function watchProgress(classId, cb) {
  if (!isCloud()) return () => {};
  return fb.onSnapshot(
    fb.query(fb.collection(db, 'progress'), fb.where('classId', '==', classId)),
    (snap) => cb(snap.docs.map((d) => ({ id: d.id, ...d.data() })).sort((a, b) => a.number - b.number)),
    (err) => console.warn('[KOREA TIME] 대시보드 구독 오류', err)
  );
}

export async function listStudents(classId) {
  const snap = await fb.getDocs(
    fb.query(fb.collection(db, 'students'), fb.where('classId', '==', classId))
  );
  return snap.docs.map((d) => ({ id: d.id, ...d.data() })).sort((a, b) => a.number - b.number);
}

export async function deleteProgress(classId, number) {
  await fb.deleteDoc(fb.doc(db, 'progress', progressId(classId, number)));
}
