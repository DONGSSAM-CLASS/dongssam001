import { useEffect, useState } from 'react';
import { useSession } from '../store/session';
import { watchAccount, watchMyTransactions } from '../lib/accounts';
import { accountIdForNumber } from '../lib/ids';
import { changeStudentPin, signOutAll } from '../lib/auth';
import { formatDateTimeKST, formatMonthKo, monthKST } from '../lib/time';
import { ROLE_LABELS, TX_LABELS, type TransactionDoc } from '../types';
import { Badge, Button, Card, Field, Money, Notice, inputClass } from '../components/ui';

export default function StudentHome() {
  const { classId, classDoc, member, student } = useSession();
  const [balance, setBalance] = useState(0);
  const [rows, setRows] = useState<(TransactionDoc & { id: string })[]>([]);
  const [newPin, setNewPin] = useState('');
  const [pinMessage, setPinMessage] = useState('');
  const [pinError, setPinError] = useState('');

  const accountId = member ? accountIdForNumber(member.number) : null;

  useEffect(() => {
    if (!classId || !accountId) return;
    const offA = watchAccount(classId, accountId, (a) => setBalance(a?.balance ?? 0));
    const offT = watchMyTransactions(classId, accountId, setRows);
    return () => { offA(); offT(); };
  }, [classId, accountId]);

  if (!classDoc || !member || !accountId) return null;

  const roles = member.roles.length > 0 ? member.roles : (['CITIZEN'] as const);

  async function savePin() {
    setPinMessage('');
    setPinError('');
    try {
      await changeStudentPin(classDoc!.authPrefix, newPin);
      setNewPin('');
      setPinMessage('PIN을 바꿨습니다. 다음 로그인부터 새 PIN을 쓰세요.');
    } catch (e) {
      setPinError(e instanceof Error ? e.message : 'PIN을 바꾸지 못했습니다. 다시 로그인한 뒤 시도해 주세요.');
    }
  }

  return (
    <main className="mx-auto max-w-2xl px-4 py-6">
      <header className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-bold text-sky-700">{classDoc.name} · {formatMonthKo(monthKST())}</p>
          <h1 className="text-2xl font-black text-navy-700">
            {Number(member.number)}번 {student?.name ?? ''}
          </h1>
          <div className="mt-2 flex flex-wrap gap-2">
            {roles.map((r) => <Badge key={r} tone="sky">{ROLE_LABELS[r]}</Badge>)}
          </div>
        </div>
        <Button kind="ghost" onClick={() => signOutAll()}>로그아웃</Button>
      </header>

      <Card title="내 지갑" tone="sky">
        <p className="text-4xl"><Money amount={balance} /></p>
        <p className="mt-3 text-sm text-gray-500">
          예금·대출·주식은 다음 단계에서 열립니다.
        </p>
      </Card>

      <div className="mt-4">
        <Card title="거래내역">
          {rows.length === 0 ? (
            <p className="text-base text-gray-500">아직 거래가 없습니다.</p>
          ) : (
            <ul className="divide-y divide-gray-100">
              {rows.map((tx) => {
                const incoming = tx.toAccount === accountId;
                return (
                  <li key={tx.id} className="flex items-center justify-between gap-3 py-3">
                    <div className="min-w-0">
                      <p className="truncate text-base font-bold">{TX_LABELS[tx.type] ?? tx.type}</p>
                      <p className="truncate text-sm text-gray-500">
                        {tx.reason} · {formatDateTimeKST(tx.createdAt)}
                      </p>
                    </div>
                    <Money amount={incoming ? tx.amount : -tx.amount} delta />
                  </li>
                );
              })}
            </ul>
          )}
        </Card>
      </div>

      <div className="mt-4">
        <Card title="내 PIN 바꾸기">
          <Field label="새 PIN" hint="숫자 4~6자리. 잊어버리면 선생님께 초기화를 요청하세요.">
            <input
              className={`${inputClass} font-mono text-xl tracking-widest`}
              type="password"
              value={newPin}
              onChange={(e) => setNewPin(e.target.value.replace(/\D/g, ''))}
              inputMode="numeric"
              maxLength={6}
            />
          </Field>
          <div className="mt-4">
            <Button onClick={savePin} disabled={newPin.length < 4}>바꾸기</Button>
          </div>
          {pinMessage && <div className="mt-4"><Notice kind="ok">{pinMessage}</Notice></div>}
          {pinError && <div className="mt-4"><Notice kind="error">{pinError}</Notice></div>}
        </Card>
      </div>
    </main>
  );
}
