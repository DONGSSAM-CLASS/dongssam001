/**
 * 인증서를 PNG 이미지로 그린다. (외부 라이브러리 없이 canvas 로 — 페이지에 불러온 글꼴을 그대로 쓴다)
 */
export interface CertificateData {
  appTitle: string;
  className: string;
  number: number;
  nickname: string;
  sentence: string;
  free: string;
  cards: { icon: string; name: string; color: string }[];
  dateText: string;
}

const W = 1240;
const H = 1754; // A4 세로 비율 (150dpi)

/** 한국어 글자 단위로 줄바꿈 */
function wrap(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const lines: string[] = [];
  for (const para of text.split('\n')) {
    let line = '';
    for (const ch of para) {
      const test = line + ch;
      if (ctx.measureText(test).width > maxWidth && line) {
        lines.push(line);
        line = ch.trimStart();
      } else line = test;
    }
    lines.push(line);
  }
  return lines;
}

export async function drawCertificate(d: CertificateData): Promise<string> {
  await document.fonts.ready;
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d')!;
  const sans = '"Noto Sans KR", "Apple SD Gothic Neo", "Malgun Gothic", sans-serif';
  const mono = '"Nanum Gothic Coding", monospace';

  // 종이
  ctx.fillStyle = '#fbf6ea';
  ctx.fillRect(0, 0, W, H);
  ctx.strokeStyle = '#2b2620';
  ctx.lineWidth = 6;
  ctx.strokeRect(50, 50, W - 100, H - 100);
  ctx.lineWidth = 2;
  ctx.strokeRect(68, 68, W - 136, H - 136);

  ctx.textAlign = 'center';
  ctx.fillStyle = '#564c40';
  ctx.font = `28px ${mono}`;
  ctx.fillText(d.appTitle, W / 2, 160);

  ctx.fillStyle = '#2b2620';
  ctx.font = `bold 76px ${mono}`;
  ctx.fillText('AI 윤리 실천 인증서', W / 2, 270);

  ctx.font = `36px ${sans}`;
  ctx.fillText(`${d.className} · ${d.number}번 ${d.nickname}`, W / 2, 360);

  // 선언문
  ctx.textAlign = 'left';
  ctx.font = `bold 40px ${sans}`;
  let y = 470;
  for (const line of wrap(ctx, d.sentence, W - 260)) {
    ctx.fillText(line, 130, y);
    y += 62;
  }
  if (d.free) {
    y += 20;
    ctx.font = `32px ${sans}`;
    ctx.fillStyle = '#3a332a';
    for (const line of wrap(ctx, d.free, W - 260).slice(0, 12)) {
      ctx.fillText(line, 130, y);
      y += 50;
    }
  }

  // 모은 원칙 카드
  y = Math.max(y + 70, 900);
  ctx.fillStyle = '#564c40';
  ctx.font = `28px ${sans}`;
  ctx.fillText(`모은 원칙 카드 ${d.cards.length}장`, 130, y);
  y += 30;
  let x = 130;
  ctx.font = `bold 26px ${sans}`;
  for (const c of d.cards) {
    const label = `${c.icon} ${c.name}`;
    const w = ctx.measureText(label).width + 40;
    if (x + w > W - 130) {
      x = 130;
      y += 70;
    }
    ctx.fillStyle = c.color;
    ctx.beginPath();
    ctx.roundRect(x, y, w, 54, 27);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.fillText(label, x + 20, y + 37);
    x += w + 14;
  }

  // 날짜와 도장
  ctx.textAlign = 'center';
  ctx.fillStyle = '#2b2620';
  ctx.font = `32px ${sans}`;
  ctx.fillText(d.dateText, W / 2, H - 230);
  ctx.save();
  ctx.translate(W - 250, H - 250);
  ctx.rotate(-0.14);
  ctx.strokeStyle = '#1f6f43';
  ctx.fillStyle = '#1f6f43';
  ctx.lineWidth = 7;
  ctx.strokeRect(-120, -52, 240, 104);
  ctx.font = `bold 48px ${mono}`;
  ctx.fillText('기밀 해제', 0, 17);
  ctx.restore();

  return canvas.toDataURL('image/png');
}
