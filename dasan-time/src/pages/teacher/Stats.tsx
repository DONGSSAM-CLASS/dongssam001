import { useEffect, useMemo, useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { ChartColumn, TriangleAlert } from 'lucide-react';
import { useTeacher } from '../../app/TeacherContext';
import { watchAllEmotions } from '../../lib/db';
import { tallyWords } from '../../components/WordCloud';
import { EmptyState, Loading } from '../../components/States';
import { APP_KINDS, SURVEY_QUESTIONS, UI_TEXT, WEEKDAYS } from '../../content/lessons';
import type { EmotionEntry } from '../../lib/types';

export default function Stats() {
  const { cls, submissions, loading } = useTeacher();
  const [emotions, setEmotions] = useState<EmotionEntry[]>([]);

  useEffect(() => {
    if (!cls) return;
    return watchAllEmotions(cls.id, setEmotions);
  }, [cls]);

  const pre = useMemo(
    () => submissions.filter((s) => s.activityId === 'pre' && s.status === 'submitted'),
    [submissions],
  );
  const post = useMemo(
    () => submissions.filter((s) => s.activityId === 'post' && s.status === 'submitted'),
    [submissions],
  );

  // 앱 종류 분포 (1차시 활동1의 1위 앱 기준)
  const appKindData = useMemo(() => {
    const counts = new Map<string, number>();
    submissions
      .filter((s) => s.activityId === 's1_a1')
      .forEach((s) => {
        const apps = (s.data as { apps?: { kind?: string }[] }).apps ?? [];
        const kind = apps.find((a) => a?.kind)?.kind;
        if (kind) counts.set(kind, (counts.get(kind) ?? 0) + 1);
      });
    return APP_KINDS.map((kind) => ({ name: kind, 학생수: counts.get(kind) ?? 0 }));
  }, [submissions]);

  // 주차별 실천 일수 평균
  const weeklyData = useMemo(() => {
    return [1, 2, 3, 4].map((week) => {
      const items = submissions.filter((s) => s.activityId === `home_w${week}`);
      const days = items.map((s) => {
        const arr = (s.data as { days?: boolean[] }).days ?? [];
        return arr.filter(Boolean).length;
      });
      const avg = days.length > 0 ? days.reduce((a, b) => a + b, 0) / days.length : 0;
      return { name: `${week}주차`, 평균실천일수: Math.round(avg * 10) / 10, n: days.length };
    });
  }, [submissions]);

  const emotionRank = useMemo(() => tallyWords(emotions).slice(0, 10), [emotions]);

  if (loading) return <Loading />;
  if (!cls) return <EmptyState title="학급을 먼저 골라 주세요" description="대시보드에서 학급을 만들어 주세요." />;

  return (
    <div className="flex flex-col gap-5">
      <h1 className="text-2xl font-extrabold">
        <ChartColumn className="mr-2 inline h-6 w-6 text-primary" aria-hidden />
        통계
      </h1>

      <div className="alert alert-warning rounded-2xl" role="note">
        <TriangleAlert className="h-5 w-5 shrink-0" aria-hidden />
        <span>{UI_TEXT.statsCaution}</span>
      </div>

      {/* 사전·사후 문항별 비교 */}
      <section className="card rounded-2xl bg-base-100 shadow-sm">
        <div className="card-body gap-4 p-4">
          <h2 className="card-title text-base">사전 · 사후 마음 점검 비교</h2>
          <p className="text-sm opacity-70">
            사전 응답 n = {pre.length}명 · 사후 응답 n = {post.length}명
          </p>
          {pre.length === 0 && post.length === 0 ? (
            <EmptyState
              title="아직 응답이 없어요"
              description="'수업 진행' 화면에서 사전 점검을 열어 주시면 학생들이 답할 수 있어요."
            />
          ) : (
            SURVEY_QUESTIONS.map((q) => {
              const data = q.options.map((opt) => ({
                name: opt.length > 8 ? `${opt.slice(0, 8)}…` : opt,
                사전: pre.filter((s) => (s.data as Record<string, string>)[q.id] === opt).length,
                사후: post.filter((s) => (s.data as Record<string, string>)[q.id] === opt).length,
              }));
              return (
                <div key={q.id} className="rounded-2xl bg-base-200 p-3">
                  <p className="mb-2 text-sm font-bold">
                    {q.label}
                    {q.postOnly && <span className="ml-1 badge badge-sm rounded-2xl">사후만</span>}
                  </p>
                  <div className="h-56 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={data}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" fontSize={12} />
                        <YAxis allowDecimals={false} fontSize={12} />
                        <Tooltip />
                        <Legend />
                        {!q.postOnly && <Bar dataKey="사전" fill="#b4a0e5" radius={[8, 8, 0, 0]} />}
                        <Bar dataKey="사후" fill="#65c3c8" radius={[8, 8, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </section>

      {/* 앱 종류 분포 */}
      <section className="card rounded-2xl bg-base-100 shadow-sm">
        <div className="card-body gap-3 p-4">
          <h2 className="card-title text-base">가장 오래 쓴 앱 종류 분포</h2>
          <p className="text-xs opacity-70">
            개별 사용 시간 숫자는 이 화면에 나오지 않아요. 앱 종류만 세었어요.
          </p>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={appKindData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" fontSize={12} />
                <YAxis allowDecimals={false} fontSize={12} />
                <Tooltip />
                <Bar dataKey="학생수" fill="#eeaf3a" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </section>

      {/* 감정 낱말 순위 */}
      <section className="card rounded-2xl bg-base-100 shadow-sm">
        <div className="card-body gap-3 p-4">
          <h2 className="card-title text-base">감정 낱말 순위</h2>
          {emotionRank.length === 0 ? (
            <p className="text-sm opacity-70">아직 올라온 낱말이 없어요.</p>
          ) : (
            <ol className="flex flex-col gap-1">
              {emotionRank.map((e, i) => (
                <li key={e.word} className="flex items-center gap-2">
                  <span className="badge badge-primary badge-sm rounded-2xl">{i + 1}</span>
                  <span className="w-24 font-semibold">{e.word}</span>
                  <progress
                    className="progress progress-primary grow"
                    value={e.count}
                    max={emotionRank[0].count}
                  />
                  <span className="w-10 text-right text-sm">{e.count}</span>
                </li>
              ))}
            </ol>
          )}
        </div>
      </section>

      {/* 주차별 실천 일수 */}
      <section className="card rounded-2xl bg-base-100 shadow-sm">
        <div className="card-body gap-3 p-4">
          <h2 className="card-title text-base">4주 차별 실천 일수 평균</h2>
          <p className="text-xs opacity-70">
            한 주는 {WEEKDAYS.length}일이에요. 응답 인원은 막대에 마우스를 올리면 보여요.
          </p>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weeklyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" fontSize={12} />
                <YAxis domain={[0, 7]} fontSize={12} />
                <Tooltip formatter={(v, _n, item) => [`${v}일 (n=${item.payload.n}명)`, '평균 실천 일수']} />
                <Bar dataKey="평균실천일수" fill="#7ad1a8" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </section>
    </div>
  );
}
