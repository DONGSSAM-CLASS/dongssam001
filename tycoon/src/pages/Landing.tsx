import { Link } from 'react-router-dom';

export default function Landing() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-xl flex-col justify-center gap-8 px-4 py-10">
      <header className="text-center">
        <p className="text-base font-bold text-navy-600">학급 경제 운영 플랫폼</p>
        <h1 className="mt-2 text-3xl font-black leading-tight text-navy-700 sm:text-4xl">
          동쌤의<br />교실 국가 타이쿤
        </h1>
        <p className="mt-4 text-base leading-relaxed text-gray-600">
          우리 반을 하나의 나라처럼 운영합니다.<br />
          일해서 월급을 받고, 세금을 내고, 저축과 투자를 해 봅니다.
        </p>
      </header>

      <div className="flex flex-col gap-4">
        <Link
          to="/student/login"
          className="btn rounded-2xl bg-sky-500 px-6 py-5 text-center text-xl font-black text-white shadow-sm"
        >
          학생으로 들어가기
        </Link>
        <Link
          to="/teacher/login"
          className="btn rounded-2xl bg-navy-600 px-6 py-5 text-center text-xl font-black text-white shadow-sm"
        >
          선생님으로 들어가기
        </Link>
      </div>

      <p className="text-center text-sm text-gray-500">
        학생은 이름·번호 외의 개인정보를 입력하지 않습니다.
      </p>
    </main>
  );
}
