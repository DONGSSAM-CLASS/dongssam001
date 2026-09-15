import { Link } from 'react-router-dom';
import { BookOpen, ExternalLink, FlaskConical, Handshake, NotebookPen, Users } from 'lucide-react';
import SectionTitle from '../components/SectionTitle';
import { IDENTITY_BADGES, NOTION_ABOUT_URL, SITE_NAME, SITE_NAME_EN } from '../lib/constants';

const WORKS = [
  {
    icon: FlaskConical,
    title: '역사 수업 연구',
    desc: '사료 탐구, 개념 학습, 프로젝트 수업 등 역사과 수업 방법을 함께 연구하고 교실에서 적용해 봅니다.',
  },
  {
    icon: NotebookPen,
    title: '수업 나눔과 기록',
    desc: '수업 자료와 수업 공개 실적을 수업 공간에 남겨, 서로의 수업을 참고할 수 있도록 누적합니다.',
  },
  {
    icon: BookOpen,
    title: '에듀테크 도구 개발',
    desc: '역사 수업에 필요한 웹앱과 디지털 자료를 선생님들이 직접 만들고, 누구나 쓸 수 있도록 공개합니다.',
  },
  {
    icon: Users,
    title: '연수와 협업',
    desc: '교원 연수와 강의, 학교·기관과의 공동 프로젝트로 연구 결과를 현장에 나눕니다.',
  },
];

export default function About() {
  return (
    <div className="page">
      <SectionTitle
        eyebrow="About us"
        title="에듀테크 교사 연구회 역사연구팀"
        lead={SITE_NAME_EN}
      />

      {/* 사이트 정체성 — 홈 히어로 · 푸터와 동일하게 명시합니다. */}
      <div className="identity-card">
        <div className="identity-card__badges">
          {IDENTITY_BADGES.map((badge) => (
            <span key={badge} className="badge badge-outline badge-primary h-auto px-3 py-2 text-xs font-semibold">
              {badge}
            </span>
          ))}
        </div>
        <p>
          <strong>{SITE_NAME}</strong>은 전국 단위 에듀테크 교육 연구자 모임{' '}
          <strong>‘에듀테크 교사 연구회(에크연)’의 스핀오프 연구회</strong>이자,{' '}
          <strong>교육부 역사교사학습공동체</strong>입니다.
        </p>
        <p>역사 수업을 함께 연구하고, 함께 만든 것을 남깁니다.</p>
      </div>

      <h3 className="subhead">이런 일을 합니다</h3>
      <div className="cards xl:grid-cols-4">
        {WORKS.map((work) => {
          const Icon = work.icon;
          return (
            <article key={work.title} className="card">
              <span className="typecard__icon"><Icon /></span>
              <h3>{work.title}</h3>
              <p>{work.desc}</p>
            </article>
          );
        })}
      </div>

      <h3 className="subhead">공식 노션 페이지</h3>
      <a className="linkcard linkcard--outbound" href={NOTION_ABOUT_URL} target="_blank" rel="noreferrer noopener">
        <div>
          <h3>역사연구팀 공식 노션</h3>
          <p>연구팀의 활동 기록과 자료를 노션 페이지에서 자세히 보실 수 있습니다. 새 창으로 열립니다.</p>
        </div>
        <span className="linkcard__action">노션 페이지 열기 <ExternalLink /></span>
      </a>

      <div className="join-note">
        <Handshake />
        <span>
          함께 연구하고 싶은 선생님, 협업을 원하는 기관은 <Link to="/collaborate">협업 요청</Link> 페이지에서 연락해 주세요.
        </span>
      </div>
    </div>
  );
}
