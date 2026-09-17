import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useSession } from '../store/session';
import { listRoster } from '../lib/rosterService';
import type { RosterDoc } from '../types';
import { Button } from '../components/ui';

/** 학생에게 나눠 줄 로그인 카드. 브라우저 인쇄(Ctrl+P)로 그대로 뽑습니다. */
export default function LoginCards() {
  const { classId, classDoc } = useSession();
  const [roster, setRoster] = useState<RosterDoc[]>([]);

  useEffect(() => {
    if (!classId) return;
    void listRoster(classId).then(setRoster);
  }, [classId]);

  if (!classDoc) return null;

  return (
    <main className="mx-auto max-w-4xl px-4 py-6">
      <div className="no-print mb-5 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-black text-navy-700">로그인 카드 ({roster.length}장)</h1>
        <div className="flex gap-3">
          <Link to="/teacher/students" className="btn rounded-xl border-2 border-navy-500 px-4 py-2 font-bold text-navy-700">
            명단으로
          </Link>
          <Button onClick={() => window.print()}>인쇄하기</Button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {roster.map((r) => (
          <article key={r.number} className="print-card rounded-xl border-2 border-gray-400 p-4">
            <p className="text-sm font-bold text-gray-500">{classDoc.name}</p>
            <p className="mt-1 text-lg font-black">{Number(r.number)}번 {r.name}</p>
            <dl className="mt-3 space-y-1 text-base">
              <div className="flex justify-between"><dt className="text-gray-500">학급 코드</dt>
                <dd className="font-mono text-lg font-black tracking-widest">{classDoc.classCode}</dd></div>
              <div className="flex justify-between"><dt className="text-gray-500">번호</dt>
                <dd className="font-mono text-lg font-black">{Number(r.number)}</dd></div>
              <div className="flex justify-between"><dt className="text-gray-500">PIN</dt>
                <dd className="font-mono text-lg font-black tracking-widest">{r.pin}</dd></div>
            </dl>
            <p className="mt-3 text-xs leading-snug text-gray-500">
              첫 로그인 때 이 PIN을 그대로 입력하세요. 그 PIN이 내 비밀번호가 됩니다.
              다른 사람에게 알려 주지 마세요.
            </p>
          </article>
        ))}
      </div>
    </main>
  );
}
