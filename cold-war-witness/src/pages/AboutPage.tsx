/** 앱 정보 — 공모전 제출용 (개발자, 교과·성취기준, 윤리원칙, 생성형 AI 활용 범위) */
import { ArrowLeft, BookMarked, Bot, HeartHandshake, Info, Link2, Scale, ShieldCheck, Trophy, UserRound, type LucideIcon } from 'lucide-react';
import { Layout } from '../components/Layout';
import { PrincipleIcon } from '../components/icons';
import { LinkButton } from '../components/ui';
import { APP_TITLE } from '../config';
import { ACCURACY_NOTES, CONTEST, DEVELOPER, GENERATIVE_AI_USE, JUDGING_POINTS, TARGET } from '../data/appInfo';
import { HISTORY_STANDARDS, KSEL_COMPETENCIES, KSEL_DOC, KSEL_STANDARDS, HISTORY_DOC } from '../data/curriculum';
import { CORE_VALUES, PRINCIPLES, PRINCIPLES_NOTE, PRINCIPLES_SOURCE_URL, PRINCIPLES_TITLE } from '../data/principles';
import { CHAPTERS } from '../data/scenarios';
import { FACTS } from '../data/facts';

function Section({ title, icon: Icon, children }: { title: string; icon: LucideIcon; children: React.ReactNode }) {
  return (
    <section className="dossier p-5">
      <h2 className="typewriter mb-3 flex items-center gap-2 text-xl font-bold">
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-primary text-primary-content">
          <Icon className="h-5 w-5" aria-hidden="true" />
        </span>
        {title}
      </h2>
      {children}
    </section>
  );
}

export default function AboutPage() {
  return (
    <Layout wide>
      <h1 className="typewriter flex items-center gap-2 text-2xl font-bold">
        <Info className="h-7 w-7 text-declass" aria-hidden="true" />앱 정보
      </h1>
      <p className="typewriter text-lg">{APP_TITLE}</p>

      <div className="mt-5 flex flex-col gap-5">
        <Section title="만든 사람 · 출품" icon={UserRound}>
          <dl className="grid gap-x-4 gap-y-1 sm:grid-cols-[10rem_1fr]">
            <dt className="font-bold">개발자</dt>
            <dd>
              {DEVELOPER.name} ({DEVELOPER.school})
            </dd>
            <dt className="font-bold">출품</dt>
            <dd>
              {CONTEST.name} (주최: {CONTEST.hosts.join('·')})
            </dd>
            <dt className="font-bold">대상</dt>
            <dd>{TARGET.grade}</dd>
            <dt className="font-bold">교과</dt>
            <dd>{TARGET.subject}</dd>
            <dt className="font-bold">분량</dt>
            <dd>{TARGET.sessions}</dd>
          </dl>
        </Section>

        <Section title="교과 성취기준" icon={BookMarked}>
          <p className="text-[15px] text-ink-soft">{HISTORY_DOC.title}</p>
          <ul className="mt-2 flex flex-col gap-1">
            {HISTORY_STANDARDS.map((s) => (
              <li key={s.code}>
                <strong>{s.code}</strong> {s.text}
              </li>
            ))}
          </ul>
        </Section>

        <Section title={KSEL_DOC.shortName} icon={HeartHandshake}>
          <p className="text-[15px] text-ink-soft">
            「{KSEL_DOC.title}」({KSEL_DOC.publisher}, {KSEL_DOC.year})
          </p>
          <p className="mt-2 font-bold">4대 사회정서역량</p>
          <ul className="grid gap-2 sm:grid-cols-2">
            {KSEL_COMPETENCIES.map((c) => (
              <li key={c.id}>
                <strong>{c.name}</strong> — {c.middleSchoolGoal}
              </li>
            ))}
          </ul>
          <p className="mt-3 font-bold">연계한 중학교 성취기준</p>
          <ul className="flex flex-col gap-1">
            {KSEL_STANDARDS.map((s) => (
              <li key={s.code}>
                <strong>{s.code}</strong> {s.text}
              </li>
            ))}
          </ul>
        </Section>

        <Section title={`활용한 윤리원칙 — ${PRINCIPLES_TITLE}`} icon={Scale}>
          <p className="text-[15px] text-ink-soft">
            {PRINCIPLES_NOTE} ·{' '}
            <a className="underline" href={PRINCIPLES_SOURCE_URL} target="_blank" rel="noopener noreferrer">
              {PRINCIPLES_SOURCE_URL}
            </a>
          </p>
          <p className="mt-2">
            <strong>3대 가치:</strong> {CORE_VALUES.map((v) => v.name).join(' · ')}
          </p>
          <ul className="mt-2 grid gap-1 sm:grid-cols-2">
            {PRINCIPLES.map((p) => (
              <li key={p.id}>
                <PrincipleIcon id={p.id} className="mr-1 inline h-4 w-4" style={{ color: p.color }} />
                <strong>{p.name}</strong> — CHAPTER {CHAPTERS.find((c) => c.id === p.chapter)!.no}
              </li>
            ))}
          </ul>
        </Section>

        <Section title="생성형 AI 활용 범위" icon={Bot}>
          <ul className="list-disc pl-6">
            {GENERATIVE_AI_USE.map((t) => (
              <li key={t}>{t}</li>
            ))}
          </ul>
        </Section>

        <Section title="역사적 정확성 원칙" icon={ShieldCheck}>
          <ul className="list-disc pl-6">
            {ACCURACY_NOTES.map((t) => (
              <li key={t}>{t}</li>
            ))}
          </ul>
        </Section>

        <Section title="심사 기준과 이 앱" icon={Trophy}>
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="border-b-2 border-ink">
                <th className="py-1 pr-3">심사 기준</th>
                <th className="py-1">이 앱에서</th>
              </tr>
            </thead>
            <tbody>
              {JUDGING_POINTS.map((j) => (
                <tr key={j.criterion} className="border-b border-line">
                  <td className="py-1 pr-3 font-bold whitespace-nowrap">{j.criterion}</td>
                  <td className="py-1">{j.how}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Section>

        <Section title="사실 카드 출처" icon={Link2}>
          <ul className="flex flex-col gap-1 text-[15px]">
            {FACTS.map((f) => (
              <li key={f.id}>
                [CH{f.chapter.slice(2)}] {f.title}
                {f.dateLabel ? ` (${f.dateLabel})` : ''} —{' '}
                {f.source.url ? (
                  <a className="underline" href={f.source.url} target="_blank" rel="noopener noreferrer">
                    {f.source.org}
                  </a>
                ) : (
                  f.source.org
                )}
              </li>
            ))}
          </ul>
        </Section>

        <div>
          <LinkButton to="/" variant="secondary">
            <ArrowLeft className="h-5 w-5" aria-hidden="true" />
            처음으로
          </LinkButton>
        </div>
      </div>
    </Layout>
  );
}
