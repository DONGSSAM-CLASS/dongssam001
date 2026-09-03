import { useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { GlobeWorkspace } from '@/components/GlobeWorkspace';
import { setSessionStatus, updateFollow, watchSession } from '@/lib/sessionService';
import { formatYear } from '@/lib/history';
import { useAuthStore } from '@/store/authStore';
import { useGlobeStore } from '@/store/globeStore';
import type { CameraState, SessionDoc } from '@/types/firestore';

/** 교사용 지구본 — 세션 설정 적용, 수업 모드(따라오기) 전환, 세션 배포/종료 */
export default function TeacherGlobePage() {
  const { sessionId = '' } = useParams();
  const profile = useAuthStore((s) => s.profile);
  const [session, setSession] = useState<(SessionDoc & { id: string }) | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [applied, setApplied] = useState(false);
  const year = useGlobeStore((s) => s.year);

  useEffect(() => {
    if (!profile || profile.role !== 'teacher') return;
    const unsub = watchSession(
      sessionId,
      (s) => {
        setSession(s);
        if (s && !applied) {
          const g = useGlobeStore.getState();
          g.setYear(s.focusYear ?? s.yearRange[0]);
          g.setLayers(s.layers);
          g.setHighlights(s.highlightPolities ?? [], s.highlightFigures ?? []);
          setApplied(true);
        }
      },
      (e) => setError(e.message),
    );
    return () => {
      unsub();
      useGlobeStore.getState().setHighlights([], []);
    };
  }, [sessionId, profile, applied]);

  // 따라오기 모드: 교사의 연대를 세션 문서에 반영한다(학생 화면이 onSnapshot 으로 따라옴).
  // 세션 문서 자체를 의존성에 넣으면 "쓰기 → 스냅샷 → 다시 쓰기" 루프가 되므로 카메라 값은 ref 로 들고 있는다.
  const following = session?.follow?.enabled ?? false;
  const cameraRef = useRef<CameraState>({ lat: 30, lon: 105, zoom: 2.6 });
  if (session && session.follow.camera) cameraRef.current = session.follow.camera;
  // 같은 연대를 두 번 보내지 않도록 마지막으로 보낸 값을 기억한다
  const lastSent = useRef<number | null>(null);

  useEffect(() => {
    if (!following || lastSent.current === year) return;
    const t = setTimeout(() => {
      lastSent.current = year;
      void updateFollow(sessionId, true, year, cameraRef.current).catch((e) => setError((e as Error).message));
    }, 700);
    return () => clearTimeout(t);
  }, [year, following, sessionId]);

  if (error) return <main className="p-6"><p className="text-red-300">{error}</p><Link to="/teacher" className="underline">← 대시보드</Link></main>;

  return (
    <GlobeWorkspace
      header={
        <>
          <Link to="/teacher" className="text-lg font-bold">🌏 History Globe</Link>
          <span className="text-xs text-slate-300 hidden md:inline">{session?.title ?? '세션 불러오는 중…'}</span>
          {session && (
            <div className="flex items-center gap-1 text-xs">
              <button
                type="button"
                onClick={() => {
                  lastSent.current = following ? null : year;
                  void updateFollow(sessionId, !following, year, cameraRef.current).catch((e) => setError((e as Error).message));
                }}
                aria-pressed={following}
                className={`rounded-lg px-2 py-1 font-semibold ${following ? 'bg-amber-400 text-slate-900' : 'bg-slate-700 hover:bg-slate-600'}`}
                title="켜면 학생 화면의 연대가 교사 화면을 따라옵니다"
              >
                {following ? '👣 따라오기 켜짐' : '👣 따라오기'}
              </button>
              {session.status !== 'open' ? (
                <button type="button" className="btn-icon" onClick={() => void setSessionStatus(sessionId, 'open')}>배포</button>
              ) : (
                <button type="button" className="btn-icon" onClick={() => void setSessionStatus(sessionId, 'closed')}>수업 종료</button>
              )}
              <span className="text-slate-400 hidden lg:inline">
                {session.status === 'open' ? '🟢 진행 중' : session.status === 'draft' ? '📝 초안' : '⚪ 종료'} · {formatYear(session.yearRange[0])}~{formatYear(session.yearRange[1])}
              </span>
            </div>
          )}
        </>
      }
    />
  );
}
