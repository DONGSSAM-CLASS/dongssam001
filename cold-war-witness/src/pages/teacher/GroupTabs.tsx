/**
 * 교사 대시보드 — 모둠 프로젝트 탭
 *  - 모둠 현황: 모둠원·역할·사건 파일·기획서 상태·제작 단계·제출
 *  - 기획서 검토: 기획서·윤리 점검·동료 검토를 읽고 승인 또는 고칠 점 보내기
 *  - 발표·평가: 모둠별 평균 별점과 피드백, 모둠 발표 화면
 */
import { useState } from 'react';
import {
  Bot,
  CheckCheck,
  CircleCheckBig,
  ExternalLink,
  MessageSquareWarning,
  Presentation,
  ShieldCheck,
  ThumbsUp,
  TriangleAlert,
  Wand2,
} from 'lucide-react';
import { Button, LinkButton, Notice, TextArea, friendlyError } from '../../components/ui';
import { StarMean } from '../../components/project';
import { PlanReadOnly } from '../student/project/ReviewPage';
import { CHAPTERS } from '../../data/scenarios';
import { ETHICS_CHECKS, FORMATS, HISTORY_CHECKS, ROLES, RUBRIC, STAGES } from '../../data/project';
import { getPrinciple } from '../../data/principles';
import { reviewPlanAsTeacher } from '../../lib/db';
import { averageScores, checksDone, groupLabel, membersOf, missingRoles } from '../../lib/project';
import type { ClassRecord, FinalReviewDoc, GroupRecord, PlanReviewDoc, PlanStatus, ReviewRecord, StudentRecord } from '../../types/db';

const STATUS: Record<PlanStatus, { label: string; cls: string }> = {
  draft: { label: '작성 중', cls: 'bg-base-200 text-ink' },
  submitted: { label: '제출 — 검토 필요', cls: 'bg-[#fff4dc] text-[#5c3a00]' },
  approved: { label: '승인', cls: 'bg-[#e4f6f1] text-[#13513f]' },
  revise: { label: '고칠 점 보냄', cls: 'bg-[#fdebef] text-[#7d1530]' },
};
const roleShort = (id: string) => ROLES.find((r) => r.id === id)?.name.split(' (')[0] ?? id;

export function StatusBadge({ status }: { status: PlanStatus }) {
  return <span className={`rounded-full px-2.5 py-0.5 text-[14px] font-bold ${STATUS[status].cls}`}>{STATUS[status].label}</span>;
}

/* ─────────────── 모둠 현황 ─────────────── */

export function GroupsTab({ cls, groups, students }: { cls: ClassRecord; groups: GroupRecord[]; students: StudentRecord[] }) {
  if (cls.groupCount === 0) return <p className="text-ink-soft">위의 ‘모둠 수’를 정하면 모둠이 만들어져요.</p>;
  const visible = groups.filter((g) => g.no <= cls.groupCount);
  const noGroup = students.filter((s) => s.groupNo === 0 || s.groupNo > cls.groupCount);
  return (
    <div className="flex flex-col gap-4">
      {noGroup.length > 0 && (
        <Notice tone="warn">
          모둠이 없는 학생 {noGroup.length}명: {noGroup.map((s) => `${s.number}번 ${s.nickname}`).join(', ')} — ‘개인 현황’ 탭에서 모둠을 정해 줄 수 있어요.
        </Notice>
      )}
      <ul className="grid gap-3 lg:grid-cols-2">
        {visible.map((g) => {
          const list = membersOf(g.members);
          const miss = missingRoles(g.members);
          const pc = checksDone(g.planChecks);
          const fc = checksDone(g.finalChecks);
          const ch = CHAPTERS.find((c) => c.id === g.caseId);
          const fmt = FORMATS.find((f) => f.id === g.plan.format);
          return (
            <li key={g.id} className="dossier flex flex-col gap-2 p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="typewriter text-lg font-bold">{groupLabel(g)}</h3>
                <StatusBadge status={g.planStatus} />
              </div>
              <p className="text-[15px]">
                {list.length ? list.map((m) => `${m.number} ${m.nickname}${m.roles.length ? `(${m.roles.map(roleShort).join('·')})` : ''}`).join(', ') : '모둠원 없음'}
              </p>
              {list.length > 0 && miss.length > 0 && (
                <p className="flex items-center gap-1 text-[14px] font-bold text-[#8a4b00]">
                  <TriangleAlert className="h-4 w-4" aria-hidden="true" />
                  빈 역할: {miss.map(roleShort).join(', ')}
                </p>
              )}
              <dl className="grid grid-cols-[6.5rem_1fr] gap-x-2 text-[15px]">
                <dt className="text-ink-soft">사건 파일</dt>
                <dd>{ch ? `「${ch.title}」` : '—'}</dd>
                <dt className="text-ink-soft">형식 · 제목</dt>
                <dd>
                  {fmt?.name ?? '—'} · {g.plan.title || '—'}
                </dd>
                <dt className="text-ink-soft">윤리 점검</dt>
                <dd>
                  기획 {pc.done}/{pc.total} · 최종 {fc.done}/{fc.total}
                </dd>
                <dt className="text-ink-soft">제작 단계</dt>
                <dd>{STAGES.find((s) => s.id === g.stage)?.name}</dd>
                <dt className="text-ink-soft">제출</dt>
                <dd>
                  {g.submission ? (
                    <a href={g.submission.url} target="_blank" rel="noopener noreferrer" className="link inline-flex items-center gap-1 break-all">
                      <ExternalLink className="h-4 w-4 shrink-0" aria-hidden="true" />
                      작품 링크
                    </a>
                  ) : (
                    '—'
                  )}
                </dd>
              </dl>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

/* ─────────────── 기획서 검토 ─────────────── */

export function PlansTab({ cls, groups, reviews }: { cls: ClassRecord; groups: GroupRecord[]; reviews: ReviewRecord[] }) {
  const visible = groups.filter((g) => g.no <= cls.groupCount);
  const firstSubmitted = visible.find((g) => g.planStatus === 'submitted') ?? visible[0];
  const [no, setNo] = useState<number | null>(firstSubmitted?.no ?? null);
  const g = visible.find((x) => x.no === no) ?? firstSubmitted;
  if (!g) return <p className="text-ink-soft">모둠이 아직 없어요.</p>;
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap gap-2" role="group" aria-label="모둠 고르기">
        {visible.map((x) => (
          <button
            key={x.id}
            type="button"
            aria-pressed={x.no === g.no}
            onClick={() => setNo(x.no)}
            className={`btn h-auto min-h-11 rounded-full px-4 ${x.no === g.no ? 'btn-neutral' : 'border-base-300 bg-white'}`}
          >
            {x.no}모둠
            {x.planStatus === 'submitted' && <span className="badge badge-warning badge-sm">검토</span>}
            {x.planStatus === 'approved' && <CircleCheckBig className="h-4 w-4" aria-label="승인" />}
          </button>
        ))}
      </div>
      <PlanReviewPanel key={g.id} cls={cls} g={g} reviews={reviews} />
    </div>
  );
}

function PlanReviewPanel({ cls, g, reviews }: { cls: ClassRecord; g: GroupRecord; reviews: ReviewRecord[] }) {
  const [comment, setComment] = useState(g.teacherComment);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ tone: 'ok' | 'error'; text: string } | null>(null);
  const planRev = reviews.filter((r): r is ReviewRecord & PlanReviewDoc => r.kind === 'plan' && r.toGroup === g.no);
  const unchecked = [...ETHICS_CHECKS.map((c) => ({ id: c.id, text: `${getPrinciple(c.principleId).name}: ${c.question}` })), ...HISTORY_CHECKS.map((c) => ({ id: c.id, text: `역사: ${c.question}` }))].filter(
    (c) => !g.planChecks[c.id],
  );

  const decide = async (status: PlanStatus) => {
    setBusy(true);
    setMsg(null);
    try {
      await reviewPlanAsTeacher(cls.id, g.no, status, comment.trim());
      setMsg({ tone: 'ok', text: status === 'approved' ? '승인했어요. 학생 화면에 바로 보여요.' : '고칠 점을 보냈어요.' });
    } catch (e) {
      setMsg({ tone: 'error', text: friendlyError(e) });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_22rem]">
      <section className="dossier flex flex-col gap-3 p-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="typewriter text-xl font-bold">
            {groupLabel(g)} — {g.plan.title || '(제목 없음)'}
          </h3>
          <StatusBadge status={g.planStatus} />
        </div>
        <PlanReadOnly g={g} />
        {unchecked.length > 0 && (
          <details className="rounded-box bg-[#fff4dc] p-3 text-[15px] text-[#5c3a00]">
            <summary className="cursor-pointer font-bold">아직 체크하지 않은 점검 문항 {unchecked.length}개</summary>
            <ul className="mt-1 list-disc pl-5">
              {unchecked.map((c) => (
                <li key={c.id}>{c.text}</li>
              ))}
            </ul>
          </details>
        )}
      </section>
      <aside className="flex flex-col gap-3">
        <section className="dossier flex flex-col gap-2 p-4">
          <h4 className="font-bold">동료 검토 ({planRev.length})</h4>
          {planRev.length === 0 ? (
            <p className="text-[15px] text-ink-soft">아직 없어요.</p>
          ) : (
            planRev.map((r) => (
              <div key={r.id} className="rounded-box bg-base-200 p-2 text-[15px]">
                <p className="font-bold">{r.fromGroup}모둠</p>
                {r.praise && (
                  <p>
                    <ThumbsUp className="mr-1 inline h-4 w-4" aria-hidden="true" />
                    {r.praise}
                  </p>
                )}
                {r.suggest && (
                  <p>
                    <Wand2 className="mr-1 inline h-4 w-4" aria-hidden="true" />
                    {r.suggest}
                  </p>
                )}
                {r.ethics && (
                  <p>
                    <ShieldCheck className="mr-1 inline h-4 w-4" aria-hidden="true" />
                    {r.ethics}
                  </p>
                )}
              </div>
            ))
          )}
        </section>
        <section className="dossier flex flex-col gap-3 p-4">
          <TextArea label="선생님 의견 (학생 화면에 보여요)" value={comment} onChange={setComment} maxLength={300} rows={4} />
          {msg && <Notice tone={msg.tone}>{msg.text}</Notice>}
          <div className="flex flex-wrap gap-2">
            <Button disabled={busy} onClick={() => void decide('approved')}>
              <CheckCheck className="h-5 w-5" aria-hidden="true" />
              승인
            </Button>
            <Button variant="secondary" disabled={busy || !comment.trim()} onClick={() => void decide('revise')}>
              <MessageSquareWarning className="h-5 w-5" aria-hidden="true" />
              고칠 점 보내기
            </Button>
          </div>
          <p className="text-[14px] text-ink-soft">점검 포인트: 사실 카드 근거, 진영 균형, 실존 인물의 말 지어내지 않기, 얼굴·목소리 합성 금지, AI 활용 표기 계획.</p>
        </section>
      </aside>
    </div>
  );
}

/* ─────────────── 발표·평가 ─────────────── */

export function PresentTab({ cls, groups, reviews }: { cls: ClassRecord; groups: GroupRecord[]; reviews: ReviewRecord[] }) {
  const visible = groups.filter((g) => g.no <= cls.groupCount);
  const finals = reviews.filter((r): r is ReviewRecord & FinalReviewDoc => r.kind === 'final');
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2">
        <LinkButton to={`/teacher/class/${cls.id}/present?mode=works`}>
          <Presentation className="h-5 w-5" aria-hidden="true" />
          모둠 발표 화면
        </LinkButton>
        <p className="text-[15px] text-ink-soft">제출한 모둠 작품을 한 모둠씩 크게 보여 줘요. (← → 키로 넘기기)</p>
      </div>
      <div className="overflow-x-auto">
        <table className="table w-full min-w-[640px] rounded-box bg-white text-[16px]">
          <thead>
            <tr className="text-[15px] text-ink">
              <th className="p-2">모둠</th>
              <th className="p-2">작품</th>
              {RUBRIC.map((r) => (
                <th key={r.id} className="p-2">
                  {r.name}
                </th>
              ))}
              <th className="p-2">평가 수</th>
            </tr>
          </thead>
          <tbody>
            {visible.map((g) => {
              const avg = averageScores(finals.filter((r) => r.toGroup === g.no));
              return (
                <tr key={g.id}>
                  <td className="p-2 font-bold">{groupLabel(g)}</td>
                  <td className="p-2">
                    {g.submission ? (
                      <a href={g.submission.url} target="_blank" rel="noopener noreferrer" className="link inline-flex items-center gap-1">
                        <ExternalLink className="h-4 w-4" aria-hidden="true" />
                        {g.plan.title || '작품'}
                      </a>
                    ) : (
                      <span className="text-ink-soft">미제출</span>
                    )}
                  </td>
                  {RUBRIC.map((r) => (
                    <td key={r.id} className="p-2">
                      <StarMean value={avg[r.id]} />
                    </td>
                  ))}
                  <td className="p-2">{avg.count}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <ul className="grid gap-3 lg:grid-cols-2">
        {visible.map((g) => {
          const fr = finals.filter((r) => r.toGroup === g.no && (r.praise || r.suggest));
          return (
            <li key={g.id} className="dossier p-4">
              <h3 className="font-bold">{groupLabel(g)} 받은 피드백 ({fr.length})</h3>
              {g.aiLog.label && (
                <p className="mt-1 text-[14px] text-ink-soft">
                  <Bot className="mr-1 inline h-4 w-4" aria-hidden="true" />
                  {g.aiLog.label}
                </p>
              )}
              <ul className="mt-2 flex flex-col gap-1 text-[15px]">
                {fr.map((r) => (
                  <li key={r.id} className="rounded-box bg-base-200 p-2">
                    <span className="text-ink-soft">{r.authorNumber}번 · </span>
                    {r.praise && <span>칭찬: {r.praise} </span>}
                    {r.suggest && <span>/ 제안: {r.suggest}</span>}
                  </li>
                ))}
              </ul>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
