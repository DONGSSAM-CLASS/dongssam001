/**
 * 발표 모드 — ← → 키 또는 단추로 넘기고, Esc 로 나간다. 닉네임은 기본으로 가린다.
 *  - 기본: 하이라이트(⭐)한 답변을 한 장씩 크게
 *  - ?mode=works: 6차시 모둠 작품 발표 (제출한 모둠 순서대로)
 */
import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { Bot, ChevronLeft, ChevronRight, ExternalLink, Maximize, Quote, X } from 'lucide-react';
import { TeacherGate } from './TeacherGate';
import { useClassData } from './useClassData';
import { allPrompts, answerOf } from './ClassDashboard';
import { Loading } from '../../components/ui';
import { getPrinciple } from '../../data/principles';
import { CHAPTERS } from '../../data/scenarios';
import { FORMATS } from '../../data/project';
import { groupLabel, membersOf } from '../../lib/project';
import type { GroupRecord } from '../../types/db';

export default function PresentPage() {
  return (
    <TeacherGate>
      <Present />
    </TeacherGate>
  );
}

function Present() {
  const { classId } = useParams();
  const nav = useNavigate();
  const [params] = useSearchParams();
  const works = params.get('mode') === 'works';
  const { cls, students, highlights, groups, state } = useClassData(classId);
  const [i, setI] = useState(0);
  const [showName, setShowName] = useState(false);

  const prompts = allPrompts();
  const items = prompts.flatMap((p) =>
    students
      .filter((s) => highlights[`${s.number}:${p.id}`] && answerOf(s, p.id))
      .map((s) => ({ key: `${s.number}:${p.id}`, prompt: p, student: s, text: answerOf(s, p.id) })),
  );
  const workItems = groups.filter((g) => g.submission && g.no <= (cls?.groupCount ?? 0));
  const n = works ? workItems.length : items.length;
  const cur = items[Math.min(i, Math.max(n - 1, 0))];
  const curWork = workItems[Math.min(i, Math.max(n - 1, 0))];
  const exit = useCallback(() => nav(`/teacher/class/${classId}`), [nav, classId]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === ' ') setI((v) => Math.min(v + 1, n - 1));
      if (e.key === 'ArrowLeft') setI((v) => Math.max(v - 1, 0));
      if (e.key === 'Escape' && !document.fullscreenElement) exit();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [n, exit]);

  if (state === 'loading') return <Loading />;

  return (
    <div className="flex min-h-screen flex-col bg-[#2a1733] text-[#fdf6f9]">
      <div className="flex flex-wrap items-center gap-2 p-3">
        <button type="button" onClick={exit} className="btn btn-ghost min-h-11 rounded-full text-[#fdf6f9]">
          <X className="h-5 w-5" aria-hidden="true" />
          나가기 (Esc)
        </button>
        <button
          type="button"
          onClick={() => (document.fullscreenElement ? document.exitFullscreen() : document.documentElement.requestFullscreen())}
          className="btn btn-ghost min-h-11 rounded-full text-[#fdf6f9]"
        >
          <Maximize className="h-5 w-5" aria-hidden="true" />
          전체 화면
        </button>
        <label className="flex min-h-11 items-center gap-2 px-2">
          <input type="checkbox" checked={showName} onChange={(e) => setShowName(e.target.checked)} className="toggle toggle-secondary" />
          닉네임 보이기
        </label>
        <span className="typewriter ml-auto">{n ? `${Math.min(i, n - 1) + 1} / ${n}` : ''}</span>
      </div>
      <main className="flex flex-1 flex-col items-center justify-center px-6 pb-10">
        {works ? (
          curWork ? (
            <WorkSlide g={curWork} showName={showName} />
          ) : (
            <p className="text-2xl">아직 제출한 모둠 작품이 없어요.</p>
          )
        ) : !cur ? (
          <p className="text-2xl">하이라이트한 답변이 없어요. ‘성찰·선언문’ 탭에서 별을 눌러 골라 주세요.</p>
        ) : (
          <article className="w-full max-w-5xl" aria-live="polite">
            <p className="text-xl font-bold text-[#f9c6d7]">{cur.prompt.title}</p>
            {cur.prompt.id !== 'declaration' && <p className="mt-2 text-2xl text-[#e8d9ee]">{cur.prompt.text}</p>}
            <Quote className="mt-8 h-10 w-10 text-[#7fe3d8]" aria-hidden="true" />
            <p className="mt-2 text-4xl leading-snug font-bold whitespace-pre-wrap sm:text-5xl">{cur.text}</p>
            <p className="mt-8 text-2xl text-[#f9c6d7]">— {showName ? `${cur.student.number}번 ${cur.student.nickname}` : '우리 반 친구'}</p>
          </article>
        )}
      </main>
      {n > 1 && (
        <div className="flex justify-center gap-4 pb-6">
          <button type="button" onClick={() => setI((v) => Math.max(v - 1, 0))} className="btn btn-lg min-h-14 min-w-32 rounded-full border-0 bg-[#4a2c57] text-[#fdf6f9]">
            <ChevronLeft className="h-6 w-6" aria-hidden="true" />
            이전
          </button>
          <button type="button" onClick={() => setI((v) => Math.min(v + 1, n - 1))} className="btn btn-lg min-h-14 min-w-32 rounded-full border-0 bg-[#4a2c57] text-[#fdf6f9]">
            다음
            <ChevronRight className="h-6 w-6" aria-hidden="true" />
          </button>
        </div>
      )}
    </div>
  );
}

function WorkSlide({ g, showName }: { g: GroupRecord; showName: boolean }) {
  const fmt = FORMATS.find((f) => f.id === g.plan.format);
  const ch = CHAPTERS.find((c) => c.id === g.caseId);
  const sub = g.submission!;
  return (
    <article className="flex w-full max-w-5xl flex-col gap-4" aria-live="polite">
      <p className="text-xl font-bold text-[#f9c6d7]">
        {groupLabel(g)}
        {fmt && ` · ${fmt.id === 'other' ? g.plan.formatOther || fmt.name : fmt.name}`}
        {ch && ` · 사건 파일 「${ch.title}」`}
      </p>
      <h1 className="text-4xl leading-snug font-bold sm:text-5xl">{g.plan.title || '(제목 없음)'}</h1>
      {g.plan.message && (
        <p className="text-2xl text-[#e8d9ee]">
          <Quote className="mr-2 inline h-7 w-7 text-[#7fe3d8]" aria-hidden="true" />
          {g.plan.message}
        </p>
      )}
      <p className="text-xl whitespace-pre-wrap">{sub.intro}</p>
      {g.plan.principleIds.length > 0 && (
        <p className="text-xl text-[#7fe3d8]">담은 원칙: {g.plan.principleIds.map((id) => getPrinciple(id).name).join(' · ')}</p>
      )}
      {g.aiLog.label && (
        <p className="text-lg text-[#e8d9ee]">
          <Bot className="mr-2 inline h-5 w-5" aria-hidden="true" />
          {g.aiLog.label}
        </p>
      )}
      <a
        href={sub.url}
        target="_blank"
        rel="noopener noreferrer"
        className="btn btn-lg min-h-14 w-fit rounded-full border-0 bg-[#7fe3d8] text-[#1c2b2a]"
      >
        <ExternalLink className="h-6 w-6" aria-hidden="true" />
        작품 열기 (새 창)
      </a>
      {showName && <p className="text-xl text-[#f9c6d7]">— {membersOf(g.members).map((m) => m.nickname).join(', ')}</p>}
    </article>
  );
}
