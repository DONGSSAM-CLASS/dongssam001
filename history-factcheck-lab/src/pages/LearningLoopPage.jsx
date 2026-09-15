import { useParams } from 'react-router-dom';

import PagePlaceholder from '../components/PagePlaceholder.jsx';

// 모든 케이스 공통 6단계 학습 루프 (0~6)
export const LOOP_STEPS = [
  { no: 0, name: '탐구 질문 다듬기', basis: '교수·학습 (2)-(나), 평가 (2)-(라)①' },
  { no: 1, name: 'AI에게 묻기', basis: '교수·학습 (2)-(마)' },
  { no: 2, name: '문장 판정', basis: '과정·기능 ②' },
  { no: 3, name: '사료 검증 워크벤치', basis: '교수·학습 (2)-(가), 과정·기능 ①' },
  { no: 4, name: '출처 기재', basis: '과정·기능 ③' },
  { no: 5, name: '세 줄 출처 메모 + 나의 서사', basis: '과정·기능 ④, 평가 (2)-(나)' },
  { no: 6, name: '탐정 리포트', basis: '평가 (2)-(다)' },
];

export default function LearningLoopPage() {
  const { caseId } = useParams();

  return (
    <PagePlaceholder
      title="학습 루프"
      phase="Phase 3"
      curriculum="과정·기능 ①~④ 전체와 1:1 대응"
    >
      <p className="mb-3">
        사건 번호: <code>{caseId}</code>
      </p>
      <p className="mb-3">
        상단 고정 스텝 인디케이터와 단계별 화면이 이 자리에 들어갑니다. 뒤로 가기를 허용하되 입력값은
        보존합니다.
      </p>
      <ol className="list-decimal space-y-1 pl-6" start={0}>
        {LOOP_STEPS.map((step) => (
          <li key={step.no}>
            <span className="font-bold">{step.name}</span>
            <span className="text-sm text-ink-soft"> — {step.basis}</span>
          </li>
        ))}
      </ol>
    </PagePlaceholder>
  );
}
