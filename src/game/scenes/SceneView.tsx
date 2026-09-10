import { useState } from 'react';
import type { SceneKey } from '../types';
import { CinematicScene } from './CinematicScene';
import { hasSceneImage, sceneImagePath } from './sceneImages';

const LABEL: Record<SceneKey, string> = {
  'chongqing-night': '안개에 잠긴 밤의 충칭과 양쯔강',
  ceremony: '태극기가 걸린 한국광복군 창설식장',
  recruit: '광복군 대원 모집 벽보가 붙은 거리',
  declaration: '대일 선전 성명서를 작성하는 임시정부',
  burma: '버마 전선의 밤, 확성기로 방송하는 공작대',
  'oss-xian': '시안 훈련장에서 낙하·잠입을 훈련하는 대원들',
  'liberation-dawn': '광복의 새벽, 떠오르는 해와 태극기',
};

/**
 * 배경 씬 렌더러. 실사 이미지가 준비돼 있으면 그것을, 없거나 로딩 실패 시 SVG 시네마틱 씬을 쓴다.
 * (요구사항 8: 실제 역사에 근거한 블록버스터 시네마틱 이미지 — 준비되면 자동 적용)
 */
export function SceneView({ scene, className }: { scene: SceneKey; className?: string }) {
  const [failed, setFailed] = useState(false);
  if (!hasSceneImage(scene) || failed) {
    return <CinematicScene scene={scene} className={className} />;
  }
  return (
    <img
      src={sceneImagePath(scene)}
      alt={LABEL[scene]}
      className={`${className ?? ''} h-full w-full object-cover`}
      loading="lazy"
      onError={() => setFailed(true)}
    />
  );
}
