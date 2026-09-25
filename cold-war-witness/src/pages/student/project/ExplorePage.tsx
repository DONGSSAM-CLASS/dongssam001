/**
 * 2차시 · 사건 파일 탐구 — 모둠이 고른 사건 파일을 먼저 체험한다. 다른 파일은 자유 탐구.
 */
import { BookOpen, CircleCheckBig, ClipboardPen, FolderOpen, Play, RotateCcw, Star } from 'lucide-react';
import { Layout } from '../../../components/Layout';
import { LinkButton, Notice, Stamp } from '../../../components/ui';
import { ActivityHeader, ActivityLocked } from '../../../components/project';
import { ChapterIllustration } from '../../../components/Illustration';
import { StudentBadge } from '../StudentHome';
import { useReadyStudent } from '../../../app/StudentContext';
import { CHAPTERS } from '../../../data/scenarios';
import { getPrinciple } from '../../../data/principles';
import { chapterStatus, stepLabel } from '../../../lib/progress';
import { isActivityOpen } from '../../../lib/project';

export default function ExplorePage() {
  const { student, cls, group } = useReadyStudent();
  if (!isActivityOpen('explore', cls.session)) {
    return (
      <Layout right={<StudentBadge />}>
        <ActivityLocked activity="explore" />
      </Layout>
    );
  }
  const caseId = group?.caseId ?? null;
  const ordered = [...CHAPTERS].sort((a, b) => Number(b.id === caseId) - Number(a.id === caseId));

  return (
    <Layout right={<StudentBadge />}>
      <ActivityHeader icon={FolderOpen} activity="explore">
        냉전 시대를 살았던 평범한 시민(가상 인물)이 되어 다섯 장면에서 선택해요. 정답은 없어요. 장면마다 인물의 감정을 고르고, “실제 역사에서는?” 사실 카드를
        읽어요. 이 사실 카드가 우리 모둠 콘텐츠의 근거가 돼요.
      </ActivityHeader>

      {!caseId && (
        <Notice tone="info" className="mb-4">
          모둠이 아직 사건 파일을 고르지 않았어요. ‘우리 모둠’에서 함께 고르면, 그 파일이 맨 위에 표시돼요.
        </Notice>
      )}

      <ul className="flex flex-col gap-4">
        {ordered.map((c) => {
          const st = chapterStatus(student, c.id);
          const ours = c.id === caseId;
          return (
            <li key={c.id} data-chapter={c.theme}>
              <div className={`dossier relative flex flex-col overflow-hidden sm:flex-row ${ours ? 'ring-4 ring-ch-600/40' : ''}`}>
                <ChapterIllustration theme={c.theme} className="h-28 w-full object-cover sm:h-auto sm:w-48" />
                <div className="flex flex-1 flex-col gap-2 p-4 pr-24">
                  {ours ? (
                    <p className="inline-flex w-fit items-center gap-1 rounded-full bg-ch-900 px-3 py-0.5 text-[14px] font-bold text-white">
                      <Star className="h-4 w-4" aria-hidden="true" />
                      우리 모둠 사건 파일
                    </p>
                  ) : (
                    caseId && <p className="text-[14px] text-ink-soft">자유 탐구</p>
                  )}
                  <p className="text-[15px] font-semibold text-ch-600">
                    {c.period} · {c.place}
                  </p>
                  <h2 className="typewriter text-[22px] font-bold text-ch-900">「{c.title}」</h2>
                  <p className="text-[16px]">
                    나는 <strong>{c.character.role}</strong> {c.character.name}
                  </p>
                  <p className="text-[14px] text-ink-soft">받을 수 있는 원칙 카드: {c.principleIds.map((id) => getPrinciple(id).name).join(', ')}</p>
                  <div className="mt-1 flex flex-wrap items-center gap-3">
                    {st === 'done' ? (
                      <LinkButton to={`/play/chapter/${c.id}`} variant="secondary">
                        <BookOpen className="h-5 w-5" aria-hidden="true" />
                        내 기록 다시 보기
                      </LinkButton>
                    ) : (
                      <LinkButton to={`/play/chapter/${c.id}`} variant="chapter">
                        {st === 'notStarted' ? <Play className="h-5 w-5" aria-hidden="true" /> : <RotateCcw className="h-5 w-5" aria-hidden="true" />}
                        {st === 'notStarted' ? '파일 열기' : `이어 하기 (${stepLabel(student.progress[c.id])})`}
                      </LinkButton>
                    )}
                  </div>
                </div>
                {st === 'done' && (
                  <div className="absolute top-3 right-3" aria-label="완료">
                    <Stamp tone="declass">
                      <CircleCheckBig className="h-4 w-4" />
                      해제됨
                    </Stamp>
                  </div>
                )}
              </div>
            </li>
          );
        })}
      </ul>

      {isActivityOpen('plan', cls.session) && (
        <div className="mt-6">
          <LinkButton to="/play/plan">
            <ClipboardPen className="h-5 w-5" aria-hidden="true" />
            체험을 마쳤다면 모둠 기획서 쓰기
          </LinkButton>
        </div>
      )}
    </Layout>
  );
}
