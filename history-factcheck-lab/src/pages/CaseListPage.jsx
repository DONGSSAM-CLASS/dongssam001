import { useParams } from 'react-router-dom';

import PagePlaceholder from '../components/PagePlaceholder.jsx';

const TRACK_LABEL = { korea: '한국사', world: '세계사' };

export default function CaseListPage() {
  const { track } = useParams();
  const label = TRACK_LABEL[track] ?? '알 수 없는';

  return (
    <PagePlaceholder
      title={`${label} 사건부 목록`}
      phase="Phase 2 · Phase 5"
      curriculum="[9역01-02] 다양한 자료와 사례를 통해 역사 탐구 방법을 익힌다"
    >
      <p>
        난이도 · 예상 소요 시간 · 성취기준 코드 · 완료 뱃지를 표시하는 카드 그리드가 들어갑니다.
        케이스 데이터는 <code>src/data/cases.korea.json</code>,{' '}
        <code>src/data/cases.world.json</code>에서 읽습니다.
      </p>
    </PagePlaceholder>
  );
}
