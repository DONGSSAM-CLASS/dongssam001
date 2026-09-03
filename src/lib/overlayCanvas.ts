/**
 * 지구본 오버레이(왕조 영역·교역로·국경선·학생 핀)를 그리는 등장방형 캔버스 크기.
 * 저사양 기기에서는 절반 해상도를 써서 연대를 바꿀 때 텍스처 갱신 비용을 줄인다.
 */
export function isLowEndDevice(): boolean {
  if (typeof navigator === 'undefined') return false;
  const nav = navigator as Navigator & { deviceMemory?: number };
  return (nav.hardwareConcurrency ?? 8) <= 4 || (nav.deviceMemory ?? 8) <= 4;
}

/** [width, height] — 가로:세로 = 2:1 (등장방형) */
export function overlaySize(): [number, number] {
  return isLowEndDevice() ? [1024, 512] : [2048, 1024];
}
