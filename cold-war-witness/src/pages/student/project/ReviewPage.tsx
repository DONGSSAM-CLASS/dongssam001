/**
 * 3차시 · 기획서 동료 검토 — 다음 번호 모둠의 기획서를 읽고 칭찬·제안·윤리 의견을 쓴다.
 * K-SEL [9정서02-01] 나와 타인의 관점 비교하기
 */
import { useEffect, useState } from 'react';
import { Inbox, MessageSquareHeart, ShieldCheck, ThumbsUp, Wand2 } from 'lucide-react';
import { Layout } from '../../../components/Layout';
import { Loading, Notice } from '../../../components/ui';
import { ActivityHeader, ActivityLocked, NeedGroup, Section, SharedText } from '../../../components/project';
import { StudentBadge } from '../StudentHome';
import { useReadyStudent } from '../../../app/StudentContext';
import { FACTS } from '../../../data/facts';
import { getPrinciple } from '../../../data/principles';
import { CHAPTERS } from '../../../data/scenarios';
import { FEEDBACK_STARTERS, FORMATS, PLAN_FIELDS } from '../../../data/project';
import { savePlanReviewField, subscribeGroup, subscribePlanReviewsFrom, subscribeReviewsTo } from '../../../lib/db';
import { checksDone, groupLabel, isActivityOpen, reviewTarget } from '../../../lib/project';
import type { GroupRecord, PlanReviewDoc, ReviewRecord } from '../../../types/db';

const ETHICS_STARTERS = ['윤리 점검표로 보면', '이 원칙도 함께 생각해 보면 좋겠어요:', '걱정되는 점은'];

export default function ReviewPage() {
  const { cls, group } = useReadyStudent();
  if (!isActivityOpen('review', cls.session)) {
    return (
      <Layout right={<StudentBadge />}>
        <ActivityLocked activity="review" />
      </Layout>
    );
  }
  return (
    <Layout right={<StudentBadge />}>
      <ActivityHeader icon={MessageSquareHeart} activity="review" title="기획서 검토">
        다른 모둠의 기획서를 읽고 <strong>칭찬 1 · 제안 1 · 윤리 점검 의견 1</strong>을 써요. 사람이 아니라 기획에 대해, 받는 친구의 마음을 생각하며 써요.
      </ActivityHeader>
      {group ? <ReviewBody group={group} /> : <NeedGroup />}
    </Layout>
  );
}

function ReviewBody({ group }: { group: GroupRecord }) {
  const { session, student, cls } = useReadyStudent();
  const to = reviewTarget(group.no, cls.groupCount);
  const [target, setTarget] = useState<GroupRecord | null | undefined>(undefined);
  const [mine, setMine] = useState<ReviewRecord[] | null>(null);
  const [received, setReceived] = useState<ReviewRecord[] | null>(null);

  useEffect(() => {
    if (!to) return;
    return subscribeGroup(session.classId, to, setTarget, () => setTarget(null));
  }, [session.classId, to]);
  useEffect(() => subscribePlanReviewsFrom(session.classId, group.no, setMine, () => setMine([])), [session.classId, group.no]);
  useEffect(() => subscribeReviewsTo(session.classId, group.no, setReceived, () => setReceived([])), [session.classId, group.no]);

  const existing = (mine ?? []).find((r) => r.kind === 'plan' && r.toGroup === to) as (PlanReviewDoc & { id: string }) | undefined;
  const saveField = (key: 'praise' | 'suggest' | 'ethics', text: string) => {
    if (!to) return Promise.resolve();
    return savePlanReviewField(session.classId, group.no, to, student.number, key, text, !!existing);
  };
  const planReceived = (received ?? []).filter((r): r is ReviewRecord & PlanReviewDoc => r.kind === 'plan');

  return (
    <div className="flex flex-col gap-5">
      {!to ? (
        <Notice tone="info">모둠이 2개 이상일 때 서로 검토할 수 있어요.</Notice>
      ) : target === undefined || mine === null ? (
        <Loading />
      ) : !target ? (
        <Notice tone="error">검토할 모둠을 불러오지 못했어요.</Notice>
      ) : (
        <>
          <Section title={`검토할 기획서 — ${groupLabel(target)}`} icon={Inbox}>
            {target.planStatus === 'draft' && target.plan.title === '' ? (
              <Notice tone="info">이 모둠은 아직 기획서를 쓰고 있어요. 조금 뒤에 다시 와 주세요.</Notice>
            ) : (
              <PlanReadOnly g={target} />
            )}
          </Section>
          <Section title="우리 모둠의 피드백" icon={ThumbsUp}>
            <p className="text-[15px] text-ink-soft">모둠원이 함께 써요. 자동으로 저장되고, {groupLabel(target)}에게 보여요.</p>
            <SharedText
              label="칭찬 한 가지"
              value={existing?.praise ?? ''}
              maxLength={200}
              rows={2}
              starters={FEEDBACK_STARTERS.praise}
              onSave={(t) => saveField('praise', t)}
            />
            <SharedText
              label="제안 한 가지"
              value={existing?.suggest ?? ''}
              maxLength={200}
              rows={2}
              starters={FEEDBACK_STARTERS.suggest}
              onSave={(t) => saveField('suggest', t)}
            />
            <SharedText
              label="윤리 점검 의견 (원칙 이름과 함께)"
              hint="이 기획대로 만들면 7대 원칙 가운데 걱정되거나 더 살리면 좋을 점은?"
              value={existing?.ethics ?? ''}
              maxLength={200}
              rows={2}
              starters={ETHICS_STARTERS}
              onSave={(t) => saveField('ethics', t)}
            />
          </Section>
        </>
      )}

      <Section title="우리 모둠이 받은 피드백" icon={Wand2}>
        {received === null ? (
          <Loading />
        ) : planReceived.length === 0 ? (
          <p className="text-ink-soft">아직 받은 피드백이 없어요.</p>
        ) : (
          <ul className="flex flex-col gap-3">
            {planReceived.map((r) => (
              <li key={r.id} className="rounded-box border border-base-300 bg-white p-3">
                <p className="text-[14px] font-bold text-ink-soft">{r.fromGroup}모둠이 보냈어요</p>
                {r.praise && (
                  <p>
                    <ThumbsUp className="mr-1 inline h-4 w-4 text-declass" aria-hidden="true" />
                    {r.praise}
                  </p>
                )}
                {r.suggest && (
                  <p>
                    <Wand2 className="mr-1 inline h-4 w-4 text-primary-content" aria-hidden="true" />
                    {r.suggest}
                  </p>
                )}
                {r.ethics && (
                  <p>
                    <ShieldCheck className="mr-1 inline h-4 w-4 text-stamp" aria-hidden="true" />
                    {r.ethics}
                  </p>
                )}
              </li>
            ))}
          </ul>
        )}
        <p className="text-[15px] text-ink-soft">반영할 피드백 한 가지를 골라 기획서를 고쳐 보세요.</p>
      </Section>
    </div>
  );
}

/** 다른 모둠 기획서 읽기 전용 */
export function PlanReadOnly({ g }: { g: GroupRecord }) {
  const p = g.plan;
  const fmt = FORMATS.find((f) => f.id === p.format);
  const ch = CHAPTERS.find((c) => c.id === g.caseId);
  const checks = checksDone(g.planChecks);
  return (
    <dl className="grid gap-2 text-[16px] sm:grid-cols-[10rem_1fr]">
      <dt className="font-bold">사건 파일</dt>
      <dd>{ch ? `「${ch.title}」` : '—'}</dd>
      <dt className="font-bold">형식</dt>
      <dd>{fmt ? (fmt.id === 'other' ? p.formatOther || fmt.name : fmt.name) : '—'}</dd>
      <dt className="font-bold">근거 사실 카드</dt>
      <dd>{p.factIds.map((id) => FACTS.find((f) => f.id === id)?.title).join(' · ') || '—'}</dd>
      <dt className="font-bold">중심 원칙</dt>
      <dd>
        {p.principleIds.map((id) => getPrinciple(id).name).join(' · ') || '—'}
        {p.aspectTags.length > 0 && <span className="text-ink-soft"> ({p.aspectTags.join(', ')})</span>}
      </dd>
      {PLAN_FIELDS.map((f) => (
        <div key={f.id} className="contents">
          <dt className="font-bold">{f.label}</dt>
          <dd className="whitespace-pre-wrap">{p[f.id] || '—'}</dd>
        </div>
      ))}
      <dt className="font-bold">윤리 점검</dt>
      <dd>
        {checks.done} / {checks.total} 확인
      </dd>
    </dl>
  );
}
