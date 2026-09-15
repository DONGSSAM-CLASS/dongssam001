import { useParams } from 'react-router-dom';

import PagePlaceholder from '../components/PagePlaceholder.jsx';

export default function ReportPage() {
  const { caseId } = useParams();

  return (
    <PagePlaceholder
      title="탐정 리포트"
      phase="Phase 3 · Phase 6"
      curriculum="평가 (2)-(다), 평가 (2)-(라) 루브릭 4개 축"
    >
      <p>
        사건 번호 <code>{caseId}</code>의 문장 판정 정확도 · 사료 검증 점수 · APA 점수 · 작성한 서사 ·
        루브릭 자기평가를 한 장에 모은 결과 카드가 들어갑니다. 인쇄(print CSS)와 PNG 저장을
        지원합니다.
      </p>
    </PagePlaceholder>
  );
}
