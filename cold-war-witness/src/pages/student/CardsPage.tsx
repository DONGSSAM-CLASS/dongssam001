import { Layout } from '../../components/Layout';
import { LinkButton } from '../../components/ui';
import { PrincipleCardView } from '../../components/PrincipleCard';
import { StudentBadge } from './StudentHome';
import { useReadyStudent } from '../../app/StudentContext';
import { CORE_VALUES, PRINCIPLES, PRINCIPLES_NOTE, PRINCIPLES_TITLE } from '../../data/principles';
import { getChapter } from '../../data/scenarios';

export default function CardsPage() {
  const { student } = useReadyStudent();
  return (
    <Layout right={<StudentBadge />} wide>
      <h1 className="typewriter text-2xl font-bold">🗂️ 내 원칙 카드 도감</h1>
      <p className="text-ink-soft">
        {PRINCIPLES_TITLE}의 7대 원칙이에요. 챕터 끝에서 성찰을 쓰면 카드를 받아요. ({student.cards.length} / {PRINCIPLES.length}장)
      </p>

      <section className="mt-5" aria-label="3대 가치">
        <h2 className="text-lg font-bold">모든 원칙이 지키려는 3대 가치</h2>
        <ul className="mt-2 grid gap-3 sm:grid-cols-3">
          {CORE_VALUES.map((v) => (
            <li key={v.id} className="dossier p-4">
              <p className="typewriter text-lg font-bold">
                <span aria-hidden="true">{v.icon}</span> {v.name}
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
                  CHAPTER {ch.no} 「{ch.title}」에서 {owned ? '받았어요' : '받을 수 있어요'}
                </p>
              </li>
            );
          })}
        </ul>
      </section>
      <p className="mt-4 text-[14px] text-ink-soft">{PRINCIPLES_NOTE}</p>
      <div className="mt-6">
        <LinkButton to="/play" variant="secondary">
          ◀ 사건 파일 목록
        </LinkButton>
      </div>
    </Layout>
  );
}
