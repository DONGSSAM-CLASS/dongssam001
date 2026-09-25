/**
 * 1차시 · 활동 안내 — 프로젝트 목표, 6차시 흐름, 만들 수 있는 콘텐츠, AI 윤리원칙, 평가 기준, 4가지 약속
 */
import { Compass, Film, Handshake, Library, ListChecks, Map as MapIcon, Star, UsersRound } from 'lucide-react';
import { Layout } from '../../../components/Layout';
import { LinkButton } from '../../../components/ui';
import { ActivityHeader, Section } from '../../../components/project';
import { PrincipleIcon, ValueIcon } from '../../../components/icons';
import { StudentBadge } from '../StudentHome';
import { useReadyStudent } from '../../../app/StudentContext';
import {
  AI_USER_DEFINITION,
  CORE_VALUES,
  PRINCIPLES,
  PRINCIPLES_NOTE,
  PRINCIPLES_STRUCTURE,
  PRINCIPLES_TITLE,
} from '../../../data/principles';
import { FORMATS, GUIDE_PROMISES, LESSON_SESSIONS, PROJECT_MISSION, PROJECT_TITLE, RUBRIC } from '../../../data/project';

export default function GuidePage() {
  const { cls } = useReadyStudent();
  return (
    <Layout right={<StudentBadge />}>
      <ActivityHeader icon={Compass} activity="guide">
        {PROJECT_TITLE}
      </ActivityHeader>

      <div className="flex flex-col gap-5">
        <section className="dossier border-2 border-primary-content/30 bg-primary/30 p-5">
          <p className="text-[15px] font-bold text-ink-soft">우리의 미션</p>
          <p className="mt-1 text-[19px] font-bold leading-relaxed">{PROJECT_MISSION}</p>
        </section>

        <Section title="6차시 흐름" icon={MapIcon}>
          <ol className="flex flex-col gap-2">
            {LESSON_SESSIONS.map((s) => (
              <li key={s.no} className="flex gap-3">
                <span
                  className={`grid h-9 w-9 shrink-0 place-items-center rounded-full font-extrabold ${
                    cls.session === s.no ? 'bg-primary-content text-white' : 'bg-primary text-primary-content'
                  }`}
                  aria-hidden="true"
                >
                  {s.no}
                </span>
                <span>
                  <span className="block text-[14px] text-ink-soft">{s.block}</span>
                  <span className="font-bold">{s.title}</span>
                  {cls.session === s.no && <span className="ml-2 rounded-full bg-accent px-2 text-[14px] text-accent-content">지금</span>}
                </span>
              </li>
            ))}
          </ol>
        </Section>

        <Section title="만들 수 있는 콘텐츠" icon={Film}>
          <ul className="grid gap-3 sm:grid-cols-2">
            {FORMATS.map((f) => (
              <li key={f.id} className="rounded-box bg-base-200 p-3">
                <p className="font-bold">{f.name}</p>
                <p className="text-[15px]">{f.spec}</p>
                <p className="text-[14px] text-ink-soft">도구 예: {f.tools}</p>
              </li>
            ))}
          </ul>
          <p className="text-[15px] text-ink-soft">
            완성한 작품은 선생님이 정한 곳에 올리고, 앱에는 링크만 제출해요. (앱에는 파일을 올리지 않아요)
          </p>
        </Section>

        <Section title={`「${PRINCIPLES_TITLE}」`} icon={Library}>
          <p className="text-[16px]">{PRINCIPLES_STRUCTURE}</p>
          <ul className="grid gap-2 sm:grid-cols-3" aria-label="3대 가치">
            {CORE_VALUES.map((v) => (
              <li key={v.id} className="flex items-center gap-2 rounded-box bg-accent/60 p-3 font-bold">
                <ValueIcon id={v.id} className="h-5 w-5 shrink-0" />
                {v.name}
              </li>
            ))}
          </ul>
          <ul className="grid gap-2 sm:grid-cols-2" aria-label="7대 원칙">
            {PRINCIPLES.map((p) => (
              <li key={p.id} className="flex items-start gap-2 rounded-box border border-base-300 bg-white p-3">
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-white" style={{ backgroundColor: p.color }}>
                  <PrincipleIcon id={p.id} className="h-4 w-4" />
                </span>
                <span>
                  <span className="font-bold">{p.name}</span>
                  <span className="block text-[15px] text-ink-soft">{p.description}</span>
                </span>
              </li>
            ))}
          </ul>
          <p className="rounded-box bg-base-200 p-3 text-[15px]">
            <strong>우리는 ‘AI 이용자’예요.</strong> {AI_USER_DEFINITION} 그래서 윤리 점검표는 원문의 ‘이용자’가 할 일을 근거로 만들었어요.
          </p>
          <p className="text-[14px] text-ink-soft">{PRINCIPLES_NOTE}</p>
          <LinkButton to="/play/cards" variant="secondary" className="w-fit">
            원칙 카드 도감 · 원문 살펴보기
          </LinkButton>
        </Section>

        <Section title="이렇게 평가해요 (6차시 상호 평가)" icon={Star}>
          <ul className="flex flex-col gap-2">
            {RUBRIC.map((r) => (
              <li key={r.id} className="rounded-box bg-base-200 p-3">
                <p className="font-bold">
                  {r.name} — <span className="font-normal">{r.description}</span>
                </p>
                <p className="text-[15px] text-ink-soft">★★★ {r.levels[2]}</p>
              </li>
            ))}
          </ul>
        </Section>

        <Section title="모둠의 4가지 약속" icon={Handshake}>
          <ol className="grid gap-3 sm:grid-cols-2">
            {GUIDE_PROMISES.map((p, i) => (
              <li key={p.title} className="rounded-box border-2 border-dashed border-base-300 p-3">
                <p className="font-bold">
                  {i + 1}. {p.title}
                </p>
                <p className="text-[15px]">{p.text}</p>
              </li>
            ))}
          </ol>
        </Section>

        <div className="flex flex-wrap gap-2">
          <LinkButton to="/play/team">
            <UsersRound className="h-5 w-5" aria-hidden="true" />
            우리 모둠 정하러 가기
          </LinkButton>
          <LinkButton to="/play" variant="secondary">
            <ListChecks className="h-5 w-5" aria-hidden="true" />
            6차시 로드맵
          </LinkButton>
        </div>
      </div>
    </Layout>
  );
}
