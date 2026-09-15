import { Link } from 'react-router-dom';

import PagePlaceholder from '../components/PagePlaceholder.jsx';

export default function HomePage() {
  return (
    <div className="space-y-5">
      <section className="card-file">
        <h1 className="text-2xl font-bold">역사탐정 프로젝트</h1>
        <p className="mt-3 leading-reading">
          AI가 알려 준 역사 이야기는 어디까지 믿을 수 있을까요? 이 앱에서는 미리 준비된 AI 답변을
          한 문장씩 따져 보고, 사료를 직접 열어 <strong>출처 확인 → 맥락화 → 교차검증</strong> 세
          단계로 검증한 뒤, APA 7판 양식으로 출처를 기재하고 나만의 역사 서사를 써 봅니다.
        </p>
        <p className="mt-3 rounded-sm border border-alert/40 bg-white/60 p-3 text-sm">
          이 앱의 &lsquo;AI 답변&rsquo;은 수업용으로 미리 작성된 예시입니다. 실제 AI 답변과
          마찬가지로 오류가 섞여 있습니다.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Link to="/cases/korea" className="btn-primary">
            한국사 트랙
          </Link>
          <Link to="/cases/world" className="btn-primary">
            세계사 트랙
          </Link>
          <Link to="/guide" className="btn-quiet">
            아카이브 사용법
          </Link>
        </div>
      </section>

      <PagePlaceholder
        title="복구 코드 · 학습 진행률"
        phase="Phase 3"
        curriculum="평가 (2)-(마) 디지털 격차 유의 — 로그인 없음, 6자리 복구 코드로만 이어쓰기"
      >
        <p>
          진행률 바와 6자리 복구 코드 입력란이 이 자리에 들어갑니다. 이름 입력은 선택 사항이며, 어떤
          정보도 기기 밖으로 전송되지 않습니다.
        </p>
      </PagePlaceholder>
    </div>
  );
}
