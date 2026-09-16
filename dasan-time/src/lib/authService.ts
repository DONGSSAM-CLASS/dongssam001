import {
  createUserWithEmailAndPassword,
  sendEmailVerification,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
} from 'firebase/auth';
import { auth } from './firebase';
import { studentEmail } from './code';
import { claimNumber, createStudentProfile, createTeacherProfile, lookupClassCode } from './db';

export async function teacherSignUp(input: {
  school: string;
  name: string;
  subject: string;
  email: string;
  password: string;
}) {
  const cred = await createUserWithEmailAndPassword(auth(), input.email, input.password);
  await updateProfile(cred.user, { displayName: input.name });
  await createTeacherProfile({
    uid: cred.user.uid,
    school: input.school,
    name: input.name,
    subject: input.subject,
    email: input.email,
  });
  // 이메일 인증 메일은 실패해도 가입 자체는 끝난 것으로 본다.
  await sendEmailVerification(cred.user).catch(() => undefined);
}

export async function teacherSignIn(email: string, password: string) {
  await signInWithEmailAndPassword(auth(), email, password);
}

export async function resetPassword(email: string) {
  await sendPasswordResetEmail(auth(), email);
}

export async function studentSignUp(input: {
  code: string;
  name: string;
  number: number;
  loginId: string;
  password: string;
}) {
  const found = await lookupClassCode(input.code);
  if (!found) throw new Error('학급 코드를 찾지 못했어요. 코드를 다시 확인해 볼까요?');
  if (!found.joinOpen) throw new Error('지금은 가입이 잠겨 있어요. 선생님께 말씀드려 주세요.');

  const cred = await createUserWithEmailAndPassword(
    auth(),
    studentEmail(input.loginId),
    input.password,
  );
  await updateProfile(cred.user, { displayName: input.name });
  // 번호 자리는 로그인한 뒤에 잡는다. 같은 번호가 이미 있으면 여기서 멈춘다.
  await claimNumber(found.classId, input.number, cred.user.uid);
  await createStudentProfile(found.classId, {
    uid: cred.user.uid,
    name: input.name,
    number: input.number,
    loginId: input.loginId.toLowerCase(),
    group: null,
    active: true,
  });
  return found.classId;
}

export async function studentSignIn(loginId: string, password: string) {
  await signInWithEmailAndPassword(auth(), studentEmail(loginId), password);
}

export async function logOut() {
  await signOut(auth());
}

/** Firebase 오류 코드를 학생·교사가 알아볼 수 있는 말로 바꾼다. */
export function friendlyAuthError(error: unknown): string {
  const code = (error as { code?: string })?.code ?? '';
  switch (code) {
    case 'auth/email-already-in-use':
      return '이미 쓰고 있는 아이디예요. 다른 아이디로 해 볼까요?';
    case 'auth/invalid-email':
      return '아이디나 이메일 모양이 올바르지 않아요.';
    case 'auth/weak-password':
      return '비밀번호가 너무 짧아요. 조금 더 길게 적어 주세요.';
    case 'auth/invalid-credential':
    case 'auth/wrong-password':
    case 'auth/user-not-found':
      return '아이디나 비밀번호가 맞지 않아요. 다시 한번 확인해 볼까요?';
    case 'auth/too-many-requests':
      return '잠시 뒤에 다시 해 주세요. 너무 여러 번 시도했어요.';
    case 'auth/network-request-failed':
      return '인터넷 연결을 확인해 주세요.';
    default:
      return error instanceof Error ? error.message : '문제가 생겼어요. 다시 해 볼까요?';
  }
}
