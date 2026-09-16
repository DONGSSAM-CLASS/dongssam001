import { forwardRef } from 'react';
import PassCard from '../components/PassCard';
import { renderValue } from '../pages/teacher/Dashboard';
import {
  ACTIVITY_IDS,
  ACTIVITY_LABEL,
  APP,
  RUBRIC,
  SELF_EVAL_ITEMS,
  WEEKDAYS,
  type ActivityId,
} from '../content/lessons';
import type { ClassDoc, Evaluation, PassCardData, StudentProfile, Submission } from '../lib/types';

export interface ReportInput {
  cls: ClassDoc;
  student: StudentProfile;
  submissions: Map<string, Submission>;
  evaluations: Map<string, Evaluation>;
  /** 사용 시간 숫자를 넣을지 (기본은 넣지 않음) */
  includeUsageNumbers: boolean;
}

/** 사용 시간처럼 민감한 값이 들어 있는 칸 */
const USAGE_KEYS = new Set(['hours', 'minutes', 'apps']);

/**
 * 학생 개인 포트폴리오 (A4 세로, PDF 캡처용).
 * 캡처가 정확하도록 daisyUI 색 변수 대신 고정 색을 쓴다.
 */
const StudentReport = forwardRef<HTMLDivElement, ReportInput>(function StudentReport(
  { cls, student, submissions, evaluations, includeUsageNumbers },
  ref,
) {
  const get = (id: ActivityId) => submissions.get(`${student.uid}_${id}`);
  const pass = get('s3_a5')?.data as Partial<PassCardData> | undefined;

  return (
    <div
      ref={ref}
      className="mx-auto w-[794px] bg-white p-10 text-[13px] leading-relaxed text-[#2b2430]"
      style={{ fontFamily: 'var(--font-sans)' }}
    >
      {/* 표지 */}
      <header className="border-b-4 border-[#e5a6c4] pb-5">
        <p className="text-sm font-bold text-[#a86a8c]">{APP.name}</p>
        <h1 className="mt-1 text-3xl font-extrabold">학생 포트폴리오</h1>
        <p className="mt-1 text-sm opacity-70">{APP.subtitle}</p>
        <dl className="mt-5 grid grid-cols-2 gap-x-6 gap-y-1 text-sm">
          <Info label="학교" value={cls.school} />
          <Info label="학급" value={cls.name} />
          <Info label="번호" value={String(student.number)} />
          <Info label="이름" value={student.name} />
          <Info
            label="기간"
            value={`${cls.createdAt ? new Date(cls.createdAt).toLocaleDateString('ko-KR') : '—'} ~ ${new Date().toLocaleDateString('ko-KR')}`}
          />
          <Info label="모둠" value={student.group ? `${student.group}모둠` : '미배정'} />
        </dl>
      </header>

      <Section title="1. 사전 마음 점검">
        <KeyValues submission={get('pre')} includeUsageNumbers={includeUsageNumbers} />
      </Section>

      <Section title="2. 1차시 · 단절의 두 얼굴">
        {(['s1_a1', 's1_a2', 's1_a3', 's1_reflect'] as ActivityId[]).map((id) => (
          <SubBlock key={id} id={id} submission={get(id)} includeUsageNumbers={includeUsageNumbers} />
        ))}
      </Section>

      <Section title="3. 2차시 · 알고리즘의 노예 vs 초서의 주인">
        {(['s2_a4_2', 's2_a4_3', 's2_reflect'] as ActivityId[]).map((id) => (
          <SubBlock key={id} id={id} submission={get(id)} includeUsageNumbers={includeUsageNumbers} />
        ))}
      </Section>

      <Section title="4. 3차시 · 나만의 다산초당 출입증">
        {pass && (
          <div className="my-3">
            <PassCard
              card={{
                app: pass.app ?? '',
                time: pass.time ?? '',
                alt: pass.alt ?? '',
                pledge: pass.pledge ?? '',
                color: pass.color ?? 'pink',
                sticker: pass.sticker ?? '🌿',
                revised: pass.revised,
                revisedNote: pass.revisedNote,
              }}
              ownerLabel={`${student.name} · ${cls.name}`}
              commonTime={cls.commonTime ?? undefined}
            />
          </div>
        )}
        <SubBlock id="s3_self" submission={get('s3_self')} includeUsageNumbers={includeUsageNumbers} />
        <SelfEvalTable submission={get('s3_self')} />
      </Section>

      <Section title="5. 4주 자기점검 기록">
        <table className="w-full border-collapse text-[12px]">
          <thead>
            <tr className="bg-[#f6eef5]">
              <th className="border border-[#e0d3dd] p-2 text-left">주차</th>
              <th className="border border-[#e0d3dd] p-2 text-left">지킨 날</th>
              <th className="border border-[#e0d3dd] p-2 text-left">어려웠던 상황</th>
              <th className="border border-[#e0d3dd] p-2 text-left">규칙 수정</th>
              <th className="border border-[#e0d3dd] p-2 text-left">나에게 한 줄 칭찬</th>
            </tr>
          </thead>
          <tbody>
            {[1, 2, 3, 4].map((week) => {
              const sub = get(`home_w${week}` as ActivityId);
              const d = (sub?.data ?? {}) as {
                days?: boolean[];
                obstacle?: string;
                obstacleNote?: string;
                ruleEdit?: string;
                praise?: string;
              };
              const kept = (d.days ?? []).filter(Boolean).length;
              return (
                <tr key={week}>
                  <td className="border border-[#e0d3dd] p-2">{week}주차</td>
                  <td className="border border-[#e0d3dd] p-2">
                    {sub ? `${kept} / ${WEEKDAYS.length}일` : '—'}
                  </td>
                  <td className="border border-[#e0d3dd] p-2">
                    {[d.obstacle, d.obstacleNote].filter(Boolean).join(' · ') || '—'}
                  </td>
                  <td className="border border-[#e0d3dd] p-2">{d.ruleEdit || '—'}</td>
                  <td className="border border-[#e0d3dd] p-2">{d.praise || '—'}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </Section>

      <Section title="6. 사후 마음 점검">
        <KeyValues submission={get('post')} includeUsageNumbers={includeUsageNumbers} />
      </Section>

      <Section title="7. 교사 평가와 메모">
        <table className="w-full border-collapse text-[12px]">
          <thead>
            <tr className="bg-[#f6eef5]">
              <th className="border border-[#e0d3dd] p-2 text-left">평가 기준</th>
              <th className="border border-[#e0d3dd] p-2 text-left">등급</th>
              <th className="border border-[#e0d3dd] p-2 text-left">교사 메모</th>
            </tr>
          </thead>
          <tbody>
            {(
              [
                ['s1_a1', RUBRIC[0]],
                ['s2_a4_1', RUBRIC[1]],
                ['s3_a5', RUBRIC[2]],
              ] as const
            ).map(([activityId, rubric]) => {
              const ev = evaluations.get(`${student.uid}_${activityId}`);
              return (
                <tr key={rubric.id}>
                  <td className="border border-[#e0d3dd] p-2">{rubric.formal}</td>
                  <td className="border border-[#e0d3dd] p-2">{ev?.grade || '—'}</td>
                  <td className="border border-[#e0d3dd] p-2">{ev?.memo || '—'}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </Section>

      {/* 세부능력 및 특기사항 작성 참고 메모 */}
      <Section title="8. 세부능력 및 특기사항 작성 참고 메모">
        <p className="mb-2 text-[12px] opacity-70">
          아래는 학생이 직접 쓴 문장과 교사 평가 등급을 그대로 모아 놓은 것입니다.
        </p>
        <ul className="list-inside list-disc space-y-1">
          <QuoteItem label="시간의 주도성 설명" text={strOf(get('s2_a4_3'), 'answer')} />
          <QuoteItem label="주도성 다짐" text={strOf(get('s3_a5'), 'pledge')} />
          <QuoteItem label="운영 시간과 대안 활동" text={`${strOf(get('s3_a5'), 'time')} / ${strOf(get('s3_a5'), 'alt')}`} />
          {[1, 2, 3, 4].map((w) => {
            const text = strOf(get(`home_w${w}` as ActivityId), 'ruleEdit');
            return text ? <QuoteItem key={w} label={`${w}주차 규칙 수정`} text={text} /> : null;
          })}
          <QuoteItem label="3차시 성찰" text={strOf(get('s3_self'), 'memorable')} />
        </ul>
        <p className="mt-4 rounded-xl bg-[#fdf2d3] p-3 text-[12px] font-bold">
          최종 기재 문장은 선생님이 직접 확인·작성해 주세요.
        </p>
      </Section>

      <footer className="mt-8 border-t border-[#e0d3dd] pt-3 text-center text-[11px] opacity-60">
        {APP.name} · {cls.school} {cls.name} · {cls.teacherName} 선생님
      </footer>
    </div>
  );
});

function strOf(sub: Submission | undefined, key: string): string {
  const value = (sub?.data ?? {})[key];
  return typeof value === 'string' ? value : '';
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-2">
      <dt className="w-14 shrink-0 font-bold opacity-70">{label}</dt>
      <dd>{value || '—'}</dd>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-6">
      <h2 className="mb-2 border-l-4 border-[#e5a6c4] pl-2 text-lg font-extrabold">{title}</h2>
      {children}
    </section>
  );
}

function SubBlock({
  id,
  submission,
  includeUsageNumbers,
}: {
  id: ActivityId;
  submission?: Submission;
  includeUsageNumbers: boolean;
}) {
  return (
    <div className="mt-3">
      <h3 className="text-[13px] font-bold">{ACTIVITY_LABEL[id]}</h3>
      <KeyValues submission={submission} includeUsageNumbers={includeUsageNumbers} />
      {submission?.praise && (
        <p className="mt-1 rounded-xl bg-[#dff3ec] p-2 text-[12px]">
          <b>선생님 한마디 </b>
          {submission.praise}
        </p>
      )}
    </div>
  );
}

function KeyValues({
  submission,
  includeUsageNumbers,
}: {
  submission?: Submission;
  includeUsageNumbers: boolean;
}) {
  if (!submission || Object.keys(submission.data).length === 0) {
    return <p className="text-[12px] opacity-60">기록이 없습니다.</p>;
  }
  const entries = Object.entries(submission.data).filter(
    ([key]) => includeUsageNumbers || !USAGE_KEYS.has(key),
  );
  if (entries.length === 0) {
    return <p className="text-[12px] opacity-60">(사용 시간 숫자는 제외했습니다.)</p>;
  }
  return (
    <dl className="mt-1 space-y-1">
      {entries.map(([key, value]) => (
        <div key={key} className="flex gap-2">
          <dt className="w-28 shrink-0 text-[12px] font-bold opacity-70">{key}</dt>
          <dd className="whitespace-pre-wrap break-words text-[12px]">{renderValue(value)}</dd>
        </div>
      ))}
    </dl>
  );
}

function SelfEvalTable({ submission }: { submission?: Submission }) {
  const data = (submission?.data ?? {}) as Record<string, number>;
  return (
    <table className="mt-2 w-full border-collapse text-[12px]">
      <tbody>
        {SELF_EVAL_ITEMS.map((item) => (
          <tr key={item.id}>
            <th className="border border-[#e0d3dd] p-2 text-left font-semibold">{item.label}</th>
            <td className="border border-[#e0d3dd] p-2">
              {data[item.id] ? '★'.repeat(Number(data[item.id])) : '—'}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function QuoteItem({ label, text }: { label: string; text: string }) {
  if (!text.trim()) return null;
  return (
    <li>
      <b>{label}: </b>
      <span>“{text}”</span>
    </li>
  );
}

export { ACTIVITY_IDS };
export default StudentReport;
