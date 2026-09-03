import { useEffect, useRef, useState } from 'react';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { Link, useParams } from 'react-router-dom';
import { GlobeWorkspace } from '@/components/GlobeWorkspace';
import { StudentToolsPanel } from '@/components/panels/StudentToolsPanel';
import { MissionPanel } from '@/components/panels/MissionPanel';
import { db } from '@/lib/firebase';
import { DEFAULT_TRAVEL_RATES, formatYear } from '@/lib/history';
import { watchClassMissions, watchSession } from '@/lib/sessionService';
import { closeWork, openWork } from '@/lib/workService';
import { useAuthStore } from '@/store/authStore';
import { useGlobeStore } from '@/store/globeStore';
import type { MissionDoc, SessionDoc, SubmissionDoc } from '@/types/firestore';

/** 학생용 지구본 — 세션 연결(핀·루트 저장), 미션, 따라오기 모드 */
export default function StudentGlobePage() {
  const { sessionId = '' } = useParams();
  const profile = useAuthStore((s) => s.profile);
  const classDoc = useAuthStore((s) => s.classDoc);
  const [session, setSession] = useState<(SessionDoc & { id: string }) | null>(null);
  const [missions, setMissions] = useState<(MissionDoc & { id: string })[]>([]);
  const [submissions, setSubmissions] = useState<Record<string, SubmissionDoc>>({});
  const [error, setError] = useState<string | null>(null);
  const applied = useRef(false);
  const lastFollowYear = useRef<number | null>(null);

  const uid = profile?.uid ?? null;
  const classId = profile && profile.role === 'student' ? profile.classId : null;
  const number = profile && profile.role === 'student' ? profile.number : null;

  useEffect(() => {
    if (!uid || !classId || number == null) return;
    // 세션 설정과 학생 기록을 병렬로 읽어 대기 시간을 줄인다
    void openWork({ sessionId, classId, number, uid });

    const unsubSession = watchSession(
      sessionId,
      (s) => {
        if (!s) {
          setError('세션을 찾을 수 없습니다.');
          return;
        }
        setSession(s);
        const g = useGlobeStore.getState();
        if (!applied.current) {
          applied.current = true;
          g.setYear(s.focusYear ?? s.yearRange[0]);
          g.setLayers(s.layers);
          g.setHighlights(s.highlightPolities ?? [], s.highlightFigures ?? []);
        }
        // 따라오기: 선생님이 바꾼 연대를 그대로 따라간다
        if (s.follow?.enabled && s.follow.year !== lastFollowYear.current) {
          lastFollowYear.current = s.follow.year;
          g.setYear(s.follow.year);
        }
        if (!s.follow?.enabled) lastFollowYear.current = null;
      },
      (e) => setError(e.message),
    );
    // 학생은 공개된 미션만 조회할 수 있다(규칙 제약과 쿼리를 일치시킨다)
    const unsubMissions = watchClassMissions(classId, sessionId, setMissions, (e) => console.warn('[missions]', e.message), true);
    // 내 제출물만 구독 (규칙상 자기 번호 문서만 읽을 수 있다)
    const unsubSubs = onSnapshot(
      query(collection(db, 'submissions'), where('classId', '==', classId), where('number', '==', number)),
      (snap) => setSubmissions(Object.fromEntries(snap.docs.map((d) => [(d.data() as SubmissionDoc).missionId, d.data() as SubmissionDoc]))),
      () => {},
    );

    return () => {
      unsubSession();
      unsubMissions();
      unsubSubs();
      closeWork();
      useGlobeStore.getState().setHighlights([], []);
    };
  }, [sessionId, uid, classId, number]);

  if (error && !session) return <main className="p-6"><p className="text-red-300">{error}</p><Link to="/student" className="underline">← 돌아가기</Link></main>;
  const rates = classDoc?.settings ?? DEFAULT_TRAVEL_RATES;
  const following = session?.follow?.enabled ?? false;
  const closed = session?.status === 'closed';

  return (
    <GlobeWorkspace
      header={
        <>
          <Link to="/student" className="text-lg font-bold">🌏 History Globe</Link>
          <span className="text-xs text-slate-300 hidden sm:inline">{session?.title ?? '세션 불러오는 중…'} {closed && '(종료됨 · 읽기 전용)'}</span>
          {following && (
            <span className="rounded-lg bg-amber-400 px-2 py-1 text-xs font-bold text-slate-900" role="status">
              👣 선생님을 따라가는 중 · {formatYear(session!.follow.year)}
            </span>
          )}
        </>
      }
      leftExtra={<StudentToolsPanel rates={rates} />}
      rightExtra={
        missions.length > 0 && classId && number != null && uid ? (
          <MissionPanel missions={missions} submissions={submissions} ctx={{ sessionId, classId, number, uid }} readOnly={closed} />
        ) : null
      }
    />
  );
}
