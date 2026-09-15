import { Link } from 'react-router-dom';
import {
  ArrowRight, BookOpen, Code2, Handshake, Info, LayoutGrid, Mail, ScrollText, Sparkles,
} from 'lucide-react';
import SectionTitle from '../components/SectionTitle';
import WebAppCard from '../components/WebAppCard';
import { TEACHER_WEBAPPS } from '../data/webapps';
import { CONTACT_EMAIL, IDENTITY_BADGES, SITE_NAME } from '../lib/constants';

const SPACES = [
  {
    to: '/lessons',
    icon: BookOpen,
    label: '수업 공간',
    tagline: '함께 만든 수업을 남깁니다',
    desc: '연구팀 선생님들의 수업 나눔 자료와 수업 공개 실적을 연도별로 쌓아 갑니다. 승인된 회원은 직접 등록할 수 있습니다.',
    cta: '수업 기록 보기',
  },
  {
    to: '/dev',
    icon: Code2,
    label: '개발 공간',
    tagline: '함께 만드는 중입니다',
    desc: '연구팀이 개발 중인 자료와 작업 파일을 모아 둔 공간입니다. 비밀번호 확인 후 공유 드라이브로 연결됩니다.',
    cta: '개발 공간 들어가기',
  },
  {
    to: '/about',
    icon: Info,
    label: '소개 공간',
    tagline: '우리가 어떤 모임인지',
    desc: '역사연구팀이 어떤 연구회이고 무엇을 하는지 소개합니다. 공식 노션 페이지에서 더 자세한 기록을 볼 수 있습니다.',
    cta: '연구팀 소개 보기',
  },
  {
    to: '/webapps',
    icon: LayoutGrid,
    label: '개발 웹앱',
    tagline: '교실에서 바로 쓰는 도구',
    desc: '선생님들이 직접 만든 역사 수업용 웹앱을 모았습니다. QR 코드를 전면에 띄워 학생들이 바로 접속할 수 있습니다.',
    cta: '웹앱 갤러리 보기',
  },
];

export default function Home() {
  return (
    <>
      {/* 1. 히어로 — 사이트 정체성 */}
      <section className="hero">
        <div className="hero__grid hero__grid--solo">
          <div className="hero__copy">
            <div className="hero__badges">
              {IDENTITY_BADGES.map((badge) => (
                <span key={badge} className="hero__badge"><Sparkles size={14} />{badge}</span>
              ))}
            </div>
            <h1 className="hero__vision">
              역사 수업을 함께 연구하고,<br />함께 만든 것을 <span className="lit">남깁니다</span>
            </h1>
            <div className="hero__lead">
              <strong>{SITE_NAME}</strong>
              <ul className="hero__identity">
                <li>
                  전국 단위 에듀테크 교육 연구자 모임 <strong>‘에듀테크 교사 연구회(에크연)’의 스핀오프 연구회</strong>
                </li>
                <li><strong>교육부 역사교사학습공동체</strong></li>
              </ul>
            </div>
            <div className="hero__actions">
              <Link to="/lessons" className="btn btn--solid btn--lg"><BookOpen />수업 공간 보기</Link>
              <Link to="/collaborate" className="btn btn--ghost btn--lg"><Handshake />협업 요청하기</Link>
            </div>
          </div>
        </div>
      </section>

      {/* 2. 4개 핵심 공간 */}
      <section className="section" id="spaces">
        <SectionTitle
          eyebrow="Spaces"
          title="네 개의 공간에서 함께합니다"
          lead="수업을 나누는 곳, 함께 개발하는 곳, 연구팀을 소개하는 곳, 만든 도구를 공개하는 곳으로 나누어 두었습니다."
        />
        <div className="typegrid md:grid-cols-2 xl:grid-cols-4">
          {SPACES.map((space) => {
            const Icon = space.icon;
            return (
              <Link key={space.to} to={space.to} className="typecard group">
                <span className="typecard__icon"><Icon /></span>
                <span className="typecard__label">{space.label}</span>
                <span className="typecard__tagline">{space.tagline}</span>
                <p>{space.desc}</p>
                <span className="typecard__cta">{space.cta}<ArrowRight /></span>
              </Link>
            );
          })}
        </div>
      </section>

      {/* 4. 웹앱 하이라이트 */}
      <section className="section">
        <SectionTitle
          eyebrow="Web apps"
          title="수업에 바로 쓰는 웹앱"
          lead="[QR 코드] 버튼을 누르면 화면 전면에 QR 이 떠서 학생들이 바로 접속할 수 있습니다."
        />
        <div className="appgrid">
          {TEACHER_WEBAPPS.slice(0, 3).map((app) => <WebAppCard key={app.id} app={app} />)}
        </div>
        <div className="mt-8">
          <Link to="/webapps" className="btn btn--ghost">웹앱 전체 보기<ArrowRight /></Link>
        </div>
      </section>

      {/* 5. 협업 안내 밴드 + 메일 CTA */}
      <section className="section section--band">
        <div className="band">
          <div>
            <h3>강의·연수, 공동 개발, 협업을 함께할 분을 기다립니다</h3>
            <p>
              교원 연수와 강의, 수업 자료와 웹앱 공동 개발, 학교·기관 프로젝트, 집필과 자문까지
              함께해 왔습니다. 개인과 기관 모두 편하게 요청해 주세요. 담당자가 확인 후 회신드립니다.
            </p>
            <div className="hero__actions">
              <Link to="/collaborate" className="btn btn--solid"><Handshake />협업 요청하기</Link>
              <a className="btn btn--ghost" href={`mailto:${CONTACT_EMAIL}`}><Mail />{CONTACT_EMAIL}</a>
            </div>
          </div>
          <ul className="band__list">
            <li><Link to="/lessons">연구팀의 수업 기록 살펴보기 <ArrowRight size={16} /></Link></li>
            <li><Link to="/webapps">수업에 바로 쓰는 웹앱 보기 <ArrowRight size={16} /></Link></li>
            <li><Link to="/about">연구팀이 어떤 곳인지 보기 <ArrowRight size={16} /></Link></li>
          </ul>
        </div>
        <p className="band__vision">
          <ScrollText className="mr-2 inline h-5 w-5 text-primary" aria-hidden="true" />
          역사 수업을 함께 연구하고, 함께 만든 것을 남깁니다
        </p>
      </section>
    </>
  );
}
