import { PIN_SALT } from '../config';

/** 문자열의 SHA-256 을 16진수 64자로 */
export async function sha256Hex(text: string): Promise<string> {
  const data = new TextEncoder().encode(text);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

/**
 * 학생 문서 id = SHA-256(앱 salt : 학급 id : 번호 : PIN)
 * PIN 을 모르면 문서 주소를 알 수 없으므로, 다른 기기에서 이어 하려면 PIN 이 꼭 필요하다.
 * PIN 원문은 어디에도 저장하지 않는다.
 */
export function studentDocId(classId: string, number: number, pin: string): Promise<string> {
  return sha256Hex(`${PIN_SALT}:${classId}:${number}:${pin}`);
}

export function isValidPin(pin: string): boolean {
  return /^[0-9]{4}$/.test(pin);
}

/** 교사용 임시 PIN (4자리 숫자) */
export function randomPin(): string {
  const n = crypto.getRandomValues(new Uint32Array(1))[0] % 10000;
  return n.toString().padStart(4, '0');
}
