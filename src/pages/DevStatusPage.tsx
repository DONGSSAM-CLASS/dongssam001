import { useEffect, useState } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { Link } from 'react-router-dom';
import { dataset } from '@/data';
import { db, firebaseConfig, isFirebaseConfigured, useEmulators } from '@/lib/firebase';

type Probe = { state: 'idle' | 'ok' | 'error'; message: string };

/** 1단계 점검 페이지: 정적 데이터 로드 · Firebase 연결 · 규칙(공개 문서 읽기) 확인 */
export default function DevStatusPage() {
  const [probe, setProbe] = useState<Probe>({ state: 'idle', message: '확인 중…' });

  useEffect(() => {
    // class_codes/{code} 는 로그인 없이 get 이 허용되는 유일한 문서 → 연결 + 규칙 배포 확인용
    getDoc(doc(db, 'class_codes', 'ZZZZZZ'))
      .then((snap) => setProbe({ state: 'ok', message: snap.exists() ? '문서 있음' : 'Firestore 연결 OK (문서 없음 — 정상)' }))
      .catch((err: unknown) => setProbe({ state: 'error', message: err instanceof Error ? err.message : String(err) }));
  }, []);

  const rows: [string, string][] = [
    ['Firebase 설정(.env)', isFirebaseConfigured ? `projectId=${firebaseConfig.projectId}` : '없음 — .env 를 만들어 주세요'],
    ['에뮬레이터 사용', useEmulators ? '예 (VITE_USE_EMULATORS=true)' : '아니오'],
    ['Firestore 연결', `${probe.state === 'ok' ? '✅' : probe.state === 'error' ? '❌' : '⏳'} ${probe.message}`],
    ['왕조·국가', String(dataset.polities.length)],
    ['인물', String(dataset.figures.length)],
    ['장소', String(dataset.places.length)],
    ['사건', String(dataset.events.length)],
    ['교역로', String(dataset.routes.length)],
    ['성취기준', `${dataset.achievement_standards.length} (역사① ${count('역사①')} / 역사② ${count('역사②')} / 세계사 ${count('세계사')} / 동아시아 역사 기행 ${count('동아시아 역사 기행')})`],
  ];

  function count(subject: string) {
    return dataset.achievement_standards.filter((s) => s.subject === subject).length;
  }

  return (
    <main className="p-6 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold">개발 상태 (1단계 점검)</h1>
      <table className="mt-4 w-full text-sm border-collapse">
        <tbody>
          {rows.map(([k, v]) => (
            <tr key={k} className="border-b border-slate-700">
              <th scope="row" className="text-left py-2 pr-4 text-slate-300 w-48">{k}</th>
              <td className="py-2">{v}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="mt-6 text-sm"><Link className="underline" to="/">← 처음으로</Link></p>
    </main>
  );
}
