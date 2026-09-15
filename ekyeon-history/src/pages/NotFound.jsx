import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div className="state">
      <h2>찾으시는 페이지가 없습니다</h2>
      <p>주소를 다시 확인해 주세요.</p>
      <Link className="btn btn--solid" to="/">홈으로 이동</Link>
    </div>
  );
}
