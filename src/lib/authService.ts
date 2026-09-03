/**
 * 인증 서비스 — 교사(이메일/비밀번호·Google)와 학생(학급코드+번호+PIN → 가상 이메일) 가입·로그인.
 * 모든 처리는 클라이언트에서 이루어지며 권한은 firestore.rules 가 강제한다.
 */
import {
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  type User,
} from 'firebase/auth';
import { doc, getDoc, serverTimestamp, writeBatch } from 'firebase/firestore';
import { auth, db } from './firebase';
import { useAuthStore } from '@/store/authStore';
import type { ClassCodeDoc, ClassDoc, StudentUserDoc, TeacherUserDoc, UserDoc } from '@/types/firestore';
import type { Subject } from '@/types/history';
import {
  buildStudentEmail,
  buildStudentPassword,
  isValidClassCode,
  isValidStudentNumber,
  isValidStudentPin,
  memberDocId,
  normalizeClassCode,
} from './studentAuth';

export class AuthError extends Error {
  constructor(public code: string, message: string) {
    super(message);
  }
}

const MESSAGES: Record<string, string> = {
  'auth/invalid-credential': '번호 또는 비밀번호가 맞지 않습니다.',
  'auth/wrong-password': '번호 또는 비밀번호가 맞지 않습니다.',
  'auth/user-not-found': '아직 가입하지 않은 번호입니다. "처음이에요"에서 가입해 주세요.',
  'auth/email-already-in-use': '이미 가입된 번호입니다. "이미 가입했어요"에서 로그인해 주세요.',
  'auth/weak-password': '비밀번호가 너무 짧습니다.',
  'auth/invalid-email': '이메일 형식이 올바르지 않습니다.',
  'auth/too-many-requests': '시도가 너무 많습니다. 잠시 후 다시 해 주세요.',
  'auth/network-request-failed': '네트워크 연결을 확인해 주세요.',
  'auth/popup-closed-by-user': 'Google 로그인 창이 닫혔습니다.',
  'permission-denied': '권한이 없습니다. 학급코드·번호를 다시 확인해 주세요.',
};

export function friendlyError(err: unknown): string {
  if (err instanceof AuthError) return err.message;
  const code = (err as { code?: string })?.code ?? '';
  return MESSAGES[code] ?? `오류가 발생했습니다 (${code || (err as Error)?.message || 'unknown'})`;
}

/** 학급코드로 학급 찾기 (로그인 전, 문서 ID 정확 조회만 허용) */
export async function lookupClassCode(input: string): Promise<(ClassCodeDoc & { code: string }) | null> {
  const code = normalizeClassCode(input);
  if (!isValidClassCode(code)) return null;
  const snap = await getDoc(doc(db, 'class_codes', code));
  if (!snap.exists()) return null;
  const data = snap.data() as ClassCodeDoc;
  if (!data.active) return null;
  return { ...data, code };
}

export interface StudentCredentials {
  code: string;
  number: number;
  pin: string;
}

/** 학생 로그인: 학급코드 → authPrefix → 가상 이메일. 비밀번호 초기화(세대) 정보는 class_codes.resets 에서 읽는다. */
export async function studentSignIn({ code, number, pin }: StudentCredentials): Promise<User> {
  if (!isValidStudentNumber(number)) throw new AuthError('bad-number', '번호는 1~999 사이의 숫자여야 합니다.');
  if (!isValidStudentPin(pin)) throw new AuthError('bad-pin', '비밀번호는 4~6자리 숫자입니다.');
  const cc = await lookupClassCode(code);
  if (!cc) throw new AuthError('bad-code', '학급코드를 찾을 수 없습니다.');
  const generation = cc.resets?.[String(number)] ?? 0;
  const email = buildStudentEmail(cc.authPrefix, number, generation);
  const cred = await signInWithEmailAndPassword(auth, email, buildStudentPassword(pin, cc.authPrefix));
  await loadProfile(cred.user);
  return cred.user;
}

export interface StudentSignUp extends StudentCredentials {
  displayName: string;
  nickname?: string;
}

/**
 * 학생 가입(또는 비밀번호 초기화 후 재가입).
 * 1) Auth 계정 생성 → 2) users/{uid} + class_members/{classId}_{number} 배치 쓰기.
 * 규칙이 이메일 접두어·번호·학급 일치를 검증하므로 다른 학급/번호로는 가입할 수 없다.
 */
export async function studentSignUp({ code, number, pin, displayName, nickname }: StudentSignUp): Promise<User> {
  if (!isValidStudentNumber(number)) throw new AuthError('bad-number', '번호는 1~999 사이의 숫자여야 합니다.');
  if (!isValidStudentPin(pin)) throw new AuthError('bad-pin', '비밀번호는 4~6자리 숫자입니다.');
  const name = displayName.trim();
  if (name.length < 1 || name.length > 30) throw new AuthError('bad-name', '이름(또는 별명)을 1~30자로 입력해 주세요.');
  const cc = await lookupClassCode(code);
  if (!cc) throw new AuthError('bad-code', '학급코드를 찾을 수 없습니다.');
  const generation = cc.resets?.[String(number)] ?? 0;
  const email = buildStudentEmail(cc.authPrefix, number, generation);
  const cred = await createUserWithEmailAndPassword(auth, email, buildStudentPassword(pin, cc.authPrefix));
  const uid = cred.user.uid;

  const profile: StudentUserDoc = {
    role: 'student',
    displayName: name,
    ...(nickname?.trim() ? { nickname: nickname.trim() } : {}),
    classId: cc.classId,
    number,
    active: true,
    createdAt: serverTimestamp(),
  };
  const memberRef = doc(db, 'class_members', memberDocId(cc.classId, number));
  const memberSnap = await getDoc(memberRef).catch(() => null); // 미리 등록된 자리/초기화 자리는 읽기 불가 → null
  const batch = writeBatch(db);
  batch.set(doc(db, 'users', uid), profile);
  if (generation > 0 || (memberSnap && memberSnap.exists())) {
    // 비밀번호 초기화 후 자리 승계 또는 교사가 미리 등록한 자리 채우기
    batch.update(memberRef, { uid, displayName: name, resetPending: false, joinedAt: serverTimestamp(), lastSeenAt: serverTimestamp() });
  } else {
    batch.set(memberRef, {
      classId: cc.classId,
      number,
      uid,
      displayName: name,
      ...(nickname?.trim() ? { nickname: nickname.trim() } : {}),
      active: true,
      authGeneration: 0,
      resetPending: false,
      joinedAt: serverTimestamp(),
      lastSeenAt: serverTimestamp(),
    });
  }
  try {
    await batch.commit();
  } catch (e) {
    // 규칙 거부(예: 교사가 미리 등록한 자리) → update 로 재시도
    if ((e as { code?: string }).code === 'permission-denied' && generation === 0) {
      const b2 = writeBatch(db);
      b2.set(doc(db, 'users', uid), profile);
      b2.update(memberRef, { uid, displayName: name, resetPending: false, joinedAt: serverTimestamp(), lastSeenAt: serverTimestamp() });
      await b2.commit();
    } else {
      throw e;
    }
  }
  await loadProfile(cred.user);
  return cred.user;
}

export interface TeacherSignUp {
  email: string;
  password: string;
  displayName: string;
  schoolLevel: '중학교' | '고등학교';
  schoolName: string;
  subjects: Subject[];
}

export async function teacherSignUp(input: TeacherSignUp): Promise<User> {
  const cred = await createUserWithEmailAndPassword(auth, input.email.trim(), input.password);
  await createTeacherProfile(cred.user, input);
  await loadProfile(cred.user);
  return cred.user;
}

export async function createTeacherProfile(user: User, input: Omit<TeacherSignUp, 'email' | 'password'>) {
  const profile: TeacherUserDoc = {
    role: 'teacher',
    displayName: input.displayName.trim(),
    email: user.email ?? undefined,
    schoolLevel: input.schoolLevel,
    schoolName: input.schoolName.trim(),
    subjects: input.subjects,
    createdAt: serverTimestamp(),
  };
  const batch = writeBatch(db);
  batch.set(doc(db, 'users', user.uid), profile);
  await batch.commit();
}

export async function teacherSignIn(email: string, password: string): Promise<User> {
  const cred = await signInWithEmailAndPassword(auth, email.trim(), password);
  await loadProfile(cred.user);
  return cred.user;
}

export async function teacherGoogleSignIn(): Promise<User> {
  const cred = await signInWithPopup(auth, new GoogleAuthProvider());
  await loadProfile(cred.user);
  return cred.user;
}

export async function signOutAll() {
  await signOut(auth);
  useAuthStore.getState().reset();
}

/**
 * 프로필·학급·관리자 여부를 읽어 authStore 에 채운다.
 * 가입 직후에는 onAuthStateChanged 가 users 문서 쓰기보다 먼저 도착할 수 있으므로 잠시 재시도한다.
 */
export async function loadProfile(user: User, retries = 3) {
  const store = useAuthStore.getState();
  let snap = await getDoc(doc(db, 'users', user.uid));
  for (let i = 0; i < retries && !snap.exists(); i++) {
    await new Promise((r) => setTimeout(r, 400));
    snap = await getDoc(doc(db, 'users', user.uid));
  }
  if (!snap.exists()) {
    store.set({ status: 'ready', user, profile: null, classDoc: null, isAdmin: false });
    return;
  }
  const profile = { uid: user.uid, ...(snap.data() as UserDoc) };
  let classDoc: (ClassDoc & { id: string }) | null = null;
  if (profile.role === 'student') {
    const cs = await getDoc(doc(db, 'classes', profile.classId)).catch(() => null);
    if (cs && cs.exists()) classDoc = { id: cs.id, ...(cs.data() as ClassDoc) };
  }
  let isAdmin = false;
  if (profile.role === 'teacher') {
    const a = await getDoc(doc(db, 'admins', user.uid)).catch(() => null);
    isAdmin = Boolean(a && a.exists());
  }
  store.set({ status: 'ready', user, profile, classDoc, isAdmin });
}

let started = false;
/** 앱 시작 시 한 번만 호출 */
export function startAuthListener() {
  if (started) return;
  started = true;
  onAuthStateChanged(auth, (user) => {
    if (!user) {
      useAuthStore.getState().reset();
      return;
    }
    useAuthStore.getState().set({ status: 'loading', user });
    loadProfile(user).catch((e) => {
      console.error(e);
      useAuthStore.getState().set({ status: 'ready', user, profile: null });
    });
  });
}
