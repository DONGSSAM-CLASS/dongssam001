import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Layout } from '../../components/Layout';
import { Button, LinkButton, Modal, Notice, Stamp } from '../../components/ui';
import { ChapterIllustration } from '../../components/Illustration';
import { useReadyStudent } from '../../app/StudentContext';
import { CHAPTERS } from '../../data/scenarios';
import { PRINCIPLES } from '../../data/principles';
import { chapterStatus, stepLabel } from '../../lib/progress';

export function StudentBadge() {
  const { session, student } = useReadyStudent();
  return (
    <span className="rounded-md bg-white/70 px-2 py-1 text-[15px]">
      {session.className} · {student.number}번 {student.nickname}
    </span>
  );
}

export default function StudentHome() {
  const { student, cls, leave } = useReadyStudent();
  const nav = useNavigate();
  const location = useLocation();
  const welcome = (location.state as { welcome?: string } | null)?.welcome;
  const [askLeave, setAskLeave] = useState(false);

  const nextChapter = CHAPTERS.find((c) => cls.unlocked[c.id] && chapterStatus(student, c.id) !== 'done');

  return (
    <Layout right={<StudentBadge />}>
      {welcome === 'resumed' && (
        <Notice tone="ok" className="mb-4">
          예전 기록을 불러왔어요. 하던 곳부터 이어서 할 수 있어요.
        </Notice>
      )}
      {welcome === 'new' && (
        <Notice tone="ok" className="mb-4">
          입장했어요! 선생님이 열어 준 챕터부터 시작해 보세요. 기록은 장면마다 자동으로 저장돼요.
        </Notice>
      )}

      <h1 className="typewriter text-2xl font-bold">사건 파일</h1>
      <p className="text-ink-soft">선생님이 열어 준 파일만 볼 수 있어요. 다 끝낸 파일에는 ‘해제됨’ 도장이 찍혀요.</p>

      <ul className="mt-5 flex flex-col gap-4">
        {CHAPTERS.map((c) => {
          const open = cls.unlocked[c.id];
          const st = chapterStatus(student, c.id);
          const step = student.progress[c.id];
          return (
            <li key={c.id} data-chapter={c.theme}>
              <div
                className={`dossier relative flex flex-col overflow-hidden sm:flex-row ${open ? '' : 'opacity-75'}`}
              >
                <ChapterIllustration theme={c.theme} className="h-28 w-full object-cover sm:h-auto sm:w-48" />
                <div className="flex flex-1 flex-col gap-2 p-4">
                  <p className="typewriter text-[15px] text-ch-600">
                    CHAPTER {c.no} · {c.period} · {c.place}
                  </p>
                  <h2 className="typewriter text-[22px] font-bold text-ch-900">「{c.title}」</h2>
                  <p className="text-[16px]">
                    나는 <strong>{c.character.role}</strong> {c.character.name}
                  </p>
                  <div className="mt-1 flex flex-wrap items-center gap-3">
                    {!open ? (
                      <span className="font-bold text-ink-soft">🔒 아직 잠겨 있어요 — 선생님이 열어 줄 때까지 기다려요</span>
                    ) : st === 'done' ? (
                      <LinkButton to={`/play/chapter/${c.id}`} variant="secondary">
                        내 기록 다시 보기
                      </LinkButton>
                    ) : (
                      <LinkButton to={`/play/chapter/${c.id}`} variant="chapter">
                        {st === 'notStarted' ? '파일 열기 ▶' : `이어 하기 ▶ (${stepLabel(step)})`}
                      </LinkButton>
                    )}
                  </div>
                </div>
                {st === 'done' && (
                  <div className="absolute top-3 right-3" aria-label="완료">
                    <Stamp tone="declass">해제됨</Stamp>
                  </div>
                )}
                {!open && (
                  <div className="absolute top-3 right-3" aria-hidden="true">
                    <Stamp>기밀</Stamp>
                  </div>
                )}
              </div>
            </li>
          );
        })}
      </ul>

      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        <Link to="/play/cards" className="dossier flex items-center justify-between p-4 hover:bg-white">
          <span>
            <span className="block text-[15px] text-ink-soft">내 원칙 카드 도감</span>
            <span className="typewriter text-xl font-bold">
              {student.cards.length} / {PRINCIPLES.length}장
            </span>
          </span>
          <span aria-hidden="true" className="text-3xl">
            🗂️
          </span>
        </Link>
        {cls.unlocked.finale ? (
          <Link to="/play/finale" className="dossier flex items-center justify-between p-4 hover:bg-white">
            <span>
              <span className="block text-[15px] text-ink-soft">마지막 활동</span>
              <span className="typewriter text-xl font-bold">
                {student.declaration ? '내 선언문 · 인증서' : '나의 AI 윤리 실천 선언문'}
              </span>
            </span>
            <span aria-hidden="true" className="text-3xl">
              📜
            </span>
          </Link>
        ) : (
          <div className="dossier flex items-center justify-between p-4 opacity-75">
            <span>
              <span className="block text-[15px] text-ink-soft">마지막 활동</span>
              <span className="typewriter text-xl font-bold">🔒 선언문 (아직 잠김)</span>
            </span>
          </div>
        )}
      </div>

      {nextChapter && (
        <div className="mt-6 text-center">
          <Button variant="primary" onClick={() => nav(`/play/chapter/${nextChapter.id}`)} className="text-[19px]">
            지금 할 파일: CHAPTER {nextChapter.no} 「{nextChapter.title}」 ▶
          </Button>
        </div>
      )}

      <p className="mt-10 text-center">
        <button type="button" className="text-[15px] text-ink-soft underline" onClick={() => setAskLeave(true)}>
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
