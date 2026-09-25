/**
 * 4~5차시 · 창작 작업실 — 진행 단계, 스토리보드, AI 활용 기록(투명성), 출처
 * 5차시 · 최종 점검·제출(#submit) — 최종 윤리 점검표 + 작품 링크 제출
 */
import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import {
  Bot,
  CircleCheckBig,
  ClipboardCheck,
  ExternalLink,
  FileText,
  Footprints,
  LayoutPanelTop,
  Lock,
  Palette,
  Plus,
  Quote,
  Send,
  Undo2,
} from 'lucide-react';
import { Layout } from '../../../components/Layout';
import { Button, Notice, TextArea, TextInput, friendlyError } from '../../../components/ui';
import { ActivityHeader, ActivityLocked, NeedGroup, Section, SharedText } from '../../../components/project';
import { onRadioKeyDown, radioTabIndex } from '../../../components/radioKeys';
import { StudentBadge } from '../StudentHome';
import { EthicsChecklist, PlanStatusBanner } from './PlanPage';
import { useReadyStudent } from '../../../app/StudentContext';
import { getPrinciple } from '../../../data/principles';
import { AI_LOG_FIELDS, FORMATS, MAX_CUTS, STAGES, type StageId } from '../../../data/project';
import { cancelSubmission, submitWork, updateGroup } from '../../../lib/db';
import { checksDone, groupLabel, isActivityOpen, isValidWorkUrl, suggestAiLabel } from '../../../lib/project';
import type { CutId, GroupRecord } from '../../../types/db';

export default function CreatePage() {
  const { cls, group } = useReadyStudent();
  if (!isActivityOpen('create', cls.session)) {
    return (
      <Layout right={<StudentBadge />}>
        <ActivityLocked activity="create" />
      </Layout>
    );
  }
  return (
    <Layout right={<StudentBadge />}>
      <ActivityHeader icon={Palette} activity="create">
        기획서대로 작품을 만들어요. 스토리보드와 AI 활용 기록은 모둠원이 함께 쓰고, 자동으로 저장돼요. 작품 파일은 선생님이 정한 곳에 올리고, 5차시에 링크를 제출해요.
      </ActivityHeader>
      {group ? <CreateBody group={group} /> : <NeedGroup />}
    </Layout>
  );
}

function CreateBody({ group }: { group: GroupRecord }) {
  const { session, cls } = useReadyStudent();
  const location = useLocation();
  const [error, setError] = useState<string | null>(null);
  const save = (fields: Record<string, unknown>) => updateGroup(session.classId, group.no, fields);
  const act = async (fn: () => Promise<void>) => {
    setError(null);
    try {
      await fn();
    } catch (e) {
      setError(friendlyError(e));
    }
  };

  useEffect(() => {
    if (location.hash === '#submit') document.getElementById('submit')?.scrollIntoView();
  }, [location.hash]);

  const plan = group.plan;
  const fmt = FORMATS.find((f) => f.id === plan.format) ?? FORMATS[FORMATS.length - 1];
  const filled = Object.keys(group.storyboard)
    .map((k) => Number(k.slice(1)))
    .filter((n) => group.storyboard[`c${n}` as CutId]);
  const [extra, setExtra] = useState(0);
  const cuts = Math.min(MAX_CUTS, Math.max(fmt.cuts, ...filled, 0) + extra);
  const stageIds = STAGES.map((s) => s.id);

  return (
    <div className="flex flex-col gap-5">
      <PlanStatusBanner group={group} />
      {error && <Notice tone="error">{error}</Notice>}

      <details className="dossier p-4">
        <summary className="cursor-pointer font-bold">
          <FileText className="mr-1 inline h-5 w-5" aria-hidden="true" />
          {groupLabel(group)}의 기획서 다시 보기 — {plan.title || '(제목 없음)'}
        </summary>
        <dl className="mt-3 grid gap-2 text-[16px] sm:grid-cols-[8rem_1fr]">
          <dt className="font-bold">핵심 메시지</dt>
          <dd>{plan.message || '—'}</dd>
          <dt className="font-bold">형식</dt>
          <dd>
            {fmt.name} ({fmt.spec})
          </dd>
          <dt className="font-bold">중심 원칙</dt>
          <dd>{plan.principleIds.map((id) => getPrinciple(id).name).join(' · ') || '—'}</dd>
          <dt className="font-bold">구성</dt>
          <dd className="whitespace-pre-wrap">{plan.outline || '—'}</dd>
          <dt className="font-bold">AI 활용 계획</dt>
          <dd className="whitespace-pre-wrap">{plan.aiUse || '—'}</dd>
        </dl>
      </details>

      <Section title="① 진행 단계" icon={Footprints}>
        <p className="text-[16px]">오늘 수업이 끝날 때 어디까지 해 둘지 정하고, 끝낸 단계를 표시해요.</p>
        <div
          role="radiogroup"
          aria-label="진행 단계"
          className="flex flex-wrap gap-2"
          onKeyDown={(e) => onRadioKeyDown(e, stageIds, group.stage, (v: StageId) => void act(() => save({ stage: v })))}
        >
          {STAGES.map((s, i) => {
            const on = group.stage === s.id;
            const past = stageIds.indexOf(group.stage) > i;
            return (
              <button
                key={s.id}
                type="button"
                role="radio"
                aria-checked={on}
                tabIndex={radioTabIndex(group.stage, s.id, i)}
                onClick={() => void act(() => save({ stage: s.id }))}
                className={`btn h-auto min-h-11 rounded-full px-4 text-[16px] ${
                  on ? 'border-primary-content bg-primary-content text-white' : past ? 'border-primary bg-primary/60' : 'border-base-300 bg-white'
                }`}
              >
                {i + 1}. {s.name}
                {past && <CircleCheckBig className="h-4 w-4" aria-hidden="true" />}
              </button>
            );
          })}
        </div>
      </Section>

      <Section title={`② 스토리보드 — ${fmt.name}`} icon={LayoutPanelTop}>
        <p className="text-[16px]">
          {fmt.unit}마다 장면(그림)과 대사·자막을 적어요. 역사 내용은 기획서의 사실 카드와 맞는지 역사 탐구원이 확인해요.
        </p>
        <div className="grid gap-3 sm:grid-cols-2">
          {Array.from({ length: cuts }, (_, i) => {
            const id = `c${i + 1}` as CutId;
            return (
              <div key={id} className="rounded-box border-2 border-dashed border-base-300 bg-white p-3">
                <SharedText
                  label={`${fmt.unit} ${i + 1}`}
                  value={group.storyboard[id] ?? ''}
                  maxLength={300}
                  rows={4}
                  onSave={(t) => save({ [`storyboard.${id}`]: t })}
                />
              </div>
            );
          })}
        </div>
        {cuts < MAX_CUTS && (
          <Button variant="secondary" className="w-fit" onClick={() => setExtra((n) => n + 1)}>
            <Plus className="h-5 w-5" aria-hidden="true" />
            {fmt.unit} 더하기 (최대 {MAX_CUTS})
          </Button>
        )}
      </Section>

      <Section title="③ AI 활용 기록 — 투명성" icon={Bot}>
        <p className="text-[16px]">
          AI를 쓴 곳과 우리가 한 일을 사실대로 적어요. AI는 돕는 도구일 뿐, 결과를 검토하고 고치는 것은 우리 몫이에요. (인간중심성 · 투명성)
        </p>
        {AI_LOG_FIELDS.map((f) => (
          <SharedText
            key={f.id}
            label={f.label}
            hint={f.hint}
            who={f.id === 'label' || f.id === 'tools' ? 'AI 윤리 검토관' : undefined}
            value={group.aiLog[f.id]}
            maxLength={f.max}
            rows={f.max > 100 ? 3 : 1}
            onSave={(t) => save({ [`aiLog.${f.id}`]: t })}
          />
        ))}
        <Button
          variant="secondary"
          className="w-fit"
          onClick={() => void act(() => save({ 'aiLog.label': suggestAiLabel(group.aiLog) }))}
        >
          <Quote className="h-5 w-5" aria-hidden="true" />
          표기 문구 추천받기 (쓴 AI 도구 칸을 보고 만들어요)
        </Button>
        <p className="text-[15px] text-ink-soft">표기 문구는 작품 안(마지막 장면·카드·뒷면 등)에 꼭 넣어요.</p>
      </Section>

      <Section title="④ 출처" icon={Quote}>
        <SharedText
          label="쓴 자료의 출처"
          hint="사실 카드의 출처, 쓴 그림·음악·글의 이름과 주소를 적어요. 저작권 걱정 없는 자료만 써요."
          value={group.sources}
          maxLength={500}
          rows={4}
          onSave={(t) => save({ sources: t })}
        />
      </Section>

      {isActivityOpen('submit', cls.session) ? (
        <SubmitSection group={group} />
      ) : (
        <Section title="⑤ 최종 점검·제출" icon={Lock} id="submit">
          <p className="text-ink-soft">최종 점검과 제출은 5차시에 열려요.</p>
        </Section>
      )}
    </div>
  );
}

function SubmitSection({ group }: { group: GroupRecord }) {
  const { session } = useReadyStudent();
  const [url, setUrl] = useState(group.submission?.url ?? '');
  const [intro, setIntro] = useState(group.submission?.intro ?? '');
  const [note, setNote] = useState(group.submission?.note ?? '');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const checks = checksDone(group.finalChecks);
  const urlOk = isValidWorkUrl(url.trim());
  const ready = checks.all && urlOk && intro.trim().length > 0 && group.aiLog.label.trim().length > 0;
  const sub = group.submission;

  const run = async (fn: () => Promise<void>) => {
    setBusy(true);
    setError(null);
    try {
      await fn();
    } catch (e) {
      setError(friendlyError(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <Section
        title="⑤ 최종 윤리 점검표 (완성 작품)"
        icon={ClipboardCheck}
        id="submit"
        aside={
          <span className={`font-bold ${checks.all ? 'text-declass' : 'text-ink-soft'}`}>
            {checks.done} / {checks.total}
          </span>
        }
      >
        <p className="text-[16px]">이번에는 “이렇게 만들었다”를 완성한 작품에서 직접 확인하고 체크해요.</p>
        <EthicsChecklist
          checks={group.finalChecks}
          onToggle={async (id, v) => {
            setError(null);
            try {
              await updateGroup(session.classId, group.no, { [`finalChecks.${id}`]: v });
            } catch (e) {
              setError(friendlyError(e));
            }
          }}
        />
      </Section>

      <Section title="⑥ 작품 제출" icon={Send}>
        {error && <Notice tone="error">{error}</Notice>}
        {sub ? (
          <div className="flex flex-col gap-3">
            <p className="flex items-center gap-2 font-bold text-declass">
              <CircleCheckBig className="h-5 w-5" aria-hidden="true" />
              제출했어요! 6차시에 발표해요.
            </p>
            <a href={sub.url} target="_blank" rel="noopener noreferrer" className="link inline-flex items-center gap-1 break-all">
              <ExternalLink className="h-4 w-4 shrink-0" aria-hidden="true" />
              {sub.url}
            </a>
            <p className="whitespace-pre-wrap">{sub.intro}</p>
            <Button variant="secondary" className="w-fit" disabled={busy} onClick={() => void run(() => cancelSubmission(session.classId, group.no))}>
              <Undo2 className="h-5 w-5" aria-hidden="true" />
              제출 취소하고 고치기
            </Button>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            <TextInput
              label="작품 링크"
              hint="선생님이 정한 곳(학교 계정 드라이브·학급 게시판 등)에 올린 작품 주소를 붙여 넣어요. https:// 로 시작해야 해요. 링크를 연 사람이 볼 수 있게 공유 권한도 확인해요."
              value={url}
              onChange={setUrl}
              maxLength={300}
              placeholder="https://"
              error={url.trim() && !urlOk ? 'https:// 로 시작하는 주소를 넣어 주세요.' : null}
            />
            <TextArea label="작품 소개 (발표 화면에 나와요)" value={intro} onChange={setIntro} maxLength={300} rows={3} />
            <TextArea label="제작 후기 (어려웠던 점·배운 점, 선택)" value={note} onChange={setNote} maxLength={300} rows={3} />
            {!group.aiLog.label.trim() && <p className="font-bold">③ AI 활용 기록의 ‘표기 문구’를 먼저 채워 주세요.</p>}
            {!checks.all && <p className="font-bold">최종 윤리 점검표를 모두 체크해 주세요. ({checks.done}/{checks.total})</p>}
            <Button
              className="w-fit"
              disabled={!ready || busy}
              onClick={() => void run(() => submitWork(session.classId, group.no, { url: url.trim(), intro: intro.trim(), note: note.trim() }))}
            >
              <Send className="h-5 w-5" aria-hidden="true" />
              작품 제출하기
            </Button>
          </div>
        )}
      </Section>
    </>
  );
}
