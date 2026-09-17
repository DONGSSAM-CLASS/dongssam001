import { collection, doc, runTransaction, serverTimestamp } from 'firebase/firestore';
import type { Transaction } from 'firebase/firestore';
import { db } from './firebase';
import type { AccountId, TxType } from '../types';

/**
 * ★ 이 파일은 코인이 움직이는 유일한 통로입니다. ★
 *
 * Security Rules 가 요구하는 "복식부기 묶음"을 만들어 줍니다.
 *   ① transactions 문서 생성
 *   ② 보내는 계정 잔액 감소
 *   ③ 받는 계정 잔액 증가
 * 이 셋이 한 트랜잭션 안에서 짝이 맞아야만 서버가 받아 줍니다.
 * 화면 코드는 절대 accounts 문서를 직접 수정하지 마세요. 규칙이 거부합니다.
 */

export class LedgerError extends Error {}

export interface MoveRequest {
  classId: string;
  type: TxType;
  from: AccountId;
  to: AccountId;
  amount: number;
  reason: string;
  actorUid: string;
  refDoc?: string | null;
  payrollMonth?: string | null;
  /** 같은 트랜잭션에 함께 기록할 문서가 있으면 여기서 씁니다(예: 급여명세서). */
  extra?: (tx: Transaction, txId: string) => void;
  /** 잔액이 모자라도 진행할지. 기본은 진행하지 않습니다. */
  allowNegative?: boolean;
}

export async function moveCoins(req: MoveRequest): Promise<string> {
  const { classId, type, from, to, amount, reason, actorUid } = req;

  if (!Number.isInteger(amount) || amount <= 0) {
    throw new LedgerError('금액은 1 이상의 정수 코인이어야 합니다.');
  }
  if (from === to) {
    throw new LedgerError('보내는 계정과 받는 계정이 같을 수 없습니다.');
  }
  if (!reason.trim()) {
    throw new LedgerError('사유를 입력해야 합니다.');
  }

  const base = `classes/${classId}`;
  const txRef = doc(collection(db, `${base}/transactions`));
  const fromRef = doc(db, `${base}/accounts/${from}`);
  const toRef = doc(db, `${base}/accounts/${to}`);

  await runTransaction(db, async (t) => {
    const [fromSnap, toSnap] = await Promise.all([t.get(fromRef), t.get(toRef)]);
    if (!fromSnap.exists()) throw new LedgerError(`보내는 계정(${from})이 없습니다.`);
    if (!toSnap.exists()) throw new LedgerError(`받는 계정(${to})이 없습니다.`);

    const fromBalance = (fromSnap.data().balance as number) - amount;
    const toBalance = (toSnap.data().balance as number) + amount;

    // MINT 계정은 발행 누계를 담느라 늘 음수입니다. 나머지는 잔액을 지킵니다.
    if (from !== 'MINT' && fromBalance < 0 && !req.allowNegative) {
      throw new LedgerError(
        `잔액이 부족합니다. 남은 금액 ${(fromSnap.data().balance as number).toLocaleString('ko-KR')}코인, 필요한 금액 ${amount.toLocaleString('ko-KR')}코인`,
      );
    }

    t.set(txRef, {
      type,
      fromAccount: from,
      toAccount: to,
      amount,
      reason: reason.trim().slice(0, 200),
      actorUid,
      refDoc: req.refDoc ?? null,
      payrollMonth: req.payrollMonth ?? null,
      createdAt: serverTimestamp(),
    });
    t.update(fromRef, { balance: fromBalance, lastTxId: txRef.id, updatedAt: serverTimestamp() });
    t.update(toRef, { balance: toBalance, lastTxId: txRef.id, updatedAt: serverTimestamp() });

    req.extra?.(t, txRef.id);
  });

  return txRef.id;
}
