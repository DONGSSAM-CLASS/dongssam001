/** 지구본 WebGL 캔버스를 PNG 로 저장 (서버 없이 브라우저에서 처리) */
export function exportGlobePng(filename: string): boolean {
  const canvas = document.querySelector('canvas');
  if (!canvas) return false;
  canvas.toBlob((blob) => {
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename.endsWith('.png') ? filename : `${filename}.png`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }, 'image/png');
  return true;
}
