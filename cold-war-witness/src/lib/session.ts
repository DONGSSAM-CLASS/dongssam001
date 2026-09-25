/**
 * 이 기기에 남겨 두는 학생 입장 정보 (같은 기기에서 이어 하기용).
 * 실명·PIN 은 저장하지 않는다. 학급 코드·학급 id·학생 기록 id·번호만 남긴다.
 */
export interface StudentSession {
  classId: string;
  classCode: string;
  className: string;
  studentId: string;
  number: number;
}

const KEY = 'cww.student.v1';

export function loadSession(): StudentSession | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const s = JSON.parse(raw) as StudentSession;
    return s && s.classId && s.studentId ? s : null;
  } catch {
    return null;
  }
}

export function saveSession(s: StudentSession): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(s));
  } catch {
    /* 저장이 막힌 브라우저에서는 이번 접속 동안만 쓴다 */
  }
}

export function clearSession(): void {
  try {
    localStorage.removeItem(KEY);
  } catch {
    /* 무시 */
  }
}
