import { CLASS_CODE_ALPHABET, CLASS_CODE_LENGTH } from '../config';

export function generateClassCode(): string {
  const bytes = crypto.getRandomValues(new Uint32Array(CLASS_CODE_LENGTH));
  return [...bytes].map((b) => CLASS_CODE_ALPHABET[b % CLASS_CODE_ALPHABET.length]).join('');
}

/**
 * 학생이 입력한 코드를 정리한다: 공백 제거, 대문자로, 헷갈리기 쉬운 글자 바로잡기.
 * (코드에는 0·O·1·I·L 이 없으므로 O→0 같은 변환은 하지 않고, 그대로 두어 “없는 코드”로 안내한다.)
 */
export function normalizeClassCode(input: string): string {
  return input.replace(/\s|-/g, '').toUpperCase();
}

export function isValidClassCode(code: string): boolean {
  if (code.length !== CLASS_CODE_LENGTH) return false;
  return [...code].every((ch) => CLASS_CODE_ALPHABET.includes(ch));
}
