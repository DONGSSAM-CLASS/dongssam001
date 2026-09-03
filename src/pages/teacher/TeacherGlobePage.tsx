import { useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { GlobeWorkspace } from '@/components/GlobeWorkspace';
import { MonitorPanel } from '@/components/panels/MonitorPanel';
import { MissionComposer } from '@/components/panels/MissionComposer';
import { listClassMembers } from '@/lib/classService';
import { exportGlobePng } from '@/lib/exportImage';
import { formatYear } from '@/lib/history';
import {
  setSessionStatus,
  updateFollow,
  watchClassMissions,
  watchClassSubmissions,
  watchSession,
  watchSessionWork,
} from '@/lib/sessionService';
import { useAuthStore } from '@/store/authStore';
import { useGlobeStore } from '@/store/globeStore';
import { useMonitorStore } from '@/store/monitorStore';
import type { CameraState, ClassMemberDoc, MissionDoc, SessionDoc, SubmissionDoc } from '@/types/firestore';

/** 교사용 지구본 — 세션 설정 적용, 따라오기(수업 모드), 학급 실시간 모니터링, 미션 배포 */
export default function TeacherGlobePage() {
  const { sessionId = '' } = useParams();
  const profile = useAuthStore((s) => s.profile);
  const [session, setSession] = useState<(SessionDoc & { id: string }) | null>(null);
  const [members, setMembers] = useState<(ClassMemberDoc & { id: string })[]>([]);
  const [submissions, setSubmissions] = useState<(SubmissionDoc & { id: string })[]>([]);
  const [missions, setMissions] = useState<(MissionDoc & { id: string })[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [note, setNote] = useState<string | null>(null);
  const year = useGlobeStore((s) => s.year);
  const setWorks = useMonitorStore((s) => s.setWorks);
  const resetMonitor = useMonitorStore((s) => s.reset);
  const applied = useRef(false);

  // 세션 구독 + 최초 1회 세션 설정 적용
  useEffect(() => {
    if (!profile || profile.role !== 'teacher') return;
    const unsub = watchSession(
      sessionId,
      (s) => {
        setSession(s);
        if (s && !applied.current) {
          applied.current = true;
          const g = useGlobeStore.getState();
          g.setYear(s.focusYear ?? s.yearRange[0]);
          g.setLayers(s.layers);
          g.setHighlights(s.highlightPolities ?? [], s.highlightFigures ?? []);
        }
      },
      (e) => setError(e.message),
    );
    return () => {
      unsub();
      useGlobeStore.getState().setHighlights([], []);
    };
  }, [sessionId, profile]);

  // 실시간 모니터링 리스너 — 수업 세션 화면에 머무는 동안만 켠다(무료 할당량 절약)
  const classId = session?.classId;
  useEffect(() => {
    if (!classId) return;
    let alive = true;
    void listClassMembers(classId).then((m) => alive && setMembers(m)).catch((e) => alive && setError((e as Error).message));
    const unsubWork = watchSessionWork(sessionId, setWorks, (e) => setError(e.message));
    const unsubSubs = watchClassSubmissions(classId, sessionId, setSubmissions, (e) => setError(e.message));
    const unsubMissions = watchClassMissions(classId, sessionId, setMissions, (e) => setError(e.message));
    return () => {
      alive = false;
      unsubWork();
      unsubSubs();
      unsubMissions();
      resetMonitor();
    };
  }, [classId, sessionId, setWorks, resetMonitor]);

  // 따라오기: 교사의 연대를 세션 문서에 반영한다(학생 화면이 onSnapshot 으로 따라옴).
  // 세션 문서를 의존성에 넣으면 "쓰기 → 스냅샷 → 다시 쓰기" 루프가 되므로 카메라는 ref 로 들고 같은 연대는 다시 보내지 않는다.
  const following = session?.follow?.enabled ?? false;
  const cameraRef = useRef<CameraState>({ lat: 30, lon: 105, zoom: 2.6 });
  if (session?.follow?.camera) cameraRef.current = session.follow.camera;
  const lastSent = useRef<number | null>(null);

  useEffect(() => {
    if (!following || lastSent.current === year) return;
    const t = setTimeout(() => {
      lastSent.current = year;
      void updateFollow(sessionId, true, year, cameraRef.current).catch((e) => setError((e as Error).message));
    }, 700);
    return () => clearTimeout(t);
  }, [year, following, sessionId]);

  const exportPng = () => {
    const ok = exportGlobePng(`${session?.title ?? '수업'}-지구본.png`);
    setNote(ok ? '지구본 화면을 PNG 로 저장했습니다.' : '목록형 보기에서는 지구본 이미지를 저장할 수 없습니다.');
  };

  if (error && !session) return <main className="p-6"><p className="text-red-300">{error}</p><Link to="/teacher" className="underline">← 대시보드</Link></main>;

  return (
    <GlobeWorkspace
      header={
        <>
          <Link to="/teacher" className="text-lg font-bold">🌏 History Globe</Link>
          <span className="text-xs text-slate-300 hidden md:inline">{session?.title ?? '세션 불러오는 중…'}</span>
          {session && (
            <div className="flex items-center gap-1 text-xs flex-wrap">
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
              <Link to={`/teacher/worksheet/${sessionId}`} className="btn-icon">📄 활동지</Link>
              {session.status !== 'open' ? (
                <button type="button" className="btn-icon" onClick={() => void setSessionStatus(sessionId, 'open')}>배포</button>
              ) : (
                <button type="button" className="btn-icon" onClick={() => void setSessionStatus(sessionId, 'closed')}>수업 종료</button>
              )}
              <span className="text-slate-400 hidden lg:inline">
                {session.status === 'open' ? '🟢 진행 중' : session.status === 'draft' ? '📝 초안' : '⚪ 종료'} · {formatYear(session.yearRange[0])}~{formatYear(session.yearRange[1])}
              </span>
              {(error || note) && (
                <span className={`max-w-[16rem] truncate ${error ? 'text-red-300' : 'text-emerald-300'}`} title={error ?? note ?? ''}>
                  {error ?? note}
                </span>
              )}
            </div>
          )}
        </>
      }
      leftExtra={
        session && profile?.role === 'teacher' ? (
          <>
            <MonitorPanel sessionTitle={session.title} members={members} submissions={submissions} missions={missions} onExportPng={exportPng} />
            <MissionComposer teacherId={profile.uid} classId={session.classId} sessionId={sessionId} missions={missions} />
          </>
        ) : null
      }
    />
  );
}
