import {
  GoogleAuthProvider,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  signInWithRedirect,
  signOut,
  updatePassword,
} from 'firebase/auth';
import { doc, getDoc, serverTimestamp, writeBatch } from 'firebase/firestore';
import { auth, db } from './firebase';
import { padNumber, studentEmail, studentPassword } from './ids';

/** 교사 로그인 — Google 계정만 씁니다. */
export async function signInTeacher(): Promise<void> {
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: 'select_account' });
  try {
    await signInWithPopup(auth, provider);
  } catch (error) {
    const code = (error as { code?: string }).code ?? '';
    // 팝업이 막히는 환경(일부 태블릿·인앱 브라우저)에서는 리디렉션으로 넘어갑니다.
    if (code.includes('popup')) {
      await signInWithRedirect(auth, provider);
      return;
    }
    throw error;
  }
}

export function signOutAll(): Promise<void> {
  return signOut(auth);
}

// ---------------------------------------------------------------- 학생 로그인
// 서버(Cloud Functions)가 없으므로 커스텀 토큰을 발급할 수 없습니다.
// 대신 "학급코드 + 번호" 로 가상 이메일을 만들고 PIN 을 비밀번호로 씁니다.
// 첫 로그인은 곧 가입이며, 그때 자기 번호를 한 번만 자기 계정에 연결합니다.

const LOCK_KEY = 'tycoon.loginLock';
const MAX_FAILS = 5;
const LOCK_MS = 5 * 60 * 1000;

interface LockState { fails: number; until: number }

function readLock(): LockState {
  try {
    return JSON.parse(localStorage.getItem(LOCK_KEY) ?? '') as LockState;
  } catch {
    return { fails: 0, until: 0 };
  }
}

function writeLock(state: LockState): void {
  try {
    localStorage.setItem(LOCK_KEY, JSON.stringify(state));
  } catch {
    /* 시크릿 모드 등에서 저장이 막혀도 로그인 자체는 되게 둡니다. */
  }
}

export function loginLockRemainingMs(): number {
  const lock = readLock();
  return Math.max(0, lock.until - Date.now());
}

export class StudentLoginError extends Error {}

export interface StudentLoginResult {
  classId: string;
  number: string;
  isFirstLogin: boolean;
}

export async function signInStudent(
  rawCode: string,
  rawNumber: string,
  pin: string,
): Promise<StudentLoginResult> {
  const remaining = loginLockRemainingMs();
  if (remaining > 0) {
    throw new StudentLoginError(
      `로그인을 ${Math.ceil(remaining / 1000 / 60)}분 뒤에 다시 시도할 수 있습니다. (5회 틀림)`,
    );
  }

  const code = rawCode.trim().toUpperCase();
  const number = padNumber(rawNumber);
  if (!/^[A-Z0-9]{6}$/.test(code)) throw new StudentLoginError('학급 코드는 6자리입니다.');
  if (!/^\d{1,3}$/.test(rawNumber.trim())) throw new StudentLoginError('번호를 숫자로 입력해 주세요.');
  if (!/^\d{4,6}$/.test(pin)) throw new StudentLoginError('PIN은 숫자 4~6자리입니다.');

  const codeSnap = await getDoc(doc(db, 'classCodes', code));
  if (!codeSnap.exists()) throw new StudentLoginError('그런 학급 코드가 없습니다. 코드를 다시 확인해 주세요.');

  const { classId, authPrefix, generations } = codeSnap.data() as {
    classId: string;
    authPrefix: string;
    generations?: Record<string, number>;
  };
  const generation = generations?.[number] ?? 0;
  const email = studentEmail(authPrefix, number, generation);
  const password = studentPassword(pin, authPrefix);

  let isFirstLogin = false;
  try {
    await signInWithEmailAndPassword(auth, email, password);
  } catch {
    // 아직 계정이 없으면 첫 로그인(=가입)입니다.
    try {
      await createUserWithEmailAndPassword(auth, email, password);
      isFirstLogin = true;
    } catch (createError) {
      const code2 = (createError as { code?: string }).code ?? '';
      const lock = readLock();
      const fails = lock.fails + 1;
      writeLock({ fails: fails >= MAX_FAILS ? 0 : fails, until: fails >= MAX_FAILS ? Date.now() + LOCK_MS : 0 });
      if (code2 === 'auth/email-already-in-use') {
        throw new StudentLoginError(
          fails >= MAX_FAILS
            ? 'PIN을 5번 틀렸습니다. 5분 뒤에 다시 시도해 주세요.'
            : `PIN이 맞지 않습니다. (${fails}/${MAX_FAILS}회) 선생님께 초기화를 요청할 수 있어요.`,
        );
      }
      throw new StudentLoginError('로그인에 실패했습니다. 코드·번호·PIN을 다시 확인해 주세요.');
    }
  }

  writeLock({ fails: 0, until: 0 });
  const uid = auth.currentUser!.uid;

  // 번호를 내 계정에 연결합니다. 규칙상 아직 비어 있을 때 한 번만 됩니다.
  const studentRef = doc(db, `classes/${classId}/students/${number}`);
  const memberRef = doc(db, `classes/${classId}/members/${uid}`);
  const [studentSnap, memberSnap] = await Promise.all([getDoc(studentRef), getDoc(memberRef)]);

  if (!studentSnap.exists()) {
    throw new StudentLoginError('명단에 없는 번호입니다. 선생님께 문의해 주세요.');
  }
  if (!memberSnap.exists()) {
    const claimedUid = studentSnap.data().uid as string | null;
    if (claimedUid && claimedUid !== uid) {
      throw new StudentLoginError('이미 다른 기기·계정에 연결된 번호입니다. 선생님께 PIN 초기화를 요청해 주세요.');
    }
    const batch = writeBatch(db);
    batch.update(studentRef, { uid, claimedAt: serverTimestamp() });
    batch.set(memberRef, { number, roles: [] });
    await batch.commit();
  }

  return { classId, number, isFirstLogin };
}

/** 학생이 스스로 PIN 을 바꿉니다. 로그인 직후에만 호출하세요. */
export async function changeStudentPin(authPrefix: string, newPin: string): Promise<void> {
  if (!/^\d{4,6}$/.test(newPin)) throw new StudentLoginError('PIN은 숫자 4~6자리로 정해 주세요.');
  const user = auth.currentUser;
  if (!user) throw new StudentLoginError('로그인 상태가 아닙니다.');
  await updatePassword(user, studentPassword(newPin, authPrefix));
}
