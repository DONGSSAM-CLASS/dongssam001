import {
  collection,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  writeBatch,
} from 'firebase/firestore';
import { db } from './firebase';
import { accountIdForNumber, generatePin, padNumber } from './ids';
import type { RosterDoc, StudentDoc } from '../types';

export interface ParsedStudent {
  number: string;
  name: string;
}

/**
 * 교사가 표에서 복사해 붙여 넣은 글이나 CSV 를 명단으로 바꿉니다.
 * 받아들이는 모양:
 *   1  김철수      (번호 + 이름)
 *   1,김철수
 *   김철수         (번호가 없으면 줄 순서대로 1번부터)
 */
export function parseRoster(raw: string): { students: ParsedStudent[]; errors: string[] } {
  const errors: string[] = [];
  const students: ParsedStudent[] = [];
  const seen = new Set<string>();

  const lines = raw.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  let autoNumber = 1;

  for (const [index, line] of lines.entries()) {
    const cells = line.split(/[\t,;]|\s{2,}|\s/).map((c) => c.trim()).filter(Boolean);
    let number: string;
    let name: string;

    if (cells.length >= 2 && /^\d{1,3}$/.test(cells[0])) {
      number = padNumber(cells[0]);
      name = cells.slice(1).join(' ');
    } else {
      number = padNumber(autoNumber);
      name = cells.join(' ');
    }
    autoNumber = Number(number) + 1;

    if (!name) {
      errors.push(`${index + 1}번째 줄: 이름이 없습니다.`);
      continue;
    }
    if (name.length > 20) {
      errors.push(`${index + 1}번째 줄: 이름이 너무 깁니다(20자 이내).`);
      continue;
    }
    if (seen.has(number)) {
      errors.push(`${index + 1}번째 줄: ${Number(number)}번이 중복됩니다.`);
      continue;
    }
    seen.add(number);
    students.push({ number, name });
  }

  if (students.length === 0) errors.push('등록할 학생이 없습니다.');
  if (students.length > 60) errors.push('한 번에 60명까지만 등록할 수 있습니다.');
  return { students, errors };
}

export interface RegisteredStudent extends ParsedStudent {
  pin: string;
}

/**
 * 명단을 저장하고 학생별 초기 PIN 을 만듭니다.
 * 한 학생마다 문서 3개를 씁니다.
 *   students/{번호}  공개 명단 (이름·역할)
 *   roster/{번호}    교사 전용 비밀값 (PIN·세대)
 *   accounts/S{번호} 지갑 (잔액 0 으로 시작)
 */
export async function registerStudents(
  classId: string,
  classCode: string,
  teacherUid: string,
  parsed: ParsedStudent[],
  pinDigits = 4,
): Promise<RegisteredStudent[]> {
  const existing = await getDocs(collection(db, `classes/${classId}/students`));
  const taken = new Set(existing.docs.map((d) => d.id));

  const fresh = parsed.filter((s) => !taken.has(s.number));
  if (fresh.length === 0) throw new Error('이미 모두 등록된 번호입니다.');

  const created: RegisteredStudent[] = fresh.map((s) => ({ ...s, pin: generatePin(pinDigits) }));

  const batch = writeBatch(db);
  const generations: Record<string, number> = {};

  for (const student of created) {
    batch.set(doc(db, `classes/${classId}/students/${student.number}`), {
      number: student.number,
      name: student.name,
      roles: [],
      ministryId: null,
      creditScore: 1000,
      debts: 0,
      uid: null,
    } satisfies StudentDoc);

    batch.set(doc(db, `classes/${classId}/roster/${student.number}`), {
      number: student.number,
      name: student.name,
      pin: student.pin,
      authGeneration: 0,
      updatedAt: serverTimestamp(),
    } satisfies Omit<RosterDoc, 'updatedAt'> & { updatedAt: unknown });

    batch.set(doc(db, `classes/${classId}/accounts/${accountIdForNumber(student.number)}`), {
      type: 'STUDENT',
      ownerNumber: student.number,
      balance: 0,
      lastTxId: null,
      updatedAt: serverTimestamp(),
    });

    generations[student.number] = 0;
  }

  // 학생이 로그인 전에 자기 세대를 알아야 하므로 번호→세대만 공개합니다(이름은 공개하지 않습니다).
  const codeRef = doc(db, 'classCodes', classCode);
  const codeSnap = await getDoc(codeRef);
  batch.update(codeRef, {
    generations: { ...((codeSnap.data()?.generations as Record<string, number>) ?? {}), ...generations },
  });

  batch.set(doc(collection(db, `classes/${classId}/auditLogs`)), {
    actorUid: teacherUid,
    action: 'STUDENTS_REGISTER',
    target: classId,
    detail: `${created.length}명 등록`,
    at: serverTimestamp(),
  });

  await batch.commit();
  return created;
}

/**
 * PIN 초기화. 서버가 없어 기존 Auth 비밀번호를 바꿀 수 없으므로
 * "세대(generation)" 를 올려서 학생이 새 PIN 으로 다시 가입하게 합니다.
 * 번호 기준으로 기록이 남아 있어 잔액·거래내역은 그대로 이어집니다.
 */
export async function resetStudentPin(
  classId: string,
  classCode: string,
  teacherUid: string,
  number: string,
  pinDigits = 4,
): Promise<string> {
  const rosterRef = doc(db, `classes/${classId}/roster/${number}`);
  const rosterSnap = await getDoc(rosterRef);
  if (!rosterSnap.exists()) throw new Error('명단에 없는 번호입니다.');

  const generation = ((rosterSnap.data().authGeneration as number) ?? 0) + 1;
  const pin = generatePin(pinDigits);

  const codeRef = doc(db, 'classCodes', classCode);
  const codeSnap = await getDoc(codeRef);

  const batch = writeBatch(db);
  batch.update(rosterRef, { pin, authGeneration: generation, updatedAt: serverTimestamp() });
  // 새 계정으로 다시 연결할 수 있도록 uid 를 비웁니다.
  batch.update(doc(db, `classes/${classId}/students/${number}`), { uid: null });
  batch.update(codeRef, {
    generations: { ...((codeSnap.data()?.generations as Record<string, number>) ?? {}), [number]: generation },
  });
  batch.set(doc(collection(db, `classes/${classId}/auditLogs`)), {
    actorUid: teacherUid,
    action: 'PIN_RESET',
    target: number,
    detail: `세대 ${generation}`,
    at: serverTimestamp(),
  });
  await batch.commit();
  return pin;
}

export function watchStudents(classId: string, cb: (students: StudentDoc[]) => void) {
  return onSnapshot(
    query(collection(db, `classes/${classId}/students`), orderBy('number')),
    (snap) => cb(snap.docs.map((d) => d.data() as StudentDoc)),
  );
}

export async function listRoster(classId: string): Promise<RosterDoc[]> {
  const snap = await getDocs(query(collection(db, `classes/${classId}/roster`), orderBy('number')));
  return snap.docs.map((d) => d.data() as RosterDoc);
}

export function renameStudent(classId: string, number: string, name: string) {
  return updateDoc(doc(db, `classes/${classId}/students/${number}`), { name: name.trim() });
}
