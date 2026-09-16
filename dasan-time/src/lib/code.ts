/**
 * 학급 코드 만들기.
 * 0/O/1/I/L 처럼 눈으로 헷갈리는 글자는 뺀다. (학생이 칠판을 보고 그대로 입력하기 때문)
 */
const ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';

export const CODE_LENGTH = 6;

export function generateClassCode(): string {
  const bytes = new Uint32Array(CODE_LENGTH);
  crypto.getRandomValues(bytes);
  let out = '';
  for (let i = 0; i < CODE_LENGTH; i += 1) {
    out += ALPHABET[bytes[i] % ALPHABET.length];
  }
  return out;
}

/** 학생이 소문자나 헷갈리는 글자를 입력해도 최대한 알아듣는다. */
export function normalizeClassCode(raw: string): string {
  return raw
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '')
    .replace(/O/g, '0')
    .replace(/[IL]/g, '1')
    .replace(/0/g, 'O')
    .replace(/1/g, 'I')
    .slice(0, CODE_LENGTH);
}

export function isValidClassCode(code: string): boolean {
  if (code.length !== CODE_LENGTH) return false;
  return [...code].every((ch) => ALPHABET.includes(ch));
}

/** 학생 아이디 → Firebase Auth 가상 이메일 (학생 실제 이메일은 받지 않는다) */
export const STUDENT_EMAIL_DOMAIN = 'students.dasan-time.app';

export function studentEmail(loginId: string): string {
  return `${loginId.toLowerCase()}@${STUDENT_EMAIL_DOMAIN}`;
}

export function isValidLoginId(loginId: string): boolean {
  return /^[a-z0-9]{4,12}$/.test(loginId);
}

/** 갤러리 익명 별칭 — 번호를 바로 드러내지 않도록 흩어 놓는다. */
export function galleryAlias(seed: string, prefix: string): string {
  let hash = 7;
  for (let i = 0; i < seed.length; i += 1) {
    hash = (hash * 31 + seed.charCodeAt(i)) % 97;
  }
  return `${prefix} ${String((hash % 96) + 1).padStart(2, '0')}`;
}
