import * as THREE from 'three';

/**
 * 지오메트리 보조 도구.
 *
 * 재질은 여러 건물이 함께 쓰므로(드로우콜 절약) 텍스처의 반복 횟수를 재질에
 * 넣을 수 없다. 대신 **지오메트리의 UV 를 늘려** 건물마다 알맞은 밀도로
 * 무늬가 반복되게 한다. 큰 벽에는 벽돌이 많이, 작은 문틀에는 적게 들어간다.
 */
export function scaleUV(geometry: THREE.BufferGeometry, su: number, sv: number): THREE.BufferGeometry {
  const uv = geometry.getAttribute('uv');
  if (!uv) return geometry;
  for (let i = 0; i < uv.count; i += 1) {
    uv.setXY(i, uv.getX(i) * su, uv.getY(i) * sv);
  }
  uv.needsUpdate = true;
  return geometry;
}

/** 상자를 만들면서 크기에 비례해 UV 를 깐다 (텍스처 밀도를 일정하게 유지) */
export function texturedBox(
  w: number,
  h: number,
  d: number,
  tilesPerUnit = 0.5,
): THREE.BoxGeometry {
  const geometry = new THREE.BoxGeometry(w, h, d);
  scaleUV(geometry, Math.max(w, d) * tilesPerUnit, h * tilesPerUnit);
  return geometry;
}

/** 모서리를 아주 살짝 깎은 상자 — 빛을 받는 선이 생겨 밋밋함이 줄어든다 */
export function bevelBox(w: number, h: number, d: number, bevel = 0.02): THREE.BufferGeometry {
  const shape = new THREE.Shape();
  const hw = w / 2;
  const hh = h / 2;
  shape.moveTo(-hw + bevel, -hh);
  shape.lineTo(hw - bevel, -hh);
  shape.quadraticCurveTo(hw, -hh, hw, -hh + bevel);
  shape.lineTo(hw, hh - bevel);
  shape.quadraticCurveTo(hw, hh, hw - bevel, hh);
  shape.lineTo(-hw + bevel, hh);
  shape.quadraticCurveTo(-hw, hh, -hw, hh - bevel);
  shape.lineTo(-hw, -hh + bevel);
  shape.quadraticCurveTo(-hw, -hh, -hw + bevel, -hh);
  const geometry = new THREE.ExtrudeGeometry(shape, {
    depth: d,
    bevelEnabled: false,
    curveSegments: 1,
  });
  geometry.translate(0, 0, -d / 2);
  geometry.computeVertexNormals();
  return geometry;
}
