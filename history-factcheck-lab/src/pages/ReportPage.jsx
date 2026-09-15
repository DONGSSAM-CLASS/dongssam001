import { Navigate, useParams } from 'react-router-dom';

/** /report/:caseId 는 학습 루프의 6단계와 같은 화면이므로 그쪽으로 넘긴다. */
export default function ReportPage() {
  const { caseId } = useParams();
  return <Navigate to={`/learn/${caseId}/6`} replace />;
}
