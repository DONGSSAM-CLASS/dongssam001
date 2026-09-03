/**
 * 학생 계정 규칙 (서버 없이 클라이언트에서만 처리)
 *
 * 학생은 이메일 없이 "학급코드 + 번호 + 4~6자리 비밀번호"로 가입한다.
 * 내부적으로는 Firebase Auth 이메일/비밀번호 방식을 쓰되
 *   `{학급 인증 접두어}-{번호}@student.local`             (최초 가입)
 *   `{학급 인증 접두어}-{번호}-{세대}@student.local`      (교사가 비밀번호를 초기화한 뒤 재가입, 세대≥1)
 * 형식의 가상 이메일을 자동 생성하며 학생에게는 노출하지 않는다.
 *
 * 학급 인증 접두어(authPrefix)는 학급이 처음 만들어질 때의 6자리 코드이며, 이후 학급코드를 재발급해도 바뀌지 않는다.
 * 그래야 코드 재발급 후에도 기존 학생이 그대로 로그인할 수 있다.
 *
 * Firebase Auth 는 비밀번호 최소 6자를 요구하므로, 학생 PIN(4~6자리)에 학급 접두어를 덧붙여
 * 실제 Auth 비밀번호를 만든다. 보안 강도는 PIN 과 동일하며(교실 보조 도구 수준), 학급코드는 학생에게 공개된 값이다.
 */

export const STUDENT_EMAIL_DOMAIN = 'student.local';
export const CLASS_CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // 혼동되는 I·O·0·1 제외
export const CLASS_CODE_LENGTH = 6;
export const STUDENT_PIN_PATTERN = /^[0-9]{4,6}$/;
export const CLASS_CODE_PATTERN = /^[A-Z0-9]{6}$/;
// Firebase Auth 는 이메일을 소문자로 정규화하므로 가상 이메일 접두어도 소문자로 만든다.
// (학급코드 자체는 학생이 보기 쉽도록 대문자로 표시·저장한다)
export const STUDENT_EMAIL_PATTERN = /^([A-Za-z0-9]{6})-([0-9]{1,3})(?:-([0-9]{1,3}))?@student\.local$/;

export function normalizeClassCode(input: string): string {
  return input.trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
}

export function isValidClassCode(code: string): boolean {
  return CLASS_CODE_PATTERN.test(code);
}

export function isValidStudentPin(pin: string): boolean {
  return STUDENT_PIN_PATTERN.test(pin);
}

export function isValidStudentNumber(n: number): boolean {
  return Number.isInteger(n) && n >= 1 && n <= 999;
}

/** 6자리 학급코드 생성 (브라우저 crypto 우선, 없으면 Math.random) */
export function generateClassCode(random: () => number = defaultRandom): string {
  let out = '';
  for (let i = 0; i < CLASS_CODE_LENGTH; i++) {
    out += CLASS_CODE_ALPHABET[Math.floor(random() * CLASS_CODE_ALPHABET.length)];
  }
  return out;
}

function defaultRandom(): number {
  const c = globalThis.crypto;
  if (c && typeof c.getRandomValues === 'function') {
    const buf = new Uint32Array(1);
    c.getRandomValues(buf);
    return buf[0] / 0x1_0000_0000;
  }
  return Math.random();
}

export function buildStudentEmail(authPrefix: string, number: number, generation = 0): string {
  if (!isValidClassCode(authPrefix)) throw new Error('invalid authPrefix');
  if (!isValidStudentNumber(number)) throw new Error('invalid student number');
  if (!Number.isInteger(generation) || generation < 0) throw new Error('invalid generation');
  const gen = generation > 0 ? `-${generation}` : '';
  return `${authPrefix.toLowerCase()}-${number}${gen}@${STUDENT_EMAIL_DOMAIN}`;
}

export function parseStudentEmail(email: string | null | undefined): {
  authPrefix: string;
  number: number;
  generation: number;
} | null {
  if (!email) return null;
  const m = STUDENT_EMAIL_PATTERN.exec(email);
  if (!m) return null;
  // 저장된 학급 authPrefix 와 바로 비교할 수 있도록 대문자로 되돌린다
  return { authPrefix: m[1].toUpperCase(), number: Number(m[2]), generation: m[3] ? Number(m[3]) : 0 };
}

export function isStudentEmail(email: string | null | undefined): boolean {
  return parseStudentEmail(email) !== null;
}

/** 학생 PIN → Firebase Auth 비밀번호 (최소 6자 요건 충족) */
export function buildStudentPassword(pin: string, authPrefix: string): string {
  if (!isValidStudentPin(pin)) throw new Error('invalid pin');
  return `${pin}#${authPrefix}`;
}

/** class_members 문서 ID */
export function memberDocId(classId: string, number: number): string {
  return `${classId}_${number}`;
}
/** student_work 문서 ID (학생 1명 = 세션당 문서 1개) */
export function studentWorkDocId(sessionId: string, number: number): string {
  return `${sessionId}_${number}`;
}
/** submissions 문서 ID */
export function submissionDocId(missionId: string, number: number): string {
  return `${missionId}_${number}`;
}
/** teacher_overrides 문서 ID */
export function overrideDocId(teacherId: string, kind: string, targetId: string): string {
  return `${teacherId}_${kind}_${targetId}`;
}
