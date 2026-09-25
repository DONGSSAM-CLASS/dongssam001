/**
 * 학생 첫 화면 — 6차시 로드맵
 * 선생님이 연 ‘지금 차시’까지의 활동을 누를 수 있다. (지난 차시 활동도 계속 열려 있다)
 */
import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  CircleCheckBig,
  ClipboardPen,
  Compass,
  FolderOpen,
  GalleryHorizontalEnd,
  Library,
  Lock,
  LogOut,
  MessageSquareHeart,
  Palette,
  ScrollText,
  Send,
  UserRound,
  UsersRound,
  type LucideIcon,
} from 'lucide-react';
import { Layout } from '../../components/Layout';
import { Button, Modal, Notice } from '../../components/ui';
import { useReadyStudent } from '../../app/StudentContext';
import { PRINCIPLES } from '../../data/principles';
import { CHAPTERS } from '../../data/scenarios';
import { ACTIVITY_LABEL, LESSON_SESSIONS, PROJECT_TITLE, ROLES, STAGES } from '../../data/project';
import { chapterStatus } from '../../lib/progress';
import { groupLabel, isActivityOpen } from '../../lib/project';
import type { ActivityId } from '../../types/content';
import type { GroupRecord, StudentRecord } from '../../types/db';

export const ACTIVITY_ICON: Record<ActivityId, LucideIcon> = {
  guide: Compass,
  team: UsersRound,
  explore: FolderOpen,
  plan: ClipboardPen,
  review: MessageSquareHeart,
  create: Palette,
  submit: Send,
  gallery: GalleryHorizontalEnd,
  declare: ScrollText,
};

export function StudentBadge() {
  const { session, student } = useReadyStudent();
  return (
    <span className="badge h-auto gap-1 border-0 bg-secondary py-1.5 text-[15px] font-bold text-secondary-content">
      <UserRound className="h-4 w-4" aria-hidden="true" />
      {session.className} · {student.number}번 {student.nickname}
      {student.groupNo > 0 && ` · ${student.groupNo}모둠`}
    </span>
  );
}

/** 활동을 마쳤는지 (알 수 있는 것만) */
function activityDone(a: ActivityId, student: StudentRecord, group: GroupRecord | null): boolean {
  switch (a) {
    case 'team': {
      const me = group?.members[String(student.number)];
      return !!group && !!group.caseId && !!me && me.roles.length > 0;
    }
    case 'explore':
      return !!group?.caseId && chapterStatus(student, group.caseId) === 'done';
    case 'plan':
      return group?.planStatus === 'submitted' || group?.planStatus === 'approved';
    case 'create':
      return group?.stage === 'done';
    case 'submit':
      return !!group?.submission;
    case 'declare':
      return !!student.declaration;
    default:
      return false;
  }
}

export default function StudentHome() {
  const { student, cls, group, leave } = useReadyStudent();
  const nav = useNavigate();
  const location = useLocation();
  const welcome = (location.state as { welcome?: string } | null)?.welcome;
  const [askLeave, setAskLeave] = useState(false);
  const now = LESSON_SESSIONS[cls.session - 1];
  const me = group?.members[String(student.number)];
  const caseChapter = group?.caseId ? CHAPTERS.find((c) => c.id === group.caseId) : null;

  return (
    <Layout right={<StudentBadge />}>
      {welcome === 'resumed' && (
        <Notice tone="ok" className="mb-4">
          예전 기록을 불러왔어요. 하던 곳부터 이어서 할 수 있어요.
        </Notice>
      )}
      {welcome === 'new' && (
        <Notice tone="ok" className="mb-4">
          입장했어요! 먼저 ‘활동 안내’를 읽고 ‘우리 모둠’을 골라 보세요. 쓰는 글은 자동으로 저장돼요.
        </Notice>
      )}

      <p className="text-[15px] font-bold text-ink-soft">{PROJECT_TITLE}</p>
      <h1 className="typewriter text-2xl font-bold">6차시 로드맵</h1>

      {/* 지금 차시 */}
      <section className="dossier mt-4 flex flex-col gap-3 border-2 border-primary-content/30 bg-primary/30 p-5" aria-label="지금 차시">
        <p className="w-fit rounded-full bg-primary-content px-3 py-0.5 text-[15px] font-bold text-white">지금 {now.no}차시</p>
        <h2 className="typewriter text-xl font-bold">{now.title}</h2>
        <div className="flex flex-wrap gap-2">
          {now.activities.map((a) => {
            const Icon = ACTIVITY_ICON[a];
            return (
              <Button key={a} variant="primary" onClick={() => nav(ACTIVITY_LABEL[a].path)}>
                <Icon className="h-5 w-5" aria-hidden="true" />
                {ACTIVITY_LABEL[a].name}
              </Button>
            );
          })}
        </div>
      </section>

      {/* 우리 모둠 */}
      <Link
        to="/play/team"
        className="dossier mt-4 flex items-center justify-between gap-3 p-4 transition-transform hover:-translate-y-0.5"
      >
        <span className="flex flex-col gap-0.5">
          <span className="text-[15px] text-ink-soft">우리 모둠</span>
          {group ? (
            <>
              <span className="typewriter text-xl font-bold">{groupLabel(group)}</span>
              <span className="text-[15px]">
                내 역할: {me && me.roles.length > 0 ? me.roles.map((r) => ROLES.find((x) => x.id === r)?.name.split(' (')[0]).join(', ') : '아직 안 골랐어요'}
                {caseChapter && ` · 사건 파일 「${caseChapter.title}」`}
              </span>
              <span className="text-[15px] text-ink-soft">
                제작 단계: {STAGES.find((s) => s.id === group.stage)?.name}
                {group.submission && ' · 작품 제출 완료'}
              </span>
            </>
          ) : (
            <span className="typewriter text-xl font-bold">
              {cls.groupCount > 0 ? '모둠을 골라 주세요' : '선생님이 모둠을 만들 때까지 기다려요'}
            </span>
          )}
        </span>
        <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-secondary text-secondary-content">
          <UsersRound className="h-6 w-6" aria-hidden="true" />
        </span>
      </Link>

      {/* 로드맵 */}
      <ol className="mt-6 flex flex-col gap-3" aria-label="차시별 활동">
        {LESSON_SESSIONS.map((s) => {
          const open = cls.session >= s.no;
          const current = cls.session === s.no;
          return (
            <li key={s.no} className={`dossier flex gap-4 p-4 ${open ? '' : 'border-dashed'} ${current ? 'ring-2 ring-primary-content/40' : ''}`}>
              <span
                className={`grid h-11 w-11 shrink-0 place-items-center rounded-full text-lg font-extrabold ${
                  current ? 'bg-primary-content text-white' : open ? 'bg-primary text-primary-content' : 'bg-base-200 text-ink-soft'
                }`}
                aria-hidden="true"
              >
                {open ? s.no : <Lock className="h-5 w-5" />}
              </span>
              <div className="flex min-w-0 flex-1 flex-col gap-2">
                <p className="text-[14px] font-bold text-ink-soft">
                  {s.block} · {s.blockTitle}
                  {current && <span className="ml-2 rounded-full bg-accent px-2 text-accent-content">지금</span>}
                  {!open && <span className="sr-only"> (아직 잠겨 있음)</span>}
                </p>
                <h3 className="text-[18px] font-bold">
                  {s.no}차시 · {s.title}
                </h3>
                <div className="flex flex-wrap gap-2">
                  {s.activities.map((a) => {
                    const Icon = ACTIVITY_ICON[a];
                    const done = activityDone(a, student, group);
                    return isActivityOpen(a, cls.session) ? (
                      <Link
                        key={a}
                        to={ACTIVITY_LABEL[a].path}
                        className="btn h-auto min-h-11 rounded-full border-base-300 bg-white px-4 text-[16px] font-bold hover:bg-base-200"
                      >
                        <Icon className="h-4 w-4" aria-hidden="true" />
                        {ACTIVITY_LABEL[a].name}
                        {done && (
                          <>
                            <CircleCheckBig className="h-4 w-4 text-declass" aria-hidden="true" />
                            <span className="sr-only">(마침)</span>
                          </>
                        )}
                      </Link>
                    ) : (
                      <span key={a} className="inline-flex min-h-11 items-center gap-1.5 rounded-full bg-base-200 px-4 text-[16px] text-ink-soft">
                        <Lock className="h-4 w-4" aria-hidden="true" />
                        {ACTIVITY_LABEL[a].name}
                      </span>
                    );
                  })}
                </div>
              </div>
            </li>
          );
        })}
      </ol>

      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        <Link to="/play/cards" className="dossier flex items-center justify-between p-4 transition-transform hover:-translate-y-0.5">
          <span>
            <span className="block text-[15px] text-ink-soft">AI 윤리원칙 카드 도감</span>
            <span className="typewriter text-xl font-bold">
              {student.cards.length} / {PRINCIPLES.length}장
            </span>
          </span>
          <span className="grid h-12 w-12 place-items-center rounded-full bg-primary text-primary-content">
            <Library className="h-6 w-6" aria-hidden="true" />
          </span>
        </Link>
        {isActivityOpen('explore', cls.session) ? (
          <Link to="/play/explore" className="dossier flex items-center justify-between p-4 transition-transform hover:-translate-y-0.5">
            <span>
              <span className="block text-[15px] text-ink-soft">냉전 사건 파일</span>
              <span className="typewriter text-xl font-bold">
                {CHAPTERS.filter((c) => chapterStatus(student, c.id) === 'done').length} / {CHAPTERS.length}개 해제
              </span>
            </span>
            <span className="grid h-12 w-12 place-items-center rounded-full bg-accent text-accent-content">
              <FolderOpen className="h-6 w-6" aria-hidden="true" />
            </span>
          </Link>
        ) : null}
      </div>

      <p className="mt-10 text-center">
        <button type="button" className="btn btn-ghost btn-sm text-[15px] font-normal text-ink-soft" onClick={() => setAskLeave(true)}>
          <LogOut className="h-4 w-4" aria-hidden="true" />
          이 기기에서 나가기
        </button>
      </p>
      <Modal open={askLeave} onClose={() => setAskLeave(false)} title="이 기기에서 나갈까요?">
        <p>
          나가도 기록은 지워지지 않아요. 다시 들어올 때는 <strong>학급 코드 · 번호 · PIN</strong>이 필요해요.
        </p>
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={() => setAskLeave(false)}>
            취소
          </Button>
          <Button
            variant="danger"
            onClick={async () => {
              await leave();
              nav('/', { replace: true });
            }}
          >
            나가기
          </Button>
        </div>
      </Modal>
    </Layout>
  );
}
