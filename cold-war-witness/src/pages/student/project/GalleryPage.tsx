/**
 * 6차시 · 발표·피드백 — 다른 모둠 작품을 보고 평가 기준(4항목 별점) + 칭찬·제안을 남긴다.
 * K-SEL [9정서03-01] 나의 표현이 친구에게 주는 영향 생각하기
 */
import { useEffect, useState } from 'react';
import { Bot, ExternalLink, GalleryHorizontalEnd, Inbox, Save, ScrollText, ThumbsUp, Wand2 } from 'lucide-react';
import { Layout } from '../../../components/Layout';
import { Button, LinkButton, Loading, Notice, TextArea, friendlyError } from '../../../components/ui';
import { ActivityHeader, ActivityLocked, Section, StarMean, StarRadio } from '../../../components/project';
import { StudentBadge } from '../StudentHome';
import { useReadyStudent } from '../../../app/StudentContext';
import { useGroups } from '../../../app/useGroups';
import { getPrinciple } from '../../../data/principles';
import { CHAPTERS } from '../../../data/scenarios';
import { FEEDBACK_STARTERS, FORMATS, RUBRIC } from '../../../data/project';
import { saveFinalReview, subscribeMyFinalReviews, subscribeReviewsTo } from '../../../lib/db';
import { averageScores, groupLabel, isActivityOpen } from '../../../lib/project';
import type { FinalReviewDoc, GroupRecord, ReviewRecord, RubricScores } from '../../../types/db';

type FinalRecord = ReviewRecord & FinalReviewDoc;
const isFinal = (r: ReviewRecord): r is FinalRecord => r.kind === 'final';

export default function GalleryPage() {
  const { cls, session, student } = useReadyStudent();
  const { groups } = useGroups(isActivityOpen('gallery', cls.session) ? session.classId : undefined);
  const [mine, setMine] = useState<FinalRecord[] | null>(null);
  const [received, setReceived] = useState<FinalRecord[] | null>(null);

  const open = isActivityOpen('gallery', cls.session);
  useEffect(() => {
    if (!open) return;
    return subscribeMyFinalReviews(session.classId, student.number, (l) => setMine(l.filter(isFinal)), () => setMine([]));
  }, [open, session.classId, student.number]);
  useEffect(() => {
    if (!open || student.groupNo < 1) return;
    return subscribeReviewsTo(session.classId, student.groupNo, (l) => setReceived(l.filter(isFinal)), () => setReceived([]));
  }, [open, session.classId, student.groupNo]);

  if (!open) {
    return (
      <Layout right={<StudentBadge />}>
        <ActivityLocked activity="gallery" />
      </Layout>
    );
  }

  const works = (groups ?? []).filter((g) => g.no <= cls.groupCount && g.submission);
  const others = works.filter((g) => g.no !== student.groupNo);
  const mineGroup = works.find((g) => g.no === student.groupNo);
  const avg = averageScores(received ?? []);

  return (
    <Layout right={<StudentBadge />}>
      <ActivityHeader icon={GalleryHorizontalEnd} activity="gallery">
        발표를 듣고 모둠마다 평가해요. 칭찬을 먼저, 제안은 구체적으로, 사람이 아니라 작품에 대해 써요. 평가는 이름 없이 그 모둠에게 전해져요.
      </ActivityHeader>

      {!groups || mine === null ? (
        <Loading />
      ) : (
        <div className="flex flex-col gap-5">
          {student.groupNo > 0 && (
            <Section title="우리 모둠이 받은 평가" icon={Inbox}>
              {!mineGroup && <p className="text-ink-soft">우리 모둠은 아직 작품을 제출하지 않았어요.</p>}
              {received && received.length > 0 ? (
                <>
                  <ul className="grid gap-2 sm:grid-cols-4">
                    {RUBRIC.map((r) => (
                      <li key={r.id} className="rounded-box bg-base-200 p-3 text-center">
                        <p className="text-[15px]">{r.name}</p>
                        <StarMean value={avg[r.id]} />
                      </li>
                    ))}
                  </ul>
                  <p className="text-[15px] text-ink-soft">{avg.count}명이 평가했어요.</p>
                  <ul className="flex flex-col gap-2">
                    {received
                      .filter((r) => r.praise || r.suggest)
                      .map((r) => (
                        <li key={r.id} className="rounded-box border border-base-300 bg-white p-3">
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
                        </li>
                      ))}
                  </ul>
                </>
              ) : (
                <p className="text-ink-soft">아직 받은 평가가 없어요.</p>
              )}
            </Section>
          )}

          {others.length === 0 ? (
            <Notice tone="info">아직 제출된 다른 모둠 작품이 없어요.</Notice>
          ) : (
            others.map((g) => <WorkCard key={g.id} g={g} existing={mine.find((r) => r.toGroup === g.no)} />)
          )}

          <LinkButton to="/play/finale" className="w-fit">
            <ScrollText className="h-5 w-5" aria-hidden="true" />
            평가를 마쳤다면 나의 AI 윤리 실천 선언문 쓰기
          </LinkButton>
        </div>
      )}
    </Layout>
  );
}

function WorkCard({ g, existing }: { g: GroupRecord; existing?: FinalRecord }) {
  const { session, student } = useReadyStudent();
  const [scores, setScores] = useState<Partial<RubricScores>>(existing?.scores ?? {});
  const [praise, setPraise] = useState(existing?.praise ?? '');
  const [suggest, setSuggest] = useState(existing?.suggest ?? '');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ tone: 'ok' | 'error'; text: string } | null>(null);
  const sub = g.submission!;
  const fmt = FORMATS.find((f) => f.id === g.plan.format);
  const ch = CHAPTERS.find((c) => c.id === g.caseId);
  const complete = RUBRIC.every((r) => scores[r.id]);

  const save = async () => {
    setBusy(true);
    setMsg(null);
    try {
      await saveFinalReview(session.classId, g.no, student.number, {
        scores: scores as RubricScores,
        praise: praise.trim(),
        suggest: suggest.trim(),
      });
      setMsg({ tone: 'ok', text: '평가를 저장했어요. 고치고 싶으면 다시 저장하면 돼요.' });
    } catch (e) {
      setMsg({ tone: 'error', text: friendlyError(e) });
    } finally {
      setBusy(false);
    }
  };

  return (
    <Section title={`${groupLabel(g)} — ${g.plan.title || '(제목 없음)'}`} icon={GalleryHorizontalEnd} aside={existing && <span className="font-bold text-declass">평가함</span>}>
      <dl className="grid gap-1 text-[16px] sm:grid-cols-[7rem_1fr]">
        <dt className="font-bold">형식</dt>
        <dd>{fmt ? (fmt.id === 'other' ? g.plan.formatOther || fmt.name : fmt.name) : '—'}</dd>
        <dt className="font-bold">사건 파일</dt>
        <dd>{ch ? `「${ch.title}」` : '—'}</dd>
        <dt className="font-bold">중심 원칙</dt>
        <dd>{g.plan.principleIds.map((id) => getPrinciple(id).name).join(' · ') || '—'}</dd>
        <dt className="font-bold">핵심 메시지</dt>
        <dd>{g.plan.message || '—'}</dd>
        <dt className="font-bold">작품 소개</dt>
        <dd className="whitespace-pre-wrap">{sub.intro}</dd>
      </dl>
      {g.aiLog.label && (
        <p className="rounded-box bg-base-200 p-3 text-[15px]">
          <Bot className="mr-1 inline h-4 w-4" aria-hidden="true" />
          AI 활용 표기: {g.aiLog.label}
        </p>
      )}
      <a href={sub.url} target="_blank" rel="noopener noreferrer" className="btn h-auto min-h-12 w-fit rounded-full border-base-300 bg-white px-5 text-[17px] font-bold">
        <ExternalLink className="h-5 w-5" aria-hidden="true" />
        작품 보기 (새 창)
      </a>

      <div className="flex flex-col gap-3 border-t border-dashed border-base-300 pt-4">
        {RUBRIC.map((r) => (
          <StarRadio
            key={r.id}
            label={`${r.name} — ${r.description}`}
            levels={r.levels}
            value={scores[r.id] ?? null}
            onChange={(v) => setScores((s) => ({ ...s, [r.id]: v }))}
          />
        ))}
        <TextArea label="칭찬 한 가지" value={praise} onChange={setPraise} maxLength={150} rows={2} placeholder={`${FEEDBACK_STARTERS.praise[0]} …`} />
        <TextArea label="제안 한 가지 (선택)" value={suggest} onChange={setSuggest} maxLength={150} rows={2} placeholder={`${FEEDBACK_STARTERS.suggest[0]}`} />
        {msg && <Notice tone={msg.tone}>{msg.text}</Notice>}
        <Button className="w-fit" disabled={!complete || busy} onClick={() => void save()}>
          <Save className="h-5 w-5" aria-hidden="true" />
          {complete ? (existing ? '평가 다시 저장' : '평가 저장') : '네 항목의 별을 모두 골라 주세요'}
        </Button>
      </div>
    </Section>
  );
}
