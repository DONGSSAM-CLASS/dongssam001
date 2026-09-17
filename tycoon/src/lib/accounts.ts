import { collection, doc, limit, onSnapshot, orderBy, query, where } from 'firebase/firestore';
import { db } from './firebase';
import type { AccountDoc, TransactionDoc } from '../types';

export function watchAccount(classId: string, accountId: string, cb: (a: AccountDoc | null) => void) {
  return onSnapshot(doc(db, `classes/${classId}/accounts/${accountId}`), (snap) =>
    cb(snap.exists() ? (snap.data() as AccountDoc) : null),
  );
}

export function watchRecentTransactions(
  classId: string,
  cb: (rows: (TransactionDoc & { id: string })[]) => void,
  count = 20,
) {
  return onSnapshot(
    query(collection(db, `classes/${classId}/transactions`), orderBy('createdAt', 'desc'), limit(count)),
    (snap) => cb(snap.docs.map((d) => ({ id: d.id, ...(d.data() as TransactionDoc) }))),
  );
}

/** 학생 본인의 거래내역. 규칙상 보낸 쪽·받은 쪽을 따로 질의해야 합니다. */
export function watchMyTransactions(
  classId: string,
  accountId: string,
  cb: (rows: (TransactionDoc & { id: string })[]) => void,
  count = 30,
) {
  const rows = new Map<string, TransactionDoc & { id: string }>();
  const emit = () =>
    cb(
      [...rows.values()].sort((a, b) => {
        const av = (a.createdAt as { seconds?: number } | null)?.seconds ?? 0;
        const bv = (b.createdAt as { seconds?: number } | null)?.seconds ?? 0;
        return bv - av;
      }).slice(0, count),
    );

  const make = (field: 'fromAccount' | 'toAccount') =>
    onSnapshot(
      query(
        collection(db, `classes/${classId}/transactions`),
        where(field, '==', accountId),
        orderBy('createdAt', 'desc'),
        limit(count),
      ),
      (snap) => {
        snap.docs.forEach((d) => rows.set(d.id, { id: d.id, ...(d.data() as TransactionDoc) }));
        emit();
      },
    );

  const unsubFrom = make('fromAccount');
  const unsubTo = make('toAccount');
  return () => { unsubFrom(); unsubTo(); };
}
