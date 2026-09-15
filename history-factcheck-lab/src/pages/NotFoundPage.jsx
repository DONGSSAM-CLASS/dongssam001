import { Link } from 'react-router-dom';

export default function NotFoundPage() {
  return (
    <section className="card-file">
      <h1 className="text-2xl font-bold">사건 파일을 찾지 못했습니다</h1>
      <p className="mt-3 leading-reading">주소를 다시 확인해 주세요.</p>
      <Link to="/" className="btn-primary mt-4">
        홈으로 돌아가기
      </Link>
    </section>
  );
}
