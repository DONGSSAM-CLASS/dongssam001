import { Link } from 'react-router-dom';

const links = [
  { to: '/teacher/verify', title: '문항 검수', desc: '초안을 불러와 주제·단원·유형을 확정하고 배포용 items.json 내려받기', ready: true },
  { to: '/teacher/project', title: '수업 투사 모드', desc: '단원 대표 문항을 큰 글씨로 전체화면 표시(프로젝터용)', ready: true },
  { to: '/teacher/worksheet', title: '학습지 내보내기', desc: '선택 단원 기출 목록을 인쇄용 표로 출력', ready: true },
  { to: '/teacher/share', title: '필터 공유(QR)', desc: '현재 필터를 URL·QR 코드로 공유', ready: true },
];

/** 교사용 홈 — 교사 전용 화면 모음. */
export default function TeacherHome() {
  return (
    <div>
      <h1 className="mb-1 text-xl font-bold text-slate-900">교사용</h1>
      <p className="mb-4 text-sm text-slate-500">수업과 데이터 검수를 위한 교사 전용 기능입니다.</p>
      <div className="grid gap-3 sm:grid-cols-2">
        {links.map((l) => (
          <Link
            key={l.to}
            to={l.to}
            className="rounded-lg border bg-white p-4 transition hover:border-blue-300 hover:shadow-sm"
          >
            <div className="font-semibold text-slate-800">{l.title}</div>
            <div className="mt-1 text-sm text-slate-500">{l.desc}</div>
          </Link>
        ))}
      </div>
    </div>
  );
}
