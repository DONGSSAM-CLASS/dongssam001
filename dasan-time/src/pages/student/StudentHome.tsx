import { Link, useLocation } from 'react-router-dom';
import { CircleCheck, Lock, PencilLine, Award, Sparkles } from 'lucide-react';
import { useAuth } from '../../app/AuthContext';
import { useData } from '../../app/DataContext';
import { Loading } from '../../components/States';
import ReadAloudButton from '../../components/ReadAloudButton';
import RubricCard from '../../components/RubricCard';
import { ACTIVITY_IDS, APP, SESSIONS, type ActivityId, type SessionKey } from '../../content/lessons';

/** 차시별로 가야 할 주소 */
const SESSION_PATH: Record<SessionKey, string> = {
  pre: 'survey/pre',
  s1: 's1',
  s2: 's2',
  s3: 's3',
  home: 'home',
  post: 'survey/post',
};

export default function StudentHome() {
  const { mode } = useAuth();
  const { cls, submissions, loading, displayName } = useData();
  const location = useLocation();
  const base = location.pathname.startsWith('/trial') ? '/trial' : '/student';

  if (loading || !cls) return <Loading />;

  const submittedCount = ACTIVITY_IDS.filter((id) => submissions[id]?.status === 'submitted').length;
  const progress = Math.round((submittedCount / ACTIVITY_IDS.length) * 100);
  const homeDone = (['home_w1', 'home_w2', 'home_w3', 'home_w4'] as ActivityId[]).every(
    (id) => submissions[id]?.status === 'submitted',
  );

  const greeting = `안녕하세요, ${displayName}님! 오늘도 한 걸음씩 가 봐요.`;

  return (
    <div className="flex flex-col gap-5">
      <section className="card rounded-2xl bg-base-100 shadow-sm">
        <div className="card-body gap-3 p-5">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <h1 className="text-xl font-extrabold">{greeting}</h1>
              <p className="text-sm opacity-70">
                {mode === 'trial' ? '체험 학급' : `${cls.school} · ${cls.name}`}
              </p>
            </div>
            <ReadAloudButton text={`${greeting} ${APP.subtitle}`} />
          </div>
          <div>
            <div className="mb-1 flex items-center justify-between text-sm">
              <span className="font-semibold">지금까지 제출한 활동</span>
              <span>
                {submittedCount} / {ACTIVITY_IDS.length}
              </span>
            </div>
            <progress
              className="progress progress-primary w-full"
              value={progress}
              max={100}
              aria-label={`진행률 ${progress}퍼센트`}
            />
          </div>
        </div>
      </section>

      {cls.commonTime && (
        <div className="alert rounded-2xl border border-success/40 bg-success/10" role="status">
          <Sparkles className="h-5 w-5 shrink-0 text-success" aria-hidden />
          <span>
            우리 반 함께하는 시간: {cls.commonTime.start}~{cls.commonTime.end}, 이 시간엔 서로 알림
            보내지 않기!
          </span>
        </div>
      )}

      <RubricCard sessionKey="s1" />

      {/* 여정 지도 — 징검다리 카드 */}
      <section>
        <h2 className="mb-3 text-lg font-extrabold">여정 지도</h2>
        <ol className="flex flex-col gap-3">
          {SESSIONS.map((session, index) => {
            const state = cls.sessions[session.key];
            const total = session.activities.length;
            const done = session.activities.filter(
              (id) => submissions[id]?.status === 'submitted',
            ).length;
            const isDone = done === total && total > 0;
            const isLocked = state === 'locked';

            const StatusIcon = isLocked ? Lock : isDone ? CircleCheck : PencilLine;
            const statusText = isLocked ? '잠김' : isDone ? '완료' : '진행 중';
            const colorClass = {
              primary: 'border-primary/50',
              secondary: 'border-secondary/50',
              accent: 'border-accent/50',
              success: 'border-success/50',
              info: 'border-info/50',
            }[session.color];

            const card = (
              <div
                className={`card rounded-2xl border-2 bg-base-100 shadow-sm ${colorClass} ${
                  isLocked ? 'opacity-55' : ''
                }`}
                // 징검다리처럼 좌우로 살짝 어긋나게 둔다.
                style={{ marginLeft: index % 2 === 1 ? '1.25rem' : 0 }}
              >
                <div className="card-body flex-row items-center gap-3 p-4">
                  <StatusIcon className="h-7 w-7 shrink-0" aria-hidden />
                  <div className="grow">
                    <p className="font-bold">{session.title}</p>
                    <p className="text-sm opacity-75">{session.goal}</p>
                    <p className="mt-1 text-xs opacity-60">
                      {statusText}
                      {total > 0 && ` · ${done}/${total} 제출`}
                    </p>
                  </div>
                </div>
              </div>
            );

            return (
              <li key={session.key}>
                {isLocked ? (
                  <div aria-disabled>{card}</div>
                ) : (
                  <Link to={`${base}/${SESSION_PATH[session.key]}`} className="block">
                    {card}
                  </Link>
                )}
              </li>
            );
          })}
        </ol>
      </section>

      {homeDone && (
        <section className="card rounded-2xl border-2 border-success bg-success/10 shadow-sm">
          <div className="card-body items-center gap-2 p-6 text-center">
            <Award className="h-12 w-12 text-success" aria-hidden />
            <p className="text-lg font-extrabold">다산초당 4주 완주 배지</p>
            <p className="text-sm opacity-80">4주 동안 솔직하게 기록했어요. 정말 잘했어요!</p>
          </div>
        </section>
      )}
    </div>
  );
}
