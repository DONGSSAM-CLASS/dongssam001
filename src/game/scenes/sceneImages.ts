import type { SceneKey } from '../types';
import availableList from './available.json';

/**
 * 시네마틱 실사(래스터) 이미지 슬롯.
 *
 * scripts/generate-scene-images.mjs 가 GPT Image 로 생성한 이미지를
 * public/game/scenes/<sceneKey>.jpg 로 저장하고, 생성된 키 목록을 available.json 에 기록한다.
 * 이미지가 준비된 씬만 실사 이미지로 표시하고, 나머지는 SVG 시네마틱 씬으로 폴백한다.
 * (이미지가 하나도 없으면 전부 기존 SVG 로 보인다 — 404 잡음 없음)
 */
export const availableSceneImages = new Set<SceneKey>(availableList as SceneKey[]);

export function sceneImagePath(scene: SceneKey): string {
  return `/game/scenes/${scene}.jpg`;
}

export function hasSceneImage(scene: SceneKey): boolean {
  return availableSceneImages.has(scene);
}
