/**
 * PDF 만들기.
 *
 * 한글 글꼴을 jsPDF 에 직접 넣으면 용량이 커지고 글자가 깨지기 쉬워서,
 * "화면용 A4 리포트 컴포넌트를 캡처 → 이미지로 jsPDF 에 붙이는" 방식을 쓴다.
 *
 * Tailwind v4 · daisyUI v5 는 oklch() 색을 쓰기 때문에 기존 html2canvas 로는 오류가 난다.
 * 반드시 html2canvas-pro 를 쓴다.
 */
import html2canvas from 'html2canvas-pro';
import { jsPDF } from 'jspdf';

/** A4 크기(mm)와 여백 */
export const A4 = { width: 210, height: 297, margin: 15 };

const CONTENT_WIDTH = A4.width - A4.margin * 2;
const CONTENT_HEIGHT = A4.height - A4.margin * 2;

/** Pretendard 가 다 읽힌 뒤에 캡처해야 글자가 제대로 나온다. */
async function waitForFonts() {
  if (typeof document !== 'undefined' && 'fonts' in document) {
    await document.fonts.ready;
  }
}

export async function captureElement(el: HTMLElement, scale = 2): Promise<HTMLCanvasElement> {
  await waitForFonts();
  return html2canvas(el, {
    scale,
    backgroundColor: '#ffffff',
    useCORS: true,
    logging: false,
  });
}

/** 출입증 카드 등을 PNG 파일로 내려받는다. */
export async function downloadElementAsPng(el: HTMLElement, fileName: string) {
  const canvas = await captureElement(el, 3);
  const url = canvas.toDataURL('image/png');
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName.endsWith('.png') ? fileName : `${fileName}.png`;
  link.click();
}

/**
 * 긴 화면을 A4 높이 기준으로 잘라서 여러 쪽 PDF 로 만든다.
 * 반환값은 Blob 이라 ZIP 으로 묶을 수도 있고 바로 저장할 수도 있다.
 */
export async function elementToPdfBlob(el: HTMLElement): Promise<Blob> {
  const canvas = await captureElement(el);
  const pdf = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait' });

  // 화면 픽셀 → mm 환산 비율
  const pxPerMm = canvas.width / CONTENT_WIDTH;
  const pageHeightPx = Math.floor(CONTENT_HEIGHT * pxPerMm);
  const pageCount = Math.max(1, Math.ceil(canvas.height / pageHeightPx));

  for (let page = 0; page < pageCount; page += 1) {
    const sliceTop = page * pageHeightPx;
    const sliceHeight = Math.min(pageHeightPx, canvas.height - sliceTop);
    if (sliceHeight <= 0) break;

    const slice = document.createElement('canvas');
    slice.width = canvas.width;
    slice.height = sliceHeight;
    const ctx = slice.getContext('2d');
    if (!ctx) throw new Error('PDF 를 만들지 못했어요.');
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, slice.width, slice.height);
    ctx.drawImage(canvas, 0, sliceTop, canvas.width, sliceHeight, 0, 0, canvas.width, sliceHeight);

    if (page > 0) pdf.addPage();
    pdf.addImage(
      slice.toDataURL('image/jpeg', 0.92),
      'JPEG',
      A4.margin,
      A4.margin,
      CONTENT_WIDTH,
      sliceHeight / pxPerMm,
    );
  }

  return pdf.output('blob');
}

export function downloadBlob(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  link.click();
  // 브라우저가 내려받기를 시작할 시간을 조금 준 뒤 정리한다.
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

/** 파일 이름에 쓸 수 없는 글자를 걷어낸다. */
export function safeFileName(raw: string): string {
  return raw.replace(/[\\/:*?"<>|]/g, '_').trim();
}
