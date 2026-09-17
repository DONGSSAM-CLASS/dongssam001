// 사람이 옮겨 적기 쉬운 코드만 씁니다. 0/O, 1/I/L 처럼 헷갈리는 글자는 뺐습니다.
const CODE_ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';

export function generateClassCode(length = 6): string {
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => CODE_ALPHABET[b % CODE_ALPHABET.length]).join('');
}

export function generatePin(digits = 4): string {
  const bytes = new Uint8Array(digits);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => String(b % 10)).join('');
}

/** 학생 번호는 '07' 처럼 두 자리 문자열로 통일합니다(문서 ID 정렬을 위해). */
export function padNumber(value: number | string): string {
  return String(value).trim().padStart(2, '0');
}

export const STUDENT_EMAIL_DOMAIN = 'student.local';

/** 학생 가상 이메일. Firebase Auth 가 소문자로 정규화하므로 처음부터 소문자로 만듭니다. */
export function studentEmail(authPrefix: string, number: string, generation: number): string {
  return `${authPrefix.toLowerCase()}-${padNumber(number)}-g${generation}@${STUDENT_EMAIL_DOMAIN}`;
}

/** Auth 비밀번호 최소 6자 제약을 PIN 그대로 쓰면서 넘기기 위한 조합. */
export function studentPassword(pin: string, authPrefix: string): string {
  return `${pin}#${authPrefix.toLowerCase()}`;
}

export function accountIdForNumber(number: string): string {
  return `S${padNumber(number)}`;
}
