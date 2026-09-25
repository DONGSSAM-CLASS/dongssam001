import { APP_TITLE } from '../config';
import { Layout } from '../components/Layout';
import { LinkButton, Stamp } from '../components/ui';
import { useStudent } from '../app/StudentContext';
import { useAuth } from '../app/AuthContext';

export default function LandingPage() {
  const { status, session } = useStudent();
  const { isTeacher } = useAuth();
  const [main, sub] = APP_TITLE.split(' — ');
  return (
    <Layout>
      <section className="dossier relative overflow-hidden px-5 py-8 sm:px-8">
        <div className="absolute top-4 right-4" aria-hidden="true">
          <Stamp className="text-[15px]">기밀</Stamp>
        </div>
        <p className="typewriter text-[15px] text-ink-soft">냉전 문서 보관소 · 열람 허가</p>
        <h1 className="typewriter mt-2 text-3xl font-bold sm:text-4xl">{main}</h1>
        {sub && <p className="typewriter mt-1 text-xl text-ink-soft">{sub}</p>}
        <p className="mt-5 text-[18px]">
          여러분은 냉전 시대를 살아가는 <strong>평범한 시민</strong>이 됩니다.
          <br />
          누군가 지켜보는 세상에서 무엇을 선택할까요? 그리고 그 선택은 오늘날 <strong>AI</strong>와 어떻게 이어질까요?
        </p>
        <div className="mt-7 flex flex-col gap-3 sm:flex-row">
          {status === 'ready' && session ? (
            <LinkButton to="/play" className="text-[19px] sm:min-w-56">
              ▶ 이어서 하기 ({session.number}번)
            </LinkButton>
          ) : (
            <LinkButton to="/join" className="text-[19px] sm:min-w-56">
              ▶ 학생으로 들어가기
            </LinkButton>
          )}
          <LinkButton to="/teacher" variant="secondary" className="sm:min-w-44">
            {isTeacher ? '선생님 화면으로' : '선생님 로그인'}
          </LinkButton>
        </div>
      </section>
      <p className="mt-6 text-center">
        <LinkButton to="/about" variant="ghost">
          앱 정보 · 만든 사람 · 교육과정
        </LinkButton>
      </p>
    </Layout>
  );
}
