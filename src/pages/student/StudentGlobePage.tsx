import { useEffect, useState } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { Link, useParams } from 'react-router-dom';
import { GlobeWorkspace } from '@/components/GlobeWorkspace';
import { StudentToolsPanel } from '@/components/panels/StudentToolsPanel';
import { db } from '@/lib/firebase';
import { DEFAULT_TRAVEL_RATES } from '@/lib/history';
import { closeWork, openWork } from '@/lib/workService';
import { useAuthStore } from '@/store/authStore';
import { useGlobeStore } from '@/store/globeStore';
import type { SessionDoc } from '@/types/firestore';

/** 학생용 지구본 — 수업 세션에 연결되어 핀·루트가 Firestore 에 저장된다 */
export default function StudentGlobePage() {
  const { sessionId = '' } = useParams();
  const profile = useAuthStore((s) => s.profile);
  const classDoc = useAuthStore((s) => s.classDoc);
  // 프로필 객체는 갱신될 때마다 새로 만들어지므로, 효과는 실제로 달라지는 값에만 반응하게 한다
  const uid = profile?.uid ?? null;
  const classId = profile && profile.role === 'student' ? profile.classId : null;
  const number = profile && profile.role === 'student' ? profile.number : null;
  const [session, setSession] = useState<SessionDoc | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!uid || !classId || number == null) return;
    let cancelled = false;
    // 세션 설정과 학생 기록을 병렬로 읽어 대기 시간을 줄인다
    void openWork({ sessionId, classId, number, uid });
    getDoc(doc(db, 'sessions', sessionId))
      .then((snap) => {
        if (cancelled) return;
        if (!snap.exists()) throw new Error('세션을 찾을 수 없습니다.');
        const s = snap.data() as SessionDoc;
        setSession(s);
        const g = useGlobeStore.getState();
        g.setYear(s.focusYear ?? s.yearRange[0]);
        g.setLayers(s.layers);
        g.setHighlights(s.highlightPolities ?? [], s.highlightFigures ?? []);
      })
      .catch((e) => !cancelled && setError((e as Error).message));
    return () => {
      cancelled = true;
      closeWork();
      useGlobeStore.getState().setHighlights([], []);
    };
  }, [sessionId, uid, classId, number]);

  if (error) return <main className="p-6"><p className="text-red-300">{error}</p><Link to="/student" className="underline">← 돌아가기</Link></main>;
  const rates = classDoc?.settings ?? DEFAULT_TRAVEL_RATES;
  return (
    <GlobeWorkspace
      header={
        <>
          <Link to="/student" className="text-lg font-bold">🌏 History Globe</Link>
          <span className="text-xs text-slate-300 hidden sm:inline">{session?.title ?? '세션 불러오는 중…'} {session?.status === 'closed' && '(종료됨 · 읽기 전용)'}</span>
        </>
      }
      leftExtra={<StudentToolsPanel rates={rates} />}
    />
  );
}
