import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { GlobeWorkspace } from '@/components/GlobeWorkspace';
import { StudentToolsPanel } from '@/components/panels/StudentToolsPanel';
import { DEFAULT_TRAVEL_RATES } from '@/lib/history';
import { closeWork, openWork } from '@/lib/workService';

/** 자유 탐색(로그인 불필요) — 핀·루트는 이 기기(localStorage)에만 저장 */
export default function GlobePage() {
  useEffect(() => {
    void openWork({ sessionId: null, classId: null, number: null, uid: null });
    return () => closeWork();
  }, []);
  return (
    <GlobeWorkspace
      header={
        <>
          <Link to="/" className="text-lg font-bold">🌏 History Globe</Link>
          <span className="text-xs text-slate-400 hidden sm:inline">자유 탐색 모드 · 기록은 이 기기에만 저장</span>
        </>
      }
      leftExtra={<StudentToolsPanel rates={DEFAULT_TRAVEL_RATES} />}
    />
  );
}
