import { Link, useNavigate } from 'react-router-dom';
import { GraduationCap, School, Sparkles, Clock3 } from 'lucide-react';
import { useAuth } from '../../app/AuthContext';
import { APP } from '../../content/lessons';
import ReadAloudButton from '../../components/ReadAloudButton';

const CARDS = [
  {
    to: '/student/login',
    icon: GraduationCap,
    title: '학생으로 시작하기',
    body: '선생님이 알려 준 학급 코드가 있나요? 여기로 오세요.',
    color: 'border-primary/40 hover:border-primary',
    iconColor: 'text-primary',
  },
  {
    to: '/teacher/login',
    icon: School,
    title: '선생님으로 시작하기',
    body: '학급을 만들고 수업을 진행해요.',
    color: 'border-secondary/40 hover:border-secondary',
    iconColor: 'text-secondary',
  },
  {
    to: '/trial',
    icon: Sparkles,
    title: '먼저 체험해 보기',
    body: '로그인 없이 수업 활동을 미리 해 볼 수 있어요.',
    color: 'border-accent/40 hover:border-accent',
    iconColor: 'text-accent',
  },
];

export default function LandingPage() {
  const { startTrial, configured } = useAuth();
  const navigate = useNavigate();

  const intro = `${APP.name}. ${APP.subtitle}. ${APP.tagline}`;

  return (
    <div className="min-h-screen bg-base-200 px-4 py-10">
      <div className="mx-auto w-full max-w-4xl">
        <header className="text-center">
          <p className="inline-flex items-center gap-2 rounded-2xl bg-primary/15 px-4 py-1.5 text-sm font-bold text-primary">
            <Clock3 className="h-4 w-4" aria-hidden />
            중학교 역사 · 조선 사회의 변동
          </p>
          <h1 className="mt-4 text-4xl font-extrabold tracking-tight sm:text-5xl">{APP.name}</h1>
          <p className="mt-2 text-lg font-bold text-secondary">{APP.subtitle}</p>
          <p className="mx-auto mt-3 max-w-md text-base opacity-80">{APP.tagline}</p>
          <div className="mt-3 flex justify-center">
            <ReadAloudButton text={intro} />
          </div>
        </header>

        {!configured && (
          <div className="mt-8 alert alert-info rounded-2xl" role="status">
            <span>
              아직 Firebase 설정이 없어요. 지금은 <b>체험해 보기</b>만 쓸 수 있어요. (README 참고)
            </span>
          </div>
        )}

        <div className="mt-10 grid gap-5 sm:grid-cols-3">
          {CARDS.map((card) => {
            const Icon = card.icon;
            const isTrial = card.to === '/trial';
            const disabled = !configured && !isTrial;
            return (
              <Link
                key={card.to}
                to={disabled ? '#' : card.to}
                aria-disabled={disabled}
                className={`card rounded-2xl border-2 bg-base-100 shadow-sm transition ${card.color} ${
                  disabled ? 'pointer-events-none opacity-40' : ''
                }`}
                onClick={(e) => {
                  if (isTrial) {
                    e.preventDefault();
                    startTrial();
                    navigate('/trial');
                  }
                }}
              >
                <div className="card-body items-center gap-2 p-6 text-center">
                  <Icon className={`h-12 w-12 ${card.iconColor}`} aria-hidden />
                  <h2 className="card-title text-lg">{card.title}</h2>
                  <p className="text-sm opacity-80">{card.body}</p>
                </div>
              </Link>
            );
          })}
        </div>

        <p className="mt-10 text-center text-xs opacity-60">
          이 앱은 학생의 실제 이메일이나 전화번호를 받지 않아요.
        </p>
      </div>
    </div>
  );
}
