import { Bot, GraduationCap, History, Info, Play, Sparkles, Vote } from 'lucide-react';
import { APP_TITLE } from '../config';
import { Layout } from '../components/Layout';
import { LinkButton } from '../components/ui';
import { useStudent } from '../app/StudentContext';
import { useAuth } from '../app/AuthContext';

const STEPS = [
  { icon: History, title: '냉전 속 시민 되기', text: '1980년대 동베를린, 1950년대 뉴욕, 1962년 플로리다' },
  { icon: Vote, title: '선택하고 확인하기', text: '내 선택의 결과와 실제 역사를 비교해요' },
  { icon: Bot, title: 'AI 시대와 잇기', text: '성찰을 쓰고 AI 윤리 원칙 카드를 모아요' },
];

export default function LandingPage() {
  const { status, session } = useStudent();
  const { isTeacher } = useAuth();
  const [main, sub] = APP_TITLE.split(' — ');
  return (
    <Layout>
      <section className="dossier relative overflow-hidden px-5 py-8 text-center sm:px-10">
        <div
          className="pointer-events-none absolute -top-16 -right-16 h-48 w-48 rounded-full bg-secondary/60"
          aria-hidden="true"
        />
        <div
          className="pointer-events-none absolute -bottom-20 -left-16 h-48 w-48 rounded-full bg-primary/40"
          aria-hidden="true"
        />
        <div className="relative">
          <span className="badge h-auto gap-1 border-0 bg-accent px-3 py-1 text-[15px] font-bold text-accent-content">
            <Sparkles className="h-4 w-4" aria-hidden="true" />
            중학교 2학년 역사 × AI 윤리
          </span>
          <h1 className="typewriter mt-4 text-4xl font-extrabold sm:text-5xl">{main}</h1>
          {sub && <p className="mt-2 text-xl font-medium text-ink-soft">{sub}</p>}
          <p className="mx-auto mt-5 max-w-xl text-[18px]">
            여러분은 냉전 시대를 살아가는 <strong>평범한 시민</strong>이 됩니다. 누군가 지켜보는 세상에서 무엇을 선택할까요? 그리고 그 선택은
            오늘날 <strong>AI</strong>와 어떻게 이어질까요?
          </p>
          <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
            {status === 'ready' && session ? (
              <LinkButton to="/play" className="text-[19px] sm:min-w-60">
                <Play className="h-5 w-5" aria-hidden="true" />
                이어서 하기 ({session.number}번)
              </LinkButton>
            ) : (
              <LinkButton to="/join" className="text-[19px] sm:min-w-60">
                <Play className="h-5 w-5" aria-hidden="true" />
                학생으로 들어가기
              </LinkButton>
            )}
            <LinkButton to="/teacher" variant="secondary" className="sm:min-w-48">
              <GraduationCap className="h-5 w-5" aria-hidden="true" />
              {isTeacher ? '선생님 화면으로' : '선생님 로그인'}
            </LinkButton>
          </div>
        </div>
      </section>

      <ol className="mt-6 grid gap-3 sm:grid-cols-3">
        {STEPS.map(({ icon: Icon, title, text }, i) => (
          <li key={title} className="dossier flex items-start gap-3 p-4 sm:flex-col sm:items-center sm:text-center">
            <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-primary text-primary-content">
              <Icon className="h-6 w-6" aria-hidden="true" />
            </span>
            <span>
              <span className="block font-bold">
                {i + 1}. {title}
              </span>
              <span className="text-[15px] text-ink-soft">{text}</span>
            </span>
          </li>
        ))}
      </ol>

      <p className="mt-6 text-center">
        <LinkButton to="/about" variant="ghost">
          <Info className="h-5 w-5" aria-hidden="true" />앱 정보 · 만든 사람 · 교육과정
        </LinkButton>
      </p>
    </Layout>
  );
}
