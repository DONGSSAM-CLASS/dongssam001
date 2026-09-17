import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useSession } from '../store/session';
import { watchAccount, watchRecentTransactions } from '../lib/accounts';
import { watchStudents } from '../lib/rosterService';
import { burnCoins, issueCoins } from '../lib/classService';
import { signOutAll } from '../lib/auth';
import { formatDateTimeKST, formatMonthKo, monthKST } from '../lib/time';
import { TX_LABELS, type TransactionDoc } from '../types';
import { Button, Card, DangerConfirm, Field, Money, Notice, inputClass } from '../components/ui';

export default function TeacherHome() {
  const { classId, classDoc, user } = useSession();
  const [treasury, setTreasury] = useState(0);
  const [mint, setMint] = useState(0);
  const [studentCount, setStudentCount] = useState(0);
  const [rows, setRows] = useState<(TransactionDoc & { id: string })[]>([]);
  const [amount, setAmount] = useState('');
  const [reason, setReason] = useState('');
  const [burnOpen, setBurnOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!classId) return;
    const offT = watchAccount(classId, 'TREASURY', (a) => setTreasury(a?.balance ?? 0));
    const offM = watchAccount(classId, 'MINT', (a) => setMint(a?.balance ?? 0));
    const offS = watchStudents(classId, (s) => setStudentCount(s.length));
    const offTx = watchRecentTransactions(classId, setRows);
    return () => { offT(); offM(); offS(); offTx(); };
  }, [classId]);

  if (!classId || !classDoc || !user) return null;

  const parsedAmount = Number(amount.replaceAll(',', ''));
  const amountValid = Number.isInteger(parsedAmount) && parsedAmount > 0;

  async function run(action: 'issue' | 'burn') {
    setMessage('');
    setError('');
    try {
      if (action === 'issue') {
        await issueCoins(classId!, user!.uid, parsedAmount, reason.trim() || '국고 발행');
        setMessage(`${parsedAmount.toLocaleString('ko-KR')}코인을 발행했습니다.`);
      } else {
        await burnCoins(classId!, user!.uid, parsedAmount, reason.trim() || '국고 소각');
        setMessage(`${parsedAmount.toLocaleString('ko-KR')}코인을 소각했습니다.`);
      }
      setAmount('');
      setReason('');
    } catch (e) {
      setError(e instanceof Error ? e.message : '처리하지 못했습니다.');
    }
  }

  return (
    <main className="mx-auto max-w-3xl px-4 py-6">
      <header className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-bold text-navy-600">대통령 콘솔 · {formatMonthKo(monthKST())}</p>
          <h1 className="text-2xl font-black text-navy-700">{classDoc.name}</h1>
        </div>
        <div className="flex items-center gap-3">
          <span className="rounded-xl bg-navy-50 px-4 py-2 text-lg font-black tracking-widest text-navy-700">
            {classDoc.classCode}
          </span>
          <Button kind="ghost" onClick={() => signOutAll()}>로그아웃</Button>
        </div>
      </header>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card title="국고 잔액" tone="navy"><p className="text-2xl"><Money amount={treasury} /></p></Card>
        <Card title="통화량(전체 코인)"><p className="text-2xl"><Money amount={-mint} /></p></Card>
        <Card title="등록 학생"><p className="text-2xl font-bold">{studentCount}명</p></Card>
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <Link to="/teacher/students" className="btn rounded-2xl border-2 border-navy-500 bg-white px-5 py-4 text-center text-lg font-bold text-navy-700">
          학생·명단 관리
        </Link>
        <Link to="/teacher/cards" className="btn rounded-2xl border-2 border-navy-500 bg-white px-5 py-4 text-center text-lg font-bold text-navy-700">
          로그인 카드 인쇄
        </Link>
      </div>

      <div className="mt-4">
        <Card title="국고 발행·소각" tone="navy">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="금액(코인)" hint="정수만 입력합니다.">
              <input className={inputClass} inputMode="numeric" value={amount} onChange={(e) => setAmount(e.target.value)} />
            </Field>
            <Field label="사유" hint="감사 로그에 그대로 남습니다.">
              <input className={inputClass} value={reason} onChange={(e) => setReason(e.target.value)} maxLength={100} />
            </Field>
          </div>
          <div className="mt-4 flex flex-wrap gap-3">
            <Button disabled={!amountValid} onClick={() => run('issue')}>국고에 발행</Button>
            <Button kind="danger" disabled={!amountValid || treasury < parsedAmount} onClick={() => setBurnOpen(true)}>
              국고에서 소각
            </Button>
          </div>
          {message && <div className="mt-4"><Notice kind="ok">{message}</Notice></div>}
          {error && <div className="mt-4"><Notice kind="error">{error}</Notice></div>}
          <p className="mt-4 text-sm text-gray-500">
            발행하면 통화량이 늘고, 소각하면 줄어듭니다. 모든 코인 이동은 원장에 영구히 기록됩니다.
          </p>
        </Card>
      </div>

      <div className="mt-4">
        <Card title="최근 거래">
          {rows.length === 0 ? (
            <p className="text-base text-gray-500">아직 거래가 없습니다.</p>
          ) : (
            <ul className="divide-y divide-gray-100">
              {rows.map((tx) => (
                <li key={tx.id} className="flex items-center justify-between gap-3 py-3">
                  <div className="min-w-0">
                    <p className="truncate text-base font-bold">
                      {TX_LABELS[tx.type] ?? tx.type} · {tx.reason}
                    </p>
                    <p className="text-sm text-gray-500">
                      {tx.fromAccount} → {tx.toAccount} · {formatDateTimeKST(tx.createdAt)}
                    </p>
                  </div>
                  <Money amount={tx.amount} />
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      <DangerConfirm
        open={burnOpen}
        title="국고 소각"
        description={<>국고에서 {parsedAmount.toLocaleString('ko-KR')}코인을 없앱니다. 되돌리려면 같은 금액을 다시 발행해야 합니다.</>}
        classCode={classDoc.classCode}
        onCancel={() => setBurnOpen(false)}
        onConfirm={() => { setBurnOpen(false); void run('burn'); }}
      />
    </main>
  );
}
