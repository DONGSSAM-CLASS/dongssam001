import { forwardRef } from 'react';
import { renderValue } from '../pages/teacher/Dashboard';
import { ACTIVITY_LABEL, APP, type ActivityId } from '../content/lessons';
import type { ClassDoc, StudentProfile, Submission } from '../lib/types';

/** 특정 활동 하나를 학급 전체 학생 것으로 모아 보는 인쇄물 */
const ActivityReport = forwardRef<
  HTMLDivElement,
  {
    cls: ClassDoc;
    activityId: ActivityId;
    students: StudentProfile[];
    submissions: Map<string, Submission>;
    includeUsageNumbers: boolean;
  }
>(function ActivityReport({ cls, activityId, students, submissions, includeUsageNumbers }, ref) {
  const usageKeys = new Set(['hours', 'minutes', 'apps']);

  return (
    <div
      ref={ref}
      className="mx-auto w-[794px] bg-white p-10 text-[13px] leading-relaxed text-[#2b2430]"
      style={{ fontFamily: 'var(--font-sans)' }}
    >
      <header className="border-b-4 border-[#a8ddcb] pb-4">
        <p className="text-sm font-bold text-[#1f5f4d]">{APP.name}</p>
        <h1 className="mt-1 text-2xl font-extrabold">{ACTIVITY_LABEL[activityId]}</h1>
        <p className="mt-1 text-sm opacity-70">
          {cls.school} · {cls.name} · {cls.teacherName} 선생님
        </p>
      </header>

      {students.map((st) => {
        const sub = submissions.get(`${st.uid}_${activityId}`);
        const entries = Object.entries(sub?.data ?? {}).filter(
          ([key]) => includeUsageNumbers || !usageKeys.has(key),
        );
        return (
          <section key={st.uid} className="mt-5 break-inside-avoid border-b border-[#e0e7e4] pb-4">
            <h2 className="font-extrabold">
              {st.number}. {st.name}
              <span className="ml-2 text-[12px] font-normal opacity-60">
                {sub?.status === 'submitted' ? '제출' : sub ? '작성 중' : '미시작'}
              </span>
            </h2>
            {entries.length === 0 ? (
              <p className="text-[12px] opacity-60">기록이 없습니다.</p>
            ) : (
              <dl className="mt-1 space-y-1">
                {entries.map(([key, value]) => (
                  <div key={key} className="flex gap-2">
                    <dt className="w-28 shrink-0 text-[12px] font-bold opacity-70">{key}</dt>
                    <dd className="whitespace-pre-wrap break-words text-[12px]">
                      {renderValue(value)}
                    </dd>
                  </div>
                ))}
              </dl>
            )}
          </section>
        );
      })}
    </div>
  );
});

export default ActivityReport;
