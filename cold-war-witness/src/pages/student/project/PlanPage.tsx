/**
 * 2~3차시 · 디지털 인공지능 윤리 콘텐츠 창작 기획서
 *  - 모둠원이 함께 쓰는 기획서 (칸마다 자동 저장)
 *  - 윤리 점검표: 7대 원칙 14문항(근거 = 원문의 ‘이용자’ 역할) + 역사 정확성 4문항
 *  - 제출 → 선생님 승인 또는 고칠 점
 */
import { useState } from 'react';
import { arrayRemove, arrayUnion } from 'firebase/firestore';
import {
  BookMarked,
  CircleCheckBig,
  ClipboardCheck,
  ClipboardPen,
  Hammer,
  Landmark,
  Lightbulb,
  MessageSquareHeart,
  Send,
  ShieldCheck,
  Undo2,
} from 'lucide-react';
import { Layout } from '../../../components/Layout';
import { Button, LinkButton, Notice, friendlyError } from '../../../components/ui';
import { ActivityHeader, ActivityLocked, ChipPicker, NeedGroup, Section, SharedText } from '../../../components/project';
import { onRadioKeyDown, radioTabIndex } from '../../../components/radioKeys';
import { PrincipleDetail } from '../../../components/PrincipleDetail';
import { PrincipleIcon } from '../../../components/icons';
import { StudentBadge } from '../StudentHome';
import { useReadyStudent } from '../../../app/StudentContext';
import { FACTS } from '../../../data/facts';
import { CORE_VALUES, PRINCIPLES, getPrinciple } from '../../../data/principles';
import { CHAPTERS } from '../../../data/scenarios';
import { ETHICS_CHECKS, FORMATS, HISTORY_CHECKS, PLAN_FIELDS, PLAN_LIMITS, ROLES, type PlanField } from '../../../data/project';
import { setPlanSubmitted, updateGroup } from '../../../lib/db';
import { checksDone, groupLabel, isActivityOpen, planMissing } from '../../../lib/project';
import type { FormatId, PrincipleId, ValueId } from '../../../types/content';
import type { GroupRecord } from '../../../types/db';

const roleName = (id: PlanField['role']) => ROLES.find((r) => r.id === id)!.name.split(' (')[0];
const field = (id: PlanField['id']) => PLAN_FIELDS.find((f) => f.id === id)!;

export default function PlanPage() {
  const { cls, group } = useReadyStudent();
  if (!isActivityOpen('plan', cls.session)) {
    return (
      <Layout right={<StudentBadge />}>
        <ActivityLocked activity="plan" />
      </Layout>
    );
  }
  return (
    <Layout right={<StudentBadge />}>
      <ActivityHeader icon={ClipboardPen} activity="plan" title="콘텐츠 기획서">
        모둠원이 함께 쓰는 기획서예요. 칸마다 자동으로 저장되고, 친구가 쓴 내용도 바로 보여요. 칸 옆에는 주로 맡을 역할이 적혀 있어요.
      </ActivityHeader>
      {group ? <PlanBody group={group} /> : <NeedGroup />}
    </Layout>
  );
}

export function PlanStatusBanner({ group }: { group: GroupRecord }) {
  const s = group.planStatus;
  if (s === 'draft' && !group.teacherComment) return null;
  const tone = s === 'approved' ? 'ok' : s === 'revise' ? 'warn' : 'info';
  const title = {
    draft: '작성 중이에요',
    submitted: '제출했어요 — 선생님이 검토하고 있어요',
    approved: '선생님이 기획서를 승인했어요! 4차시부터 창작해요',
    revise: '선생님이 고칠 점을 보냈어요 — 고친 뒤 다시 제출해요',
  }[s];
  return (
    <Notice tone={tone} className="mb-4">
      <p className="font-bold">{title}</p>
      {group.teacherComment && <p className="mt-1 whitespace-pre-wrap">선생님 의견: {group.teacherComment}</p>}
    </Notice>
  );
}

function PlanBody({ group }: { group: GroupRecord }) {
  const { session, cls } = useReadyStudent();
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const plan = group.plan;
  const save = (fields: Record<string, unknown>) => updateGroup(session.classId, group.no, fields);
  const act = async (fn: () => Promise<void>) => {
    setError(null);
    try {
      await fn();
    } catch (e) {
      setError(friendlyError(e));
    }
  };
  const text = (id: PlanField['id'], extra?: { starters?: string[] }) => {
    const f = field(id);
    return (
      <SharedText
        key={id}
        label={f.label}
        hint={f.hint}
        who={roleName(f.role)}
        value={plan[id]}
        maxLength={f.max}
        minLength={f.min > 5 ? f.min : undefined}
        rows={f.rows}
        starters={extra?.starters}
        onSave={(t) => save({ [`plan.${id}`]: t })}
      />
    );
  };

  const caseChapter = CHAPTERS.find((c) => c.id === group.caseId);
  const caseFacts = FACTS.filter((f) => f.chapter === group.caseId);
  const otherFacts = FACTS.filter((f) => f.chapter !== group.caseId);
  const chosenPrinciples = PRINCIPLES.filter((p) => plan.principleIds.includes(p.id));
  const aspectItems = chosenPrinciples.flatMap((p) => p.aspects.map((a) => ({ id: a.tag, label: `${p.name} — ${a.tag}`, sub: a.statement })));
  const formatIds = FORMATS.map((f) => f.id);
  const missing = planMissing(plan);
  const checks = checksDone(group.planChecks);
  const ready = missing.length === 0 && checks.all;

  const toggleArray = (key: 'factIds' | 'principleIds' | 'aspectTags' | 'valueIds', next: string[], prev: string[]) => {
    const added = next.filter((x) => !prev.includes(x));
    const removed = prev.filter((x) => !next.includes(x));
    const fields: Record<string, unknown> = {};
    if (added.length) fields[`plan.${key}`] = arrayUnion(...added);
    if (removed.length) fields[`plan.${key}`] = arrayRemove(...removed);
    // 원칙을 빼면 그 원칙의 세부 항목도 함께 뺀다
    if (key === 'principleIds' && removed.length) {
      const tags = PRINCIPLES.filter((p) => removed.includes(p.id)).flatMap((p) => p.aspects.map((a) => a.tag));
      const drop = plan.aspectTags.filter((t) => tags.includes(t));
      if (drop.length) fields['plan.aspectTags'] = arrayRemove(...drop);
    }
    return act(() => save(fields));
  };

  return (
    <div className="flex flex-col gap-5">
      <PlanStatusBanner group={group} />
      {error && <Notice tone="error">{error}</Notice>}

      <p className="font-bold">
        {groupLabel(group)}
        {caseChapter && <span className="font-normal text-ink-soft"> · 사건 파일 「{caseChapter.title}」</span>}
      </p>

      <Section title="① 무엇을 만들까요?" icon={Lightbulb}>
        {text('title')}
        {text('audience')}
        <div className="flex flex-col gap-2">
          <p className="font-bold" id="format-label">
            콘텐츠 형식 <span className="text-[14px] font-normal text-ink-soft">· 모둠장</span>
          </p>
          <div
            role="radiogroup"
            aria-labelledby="format-label"
            className="grid gap-2 sm:grid-cols-3"
            onKeyDown={(e) => onRadioKeyDown(e, formatIds, plan.format, (v: FormatId) => void act(() => save({ 'plan.format': v })))}
          >
            {FORMATS.map((f, i) => {
              const on = plan.format === f.id;
              return (
                <button
                  key={f.id}
                  type="button"
                  role="radio"
                  aria-checked={on}
                  tabIndex={radioTabIndex(plan.format, f.id, i)}
                  onClick={() => void act(() => save({ 'plan.format': f.id }))}
                  className={`flex flex-col rounded-box border-2 p-3 text-left ${on ? 'border-primary-content bg-primary/50' : 'border-base-300 bg-white hover:bg-base-200'}`}
                >
                  <span className="font-bold">{f.name}</span>
                  <span className="text-[14px] text-ink-soft">{f.spec}</span>
                </button>
              );
            })}
          </div>
          {plan.format === 'other' && (
            <SharedText label="어떤 형식인가요?" value={plan.formatOther} maxLength={20} rows={1} onSave={(t) => save({ 'plan.formatOther': t })} />
          )}
        </div>
      </Section>

      <Section title="② 역사 근거 — 냉전 사건" icon={Landmark}>
        {!caseChapter && (
          <Notice tone="info">
            모둠 사건 파일을 아직 고르지 않았어요.{' '}
            <LinkButton to="/play/team" variant="secondary" className="ml-1">
              사건 파일 고르기
            </LinkButton>
          </Notice>
        )}
        <ChipPicker
          label={`근거 사실 카드 (최대 ${PLAN_LIMITS.facts}장) · 역사 탐구원`}
          items={caseFacts.map((f) => ({ id: f.id, label: f.title, sub: f.dateLabel }))}
          selected={plan.factIds.filter((id) => caseFacts.some((f) => f.id === id))}
          max={PLAN_LIMITS.facts - plan.factIds.filter((id) => !caseFacts.some((f) => f.id === id)).length}
          onChange={(next) =>
            void toggleArray(
              'factIds',
              [...plan.factIds.filter((id) => !caseFacts.some((f) => f.id === id)), ...next],
              plan.factIds,
            )
          }
        />
        <details className="rounded-box bg-base-200 p-3">
          <summary className="cursor-pointer font-bold">다른 사건 파일의 사실 카드도 쓰기</summary>
          <div className="mt-3">
            <ChipPicker
              label="다른 사건의 사실 카드"
              items={otherFacts.map((f) => ({ id: f.id, label: f.title, sub: `${CHAPTERS.find((c) => c.id === f.chapter)!.title}${f.dateLabel ? ` · ${f.dateLabel}` : ''}` }))}
              selected={plan.factIds.filter((id) => otherFacts.some((f) => f.id === id))}
              max={PLAN_LIMITS.facts - plan.factIds.filter((id) => caseFacts.some((f) => f.id === id)).length}
              onChange={(next) =>
                void toggleArray('factIds', [...plan.factIds.filter((id) => caseFacts.some((f) => f.id === id)), ...next], plan.factIds)
              }
            />
          </div>
        </details>
        {plan.factIds.length > 0 && (
          <ul className="flex flex-col gap-2 text-[15px]">
            {plan.factIds.map((id) => {
              const f = FACTS.find((x) => x.id === id);
              return f ? (
                <li key={id} className="rounded-box border border-base-300 bg-white p-3">
                  <p className="font-bold">
                    <BookMarked className="mr-1 inline h-4 w-4" aria-hidden="true" />
                    {f.title}
                    {f.dateLabel && ` (${f.dateLabel})`}
                  </p>
                  <p>{f.body}</p>
                  <p className="text-[14px] text-ink-soft">출처: {f.source.org}</p>
                </li>
              ) : null;
            })}
          </ul>
        )}
        {text('aiCase')}
      </Section>

      <Section title="③ 작품에 담을 AI 윤리원칙" icon={ShieldCheck}>
        <ChipPicker<PrincipleId>
          label={`중심 원칙 (최대 ${PLAN_LIMITS.principles}개) · AI 윤리 검토관`}
          items={PRINCIPLES.map((p) => ({
            id: p.id,
            label: (
              <span className="inline-flex items-center gap-1.5">
                <PrincipleIcon id={p.id} className="h-4 w-4" />
                {p.name}
              </span>
            ),
          }))}
          selected={plan.principleIds}
          max={PLAN_LIMITS.principles}
          onChange={(next) => void toggleArray('principleIds', next, plan.principleIds)}
        />
        {aspectItems.length > 0 && (
          <ChipPicker
            label={`세부 항목 (최대 ${PLAN_LIMITS.aspects}개) — 원문의 세부 항목에서 골라요`}
            items={aspectItems}
            selected={plan.aspectTags}
            max={PLAN_LIMITS.aspects}
            onChange={(next) => void toggleArray('aspectTags', next, plan.aspectTags)}
          />
        )}
        {chosenPrinciples.map((p) => (
          <PrincipleDetail key={p.id} principle={p} />
        ))}
        <ChipPicker<ValueId>
          label={`이 작품이 지키려는 3대 가치 (최대 ${PLAN_LIMITS.values}개)`}
          items={CORE_VALUES.map((v) => ({ id: v.id, label: v.name, sub: v.description }))}
          selected={plan.valueIds}
          max={PLAN_LIMITS.values}
          onChange={(next) => void toggleArray('valueIds', next, plan.valueIds)}
        />
        {text('message')}
      </Section>

      <Section title="④ 구성과 제작 계획" icon={Hammer}>
        {text('outline')}
        {text('tools')}
        {text('aiUse')}
        {text('schedule')}
      </Section>

      <Section
        title="⑤ 윤리 점검표 (기획)"
        icon={ClipboardCheck}
        id="check"
        aside={
          <span className={`font-bold ${checks.all ? 'text-declass' : 'text-ink-soft'}`}>
            {checks.done} / {checks.total}
          </span>
        }
      >
        <p className="text-[16px]">
          “이렇게 만들겠다”는 약속으로 점검해요. 모둠이 함께 읽고, 지킬 수 있을 때 체크해요. ‘근거’는 「대한민국 인공지능 윤리원칙」 원문에서 AI 이용자가 할 일이에요.
        </p>
        <EthicsChecklist checks={group.planChecks} onToggle={(id, v) => act(() => save({ [`planChecks.${id}`]: v }))} />
      </Section>

      <Section title="⑥ 제출" icon={Send}>
        {group.planStatus === 'submitted' || group.planStatus === 'approved' ? (
          <div className="flex flex-col gap-3">
            <p className="flex items-center gap-2 font-bold text-declass">
              <CircleCheckBig className="h-5 w-5" aria-hidden="true" />
              {group.planStatus === 'approved' ? '승인된 기획서예요.' : '제출했어요. 선생님과 다른 모둠이 검토해요.'}
            </p>
            {group.planStatus === 'submitted' && (
              <Button
                variant="secondary"
                className="w-fit"
                disabled={busy}
                onClick={async () => {
                  setBusy(true);
                  await act(() => setPlanSubmitted(session.classId, group.no, false));
                  setBusy(false);
                }}
              >
                <Undo2 className="h-5 w-5" aria-hidden="true" />
                제출 취소하고 더 고치기
              </Button>
            )}
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {missing.length > 0 && (
              <div>
                <p className="font-bold">아직 채울 곳</p>
                <ul className="list-disc pl-5 text-[16px]">
                  {missing.map((m) => (
                    <li key={m}>{m}</li>
                  ))}
                </ul>
              </div>
            )}
            {!checks.all && <p className="font-bold">윤리 점검표를 모두 체크해 주세요. ({checks.done}/{checks.total})</p>}
            <Button
              className="w-fit"
              disabled={!ready || busy}
              onClick={async () => {
                setBusy(true);
                await act(() => setPlanSubmitted(session.classId, group.no, true));
                setBusy(false);
              }}
            >
              <Send className="h-5 w-5" aria-hidden="true" />
              {group.planStatus === 'revise' ? '고친 기획서 다시 제출하기' : '기획서 제출하기'}
            </Button>
          </div>
        )}
        {isActivityOpen('review', cls.session) && (
          <LinkButton to="/play/review" variant="secondary" className="w-fit">
            <MessageSquareHeart className="h-5 w-5" aria-hidden="true" />
            다른 모둠 기획서 검토 · 받은 피드백
          </LinkButton>
        )}
      </Section>
    </div>
  );
}

/** 윤리 점검표 (기획 3차시 · 최종 5차시에 함께 쓴다) */
export function EthicsChecklist({
  checks: remote,
  onToggle,
}: {
  checks: Record<string, boolean>;
  onToggle: (id: string, value: boolean) => Promise<void>;
}) {
  // 누르는 즉시 체크가 보이게 (저장이 끝나면 저장된 값으로 맞춘다)
  const [local, setLocal] = useState<Record<string, boolean>>({});
  const checks = { ...remote, ...local };
  const toggle = (id: string, v: boolean) => {
    setLocal((l) => ({ ...l, [id]: v }));
    void onToggle(id, v).finally(() =>
      setLocal((l) => {
        const next = { ...l };
        delete next[id];
        return next;
      }),
    );
  };
  return (
    <div className="flex flex-col gap-4">
      {PRINCIPLES.map((p) => (
        <fieldset key={p.id} className="flex flex-col gap-2">
          <legend className="mb-1 flex items-center gap-2 font-bold">
            <span className="grid h-7 w-7 place-items-center rounded-full text-white" style={{ backgroundColor: p.color }}>
              <PrincipleIcon id={p.id} className="h-4 w-4" />
            </span>
            {p.name}
          </legend>
          {ETHICS_CHECKS.filter((c) => c.principleId === p.id).map((c) => (
            <div key={c.id} className="rounded-box border border-base-300 bg-white p-3">
              <label className="flex cursor-pointer items-start gap-3">
                <input
                  type="checkbox"
                  className="checkbox checkbox-primary mt-0.5"
                  checked={checks[c.id] === true}
                  onChange={(e) => toggle(c.id, e.target.checked)}
                />
                <span className="text-[16px]">{c.question}</span>
              </label>
              <details className="mt-1 pl-9 text-[14px] text-ink-soft">
                <summary className="cursor-pointer">근거 — {getPrinciple(c.principleId).name} · {c.aspectTag}</summary>
                <p className="mt-1">{c.basis}</p>
              </details>
            </div>
          ))}
        </fieldset>
      ))}
      <fieldset className="flex flex-col gap-2">
        <legend className="mb-1 flex items-center gap-2 font-bold">
          <Landmark className="h-6 w-6" aria-hidden="true" />
          역사 정확성
        </legend>
        {HISTORY_CHECKS.map((c) => (
          <label key={c.id} className="flex cursor-pointer items-start gap-3 rounded-box border border-base-300 bg-white p-3">
            <input
              type="checkbox"
              className="checkbox checkbox-primary mt-0.5"
              checked={checks[c.id] === true}
              onChange={(e) => toggle(c.id, e.target.checked)}
            />
            <span className="text-[16px]">{c.question}</span>
          </label>
        ))}
      </fieldset>
    </div>
  );
}
