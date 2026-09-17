import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { assertFails, assertSucceeds, type RulesTestEnvironment } from '@firebase/rules-unit-testing';
import { deleteDoc, doc, getDoc, serverTimestamp, setDoc, updateDoc, writeBatch, type Firestore } from 'firebase/firestore';
import {
  AUTH_PREFIX, CLASS_ID, TEACHER_UID,
  linkStudent, makeEnv, move, readBalance, seed, setBalances, studentCtxOptions,
} from './helpers';

let env: RulesTestEnvironment;

const teacher = () => env.authenticatedContext(TEACHER_UID, { email: 'teacher@example.com' });
const student7 = () => env.authenticatedContext('uid-07', studentCtxOptions('07'));
const student8 = () => env.authenticatedContext('uid-08', studentCtxOptions('08'));

beforeAll(async () => { env = await makeEnv(); });
afterAll(async () => { await env.cleanup(); });
beforeEach(async () => {
  await env.clearFirestore();
  await seed(env, ['07', '08']);
});

describe('원장 — 코인은 짝이 맞아야만 움직인다', () => {
  it('대통령(교사)은 국고에 코인을 발행할 수 있다', async () => {
    await assertSucceeds(
      move(teacher(), { type: 'MINT', from: 'MINT', to: 'TREASURY', amount: 10000, actorUid: TEACHER_UID }),
    );
    expect(await readBalance(env, 'TREASURY')).toBe(10000);
    expect(await readBalance(env, 'MINT')).toBe(-10000);   // 통화량 10000
  });

  it('학생은 국고를 발행할 수 없다', async () => {
    await linkStudent(env, 'uid-07', '07');
    await assertFails(
      move(student7(), { type: 'MINT', from: 'MINT', to: 'TREASURY', amount: 10000, actorUid: 'uid-07' }),
    );
  });

  it('원장 기록 없이 잔액만 늘리면 거부된다', async () => {
    await assertFails(
      move(teacher(), { type: 'MINT', from: 'MINT', to: 'TREASURY', amount: 500, actorUid: TEACHER_UID, skipTx: true }),
    );
  });

  it('보내는 쪽을 빼먹고 받는 쪽만 늘리면 거부된다', async () => {
    await assertFails(
      move(teacher(), { type: 'MINT', from: 'MINT', to: 'TREASURY', amount: 500, actorUid: TEACHER_UID, skipFrom: true }),
    );
  });

  it('받는 쪽 금액을 거래 금액보다 크게 쓰면 거부된다', async () => {
    await assertFails(
      move(teacher(), { type: 'MINT', from: 'MINT', to: 'TREASURY', amount: 500, actorUid: TEACHER_UID, inflateTo: 5000 }),
    );
  });

  it('잔액보다 많이 보내면 거부된다(음수 금지가 기본값)', async () => {
    await setBalances(env, { TREASURY: 100 });
    await assertFails(
      move(teacher(), { type: 'PAYROLL', from: 'TREASURY', to: 'S07', amount: 500, actorUid: TEACHER_UID }),
    );
  });

  it('학생이 balance 필드를 직접 고치려 하면 규칙이 거부한다', async () => {
    await linkStudent(env, 'uid-07', '07');
    const db = student7().firestore() as unknown as Firestore;
    await assertFails(
      updateDoc(doc(db, `classes/${CLASS_ID}/accounts/S07`), { balance: 999999 }),
    );
  });

  it('이미 쓴 거래는 고치거나 지울 수 없다', async () => {
    await move(teacher(), { type: 'MINT', from: 'MINT', to: 'TREASURY', amount: 100, actorUid: TEACHER_UID });
    let txId = '';
    await env.withSecurityRulesDisabled(async (ctx) => {
      const db = ctx.firestore() as unknown as Firestore;
      const snap = await getDoc(doc(db, `classes/${CLASS_ID}/accounts/TREASURY`));
      txId = snap.data()!.lastTxId as string;
    });
    const db = teacher().firestore() as unknown as Firestore;
    await assertFails(updateDoc(doc(db, `classes/${CLASS_ID}/transactions/${txId}`), { amount: 1 }));
    await assertFails(deleteDoc(doc(db, `classes/${CLASS_ID}/transactions/${txId}`)));
  });

  it('국고 → 학생 지급과 학생 → 국고 세금이 모두 기록된다', async () => {
    await move(teacher(), { type: 'MINT', from: 'MINT', to: 'TREASURY', amount: 10000, actorUid: TEACHER_UID });
    await assertSucceeds(
      move(teacher(), { type: 'PAYROLL', from: 'TREASURY', to: 'S07', amount: 500, reason: '9월 월급', actorUid: TEACHER_UID }),
    );
    await assertSucceeds(
      move(teacher(), { type: 'TAX', from: 'S07', to: 'TREASURY', amount: 50, reason: '소득세 10%', actorUid: TEACHER_UID }),
    );
    expect(await readBalance(env, 'S07')).toBe(450);
    expect(await readBalance(env, 'TREASURY')).toBe(9550);
    // 불변식: 모든 계정 잔액의 합은 언제나 0
    const sum = (await readBalance(env, 'MINT')) + (await readBalance(env, 'TREASURY'))
      + (await readBalance(env, 'S07')) + (await readBalance(env, 'S08'));
    expect(sum).toBe(0);
  });
});

describe('권한 — 대통령만 할 수 있는 일', () => {
  it('학생은 남의 지갑을 볼 수 없다', async () => {
    await linkStudent(env, 'uid-07', '07');
    const db = student7().firestore() as unknown as Firestore;
    await assertSucceeds(getDoc(doc(db, `classes/${CLASS_ID}/accounts/S07`)));
    await assertFails(getDoc(doc(db, `classes/${CLASS_ID}/accounts/S08`)));
  });

  it('기획재정부 장관은 전체 보유고를 볼 수 있다', async () => {
    await linkStudent(env, 'uid-07', '07', ['FINANCE_MINISTER']);
    const db = student7().firestore() as unknown as Firestore;
    await assertSucceeds(getDoc(doc(db, `classes/${CLASS_ID}/accounts/S08`)));
  });

  it('학생은 PIN(roster)을 읽을 수 없다', async () => {
    await linkStudent(env, 'uid-07', '07');
    const db = student7().firestore() as unknown as Firestore;
    await assertFails(getDoc(doc(db, `classes/${CLASS_ID}/roster/08`)));
    await assertFails(getDoc(doc(db, `classes/${CLASS_ID}/roster/07`)));
  });

  it('학생은 자기 역할을 스스로 바꿀 수 없다', async () => {
    await linkStudent(env, 'uid-07', '07');
    const db = student7().firestore() as unknown as Firestore;
    await assertFails(
      updateDoc(doc(db, `classes/${CLASS_ID}/members/uid-07`), { roles: ['PRESIDENT'] }),
    );
  });
});

describe('번호 연결(첫 로그인)', () => {
  async function claim(ctx: ReturnType<typeof student7>, uid: string, number: string) {
    const db = ctx.firestore() as unknown as Firestore;
    const batch = writeBatch(db);
    batch.update(doc(db, `classes/${CLASS_ID}/students/${number}`), { uid, claimedAt: serverTimestamp() });
    batch.set(doc(db, `classes/${CLASS_ID}/members/${uid}`), { number, roles: [] });
    return batch.commit();
  }

  it('자기 번호는 연결할 수 있다', async () => {
    await assertSucceeds(claim(student7(), 'uid-07', '07'));
  });

  it('남의 번호는 연결할 수 없다', async () => {
    await assertFails(claim(student7(), 'uid-07', '08'));
  });

  it('이미 연결된 번호는 다시 가져갈 수 없다', async () => {
    await claim(student7(), 'uid-07', '07');
    await assertFails(claim(student8(), 'uid-08', '07'));
  });
});

describe('급여 멱등성 — 같은 달은 한 번만', () => {
  it('같은 달 같은 학생의 급여명세서는 두 번 만들 수 없다', async () => {
    const db = teacher().firestore() as unknown as Firestore;
    const payrollRef = doc(db, `classes/${CLASS_ID}/payrolls/2026-10`);
    await assertSucceeds(setDoc(payrollRef, {
      status: 'RUNNING', executedAt: serverTimestamp(), totals: { gross: 0, tax: 0, net: 0 }, paidCount: 0,
    }));
    const slipRef = doc(db, `classes/${CLASS_ID}/payrolls/2026-10/slips/07`);
    await assertSucceeds(setDoc(slipRef, { gross: 500, tax: 50, net: 450, held: false }));
    // 두 번째 시도는 규칙이 막습니다(create 만 허용, update 불가).
    await assertFails(setDoc(slipRef, { gross: 500, tax: 50, net: 450, held: false }));
  });
});

describe('학급 코드', () => {
  it('코드를 정확히 알면 로그인 전에도 읽을 수 있다', async () => {
    const db = env.unauthenticatedContext().firestore() as unknown as Firestore;
    await assertSucceeds(getDoc(doc(db, 'classCodes', 'AB3K9Z')));
  });

  it('학생은 학급 설정을 바꿀 수 없다', async () => {
    await linkStudent(env, 'uid-07', '07');
    const db = student7().firestore() as unknown as Firestore;
    await assertFails(updateDoc(doc(db, 'classes', CLASS_ID), { allowNegativeBalance: true }));
  });

  it('가상 이메일 접두어는 학급 코드의 소문자여야 한다', () => {
    expect(AUTH_PREFIX).toBe('ab3k9z');
  });
});
