import {
  initializeTestEnvironment,
  type RulesTestEnvironment,
  type RulesTestContext,
} from '@firebase/rules-unit-testing';
import { readFileSync } from 'node:fs';
import { doc, getDoc, serverTimestamp, writeBatch, type Firestore } from 'firebase/firestore';

export const PROJECT_ID = 'demo-tycoon';
export const CLASS_ID = 'class1';
export const CLASS_CODE = 'AB3K9Z';
export const AUTH_PREFIX = 'ab3k9z';
export const TEACHER_UID = 'teacher-uid';

/** 학생 uid 와 가상 이메일 — 규칙이 이메일로 번호 소유를 확인합니다. */
export function studentCtxOptions(number: string, generation = 0) {
  return { email: `${AUTH_PREFIX}-${number}-g${generation}@student.local` };
}

export async function makeEnv(): Promise<RulesTestEnvironment> {
  return initializeTestEnvironment({
    projectId: PROJECT_ID,
    firestore: {
      rules: readFileSync('firestore.rules', 'utf8'),
      host: '127.0.0.1',
      port: 8180,
    },
  });
}

/** 규칙을 끄고 기본 데이터를 심습니다. */
export async function seed(env: RulesTestEnvironment, numbers: string[]): Promise<void> {
  await env.withSecurityRulesDisabled(async (ctx) => {
    const db = ctx.firestore() as unknown as Firestore;
    const batch = writeBatch(db);
    batch.set(doc(db, 'classes', CLASS_ID), {
      name: '2학년 4반',
      teacherId: TEACHER_UID,
      classCode: CLASS_CODE,
      authPrefix: AUTH_PREFIX,
      allowNegativeBalance: false,
      createdAt: serverTimestamp(),
    });
    batch.set(doc(db, 'classCodes', CLASS_CODE), {
      classId: CLASS_ID, teacherId: TEACHER_UID, authPrefix: AUTH_PREFIX, generations: {},
    });
    for (const id of ['MINT', 'TREASURY']) {
      batch.set(doc(db, `classes/${CLASS_ID}/accounts/${id}`), {
        type: 'SYSTEM', ownerNumber: null, balance: 0, lastTxId: null, updatedAt: serverTimestamp(),
      });
    }
    for (const number of numbers) {
      batch.set(doc(db, `classes/${CLASS_ID}/students/${number}`), {
        number, name: `학생${number}`, roles: [], ministryId: null,
        creditScore: 1000, debts: 0, uid: null,
      });
      batch.set(doc(db, `classes/${CLASS_ID}/roster/${number}`), {
        number, name: `학생${number}`, pin: '1234', authGeneration: 0, updatedAt: serverTimestamp(),
      });
      batch.set(doc(db, `classes/${CLASS_ID}/accounts/S${number}`), {
        type: 'STUDENT', ownerNumber: number, balance: 0, lastTxId: null, updatedAt: serverTimestamp(),
      });
    }
    await batch.commit();
  });
}

/** 이미 로그인한 학생으로 만들어 둡니다(번호 연결까지 끝난 상태). */
export async function linkStudent(env: RulesTestEnvironment, uid: string, number: string, roles: string[] = []) {
  await env.withSecurityRulesDisabled(async (ctx) => {
    const db = ctx.firestore() as unknown as Firestore;
    const batch = writeBatch(db);
    batch.update(doc(db, `classes/${CLASS_ID}/students/${number}`), { uid });
    batch.set(doc(db, `classes/${CLASS_ID}/members/${uid}`), { number, roles });
    await batch.commit();
  });
}

export async function setBalances(env: RulesTestEnvironment, balances: Record<string, number>) {
  await env.withSecurityRulesDisabled(async (ctx) => {
    const db = ctx.firestore() as unknown as Firestore;
    const batch = writeBatch(db);
    for (const [accountId, balance] of Object.entries(balances)) {
      batch.update(doc(db, `classes/${CLASS_ID}/accounts/${accountId}`), { balance });
    }
    await batch.commit();
  });
}

export async function readBalance(env: RulesTestEnvironment, accountId: string): Promise<number> {
  let value = 0;
  await env.withSecurityRulesDisabled(async (ctx) => {
    const db = ctx.firestore() as unknown as Firestore;
    const snap = await getDoc(doc(db, `classes/${CLASS_ID}/accounts/${accountId}`));
    value = (snap.data()?.balance as number) ?? 0;
  });
  return value;
}

/**
 * 규칙이 요구하는 복식부기 묶음을 만듭니다(앱의 src/lib/ledger.ts 와 같은 모양).
 * 테스트는 이 함수가 통과/거부되는지를 봅니다.
 */
export async function move(
  ctx: RulesTestContext,
  opts: {
    type: string; from: string; to: string; amount: number; reason?: string; actorUid: string;
    /** 위조 시나리오: 받는 쪽만 늘리기 */
    skipFrom?: boolean;
    /** 위조 시나리오: 원장 기록 없이 잔액만 바꾸기 */
    skipTx?: boolean;
    /** 위조 시나리오: 받는 쪽에 거래 금액보다 많이 넣기 */
    inflateTo?: number;
  },
) {
  const db = ctx.firestore() as unknown as Firestore;
  const base = `classes/${CLASS_ID}`;
  const txId = `tx_${Math.random().toString(36).slice(2, 10)}`;
  const fromRef = doc(db, `${base}/accounts/${opts.from}`);
  const toRef = doc(db, `${base}/accounts/${opts.to}`);
  const [fromSnap, toSnap] = await Promise.all([getDoc(fromRef), getDoc(toRef)]);

  const batch = writeBatch(db);
  if (!opts.skipTx) {
    batch.set(doc(db, `${base}/transactions/${txId}`), {
      type: opts.type,
      fromAccount: opts.from,
      toAccount: opts.to,
      amount: opts.amount,
      reason: opts.reason ?? '테스트',
      actorUid: opts.actorUid,
      refDoc: null,
      payrollMonth: null,
      createdAt: serverTimestamp(),
    });
  }
  if (!opts.skipFrom) {
    batch.update(fromRef, {
      balance: ((fromSnap.data()?.balance as number) ?? 0) - opts.amount,
      lastTxId: txId,
      updatedAt: serverTimestamp(),
    });
  }
  batch.update(toRef, {
    balance: ((toSnap.data()?.balance as number) ?? 0) + (opts.inflateTo ?? opts.amount),
    lastTxId: txId,
    updatedAt: serverTimestamp(),
  });
  return batch.commit();
}
