import {
  collection,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  writeBatch,
} from 'firebase/firestore';
import { db } from './firebase';
import { generateClassCode } from './ids';
import { MINISTRY_TEMPLATE } from '../data/ministryTemplate';
import { DEFAULT_ECONOMY, type ClassDoc } from '../types';
import { moveCoins } from './ledger';

export interface CreatedClass {
  classId: string;
  classCode: string;
}

/**
 * 학급을 만듭니다.
 *
 * ※ 규칙 함수가 get() 으로 학급 문서를 확인하므로, 하위 문서를 같은 batch 에
 *   담으면 "아직 학급이 없다"고 판단해 거부됩니다. 그래서 학급 문서를 먼저 쓰고
 *   나머지를 두 번째 batch 로 나눠 씁니다. (이 저장소의 다른 앱에서도 겪은 문제)
 */
export async function createClass(teacherUid: string, className: string): Promise<CreatedClass> {
  const name = className.trim();
  if (!name) throw new Error('학급 이름을 입력해 주세요.');

  // 코드가 겹치지 않을 때까지 몇 번 시도합니다.
  let classCode = '';
  for (let i = 0; i < 8; i += 1) {
    const candidate = generateClassCode();
    const snap = await getDoc(doc(db, 'classCodes', candidate));
    if (!snap.exists()) {
      classCode = candidate;
      break;
    }
  }
  if (!classCode) throw new Error('학급 코드를 만들지 못했습니다. 잠시 뒤 다시 시도해 주세요.');

  const classRef = doc(collection(db, 'classes'));
  const classId = classRef.id;
  const authPrefix = classCode.toLowerCase();

  // ① 학급 문서 먼저
  await setDoc(classRef, {
    name,
    teacherId: teacherUid,
    classCode,
    authPrefix,
    allowNegativeBalance: false,
    createdAt: serverTimestamp(),
  } satisfies Omit<ClassDoc, 'createdAt'> & { createdAt: unknown });

  // ② 나머지 초기 문서
  const batch = writeBatch(db);
  batch.set(doc(db, 'classCodes', classCode), {
    classId,
    teacherId: teacherUid,
    authPrefix,
    generations: {},
  });
  batch.set(doc(db, `classes/${classId}/settings/economy`), DEFAULT_ECONOMY);
  batch.set(doc(db, `classes/${classId}/accounts/MINT`), {
    type: 'SYSTEM', ownerNumber: null, balance: 0, lastTxId: null, updatedAt: serverTimestamp(),
  });
  batch.set(doc(db, `classes/${classId}/accounts/TREASURY`), {
    type: 'SYSTEM', ownerNumber: null, balance: 0, lastTxId: null, updatedAt: serverTimestamp(),
  });
  for (const { id, ...ministry } of MINISTRY_TEMPLATE) {
    batch.set(doc(db, `classes/${classId}/ministries/${id}`), ministry);
  }
  batch.set(doc(db, `classes/${classId}/auditLogs/${doc(collection(db, 'classes')).id}`), {
    actorUid: teacherUid,
    action: 'CLASS_CREATE',
    target: classId,
    detail: name,
    at: serverTimestamp(),
  });
  await batch.commit();

  return { classId, classCode };
}

export function watchClass(classId: string, cb: (data: ClassDoc | null) => void) {
  return onSnapshot(doc(db, 'classes', classId), (snap) => {
    cb(snap.exists() ? (snap.data() as ClassDoc) : null);
  });
}

export async function listTeacherClasses(teacherUid: string) {
  const snap = await getDocs(query(collection(db, 'classes'), where('teacherId', '==', teacherUid)));
  return snap.docs.map((d) => ({ id: d.id, ...(d.data() as ClassDoc) }));
}

/** 국고 발행 — MINT 계정에서 국고로 옮깁니다. 통화량이 그만큼 늘어납니다. */
export function issueCoins(classId: string, actorUid: string, amount: number, reason: string) {
  return moveCoins({ classId, actorUid, type: 'MINT', from: 'MINT', to: 'TREASURY', amount, reason });
}

/** 국고 소각 — 국고에서 MINT 로 되돌립니다. 통화량이 줄어듭니다. */
export function burnCoins(classId: string, actorUid: string, amount: number, reason: string) {
  return moveCoins({ classId, actorUid, type: 'BURN', from: 'TREASURY', to: 'MINT', amount, reason });
}

export function setAllowNegativeBalance(classId: string, allow: boolean) {
  return updateDoc(doc(db, 'classes', classId), { allowNegativeBalance: allow });
}
