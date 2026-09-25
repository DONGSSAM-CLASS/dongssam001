import { ArrowLeft, Library } from 'lucide-react';
import { Layout } from '../../components/Layout';
import { ValueIcon } from '../../components/icons';
import { LinkButton } from '../../components/ui';
import { PrincipleCardView } from '../../components/PrincipleCard';
import { PrincipleDetail } from '../../components/PrincipleDetail';
import { StudentBadge } from './StudentHome';
import { useReadyStudent } from '../../app/StudentContext';
import { AI_USER_DEFINITION, CORE_VALUES, PRINCIPLES, PRINCIPLES_BALANCE, PRINCIPLES_NOTE, PRINCIPLES_TITLE } from '../../data/principles';
import { getChapter } from '../../data/scenarios';

export default function CardsPage() {
  const { student } = useReadyStudent();
  return (
    <Layout right={<StudentBadge />} wide>
      <h1 className="typewriter flex items-center gap-2 text-2xl font-bold">
        <Library className="h-7 w-7 text-declass" aria-hidden="true" />AI 윤리원칙 카드 도감
      </h1>
      <progress className="progress progress-secondary mt-2 w-full max-w-sm" value={student.cards.length} max={PRINCIPLES.length} aria-hidden="true" />
      <p className="text-ink-soft">
        「{PRINCIPLES_TITLE}」의 7대 원칙이에요. 사건 파일 끝에서 성찰을 쓰면 카드를 받아요. ({student.cards.length} / {PRINCIPLES.length}장)
      </p>

      <section className="mt-5" aria-label="3대 가치">
        <h2 className="text-lg font-bold">모든 원칙이 지키려는 3대 가치</h2>
        <ul className="mt-2 grid gap-3 sm:grid-cols-3">
          {CORE_VALUES.map((v) => (
            <li key={v.id} className="dossier p-4">
              <p className="typewriter flex items-center gap-2 text-lg font-bold">
                <span className="grid h-9 w-9 place-items-center rounded-full bg-accent text-accent-content">
                  <ValueIcon id={v.id} className="h-5 w-5" />
                </span>
                {v.name}
              </p>
              <p className="text-[16px]">{v.description}</p>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-6" aria-label="7대 원칙 카드">
        <h2 className="text-lg font-bold">7대 원칙 카드</h2>
        <ul className="mt-2 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {PRINCIPLES.map((p) => {
            const owned = student.cards.includes(p.id);
            const ch = getChapter(p.chapter);
            return (
              <li key={p.id} className="flex flex-col gap-1">
                <PrincipleCardView principle={p} owned={owned} />
                <p className="text-center text-[14px] text-ink-soft">
                  사건 파일 「{ch.title}」에서 {owned ? '받았어요' : '받을 수 있어요'}
                </p>
              </li>
            );
          })}
        </ul>
      </section>
      <section className="mt-8 flex flex-col gap-3" aria-label="원문 살펴보기">
        <h2 className="text-lg font-bold">원문 살펴보기 — 기획서·윤리 점검에 써요</h2>
        <p className="text-[16px] text-ink-soft">
          이 수업에서 우리는 AI를 활용해 콘텐츠를 만드는 ‘AI 이용자’예요. 원문의 뜻: {AI_USER_DEFINITION}
        </p>
        {PRINCIPLES.map((p) => (
          <PrincipleDetail key={p.id} principle={p} />
        ))}
        <p className="rounded-box bg-base-200 p-3 text-[15px]">
          <strong>원칙끼리 부딪칠 때는?</strong> {PRINCIPLES_BALANCE}
        </p>
      </section>
      <p className="mt-4 text-[14px] text-ink-soft">
        「{PRINCIPLES_TITLE}」 {PRINCIPLES_NOTE}
      </p>
      <div className="mt-6">
        <LinkButton to="/play" variant="secondary">
          <ArrowLeft className="h-5 w-5" aria-hidden="true" />
          6차시 로드맵
        </LinkButton>
      </div>
    </Layout>
  );
}
