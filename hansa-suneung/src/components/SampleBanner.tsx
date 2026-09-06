import { useData } from '../data/DataContext';

/** 예시(샘플) 데이터가 로드되었을 때 상단에 경고 배너를 표시한다. */
export default function SampleBanner() {
  const { isSample } = useData();
  if (!isSample) return null;
  return (
    <div className="bg-yellow-400 px-4 py-1.5 text-center text-xs font-semibold text-yellow-950">
      ⚠️ 예시(샘플) 데이터입니다 — 실제 수능 기출 데이터가 아닙니다. 개발 확인용으로만 표시됩니다.
    </div>
  );
}
