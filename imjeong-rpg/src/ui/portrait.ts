import type { Appearance, Figure } from '../types';

/**
 * 인물 초상 — 캔버스로 그린 반신 그림.
 *
 * 3D 화면에서는 인물이 작아 옷의 생김새가 잘 보이지 않는다.
 * 『거상』이 화면 왼쪽 위에 큼직한 초상을 두는 것도 같은 이유다.
 * 여기서는 3D 와 **똑같은 차림 데이터**(`Appearance`)로 초상을 그려,
 * 두루마기의 동정과 고름, 여성 한복의 깃, 군복의 견장과 깃, 갓·중절모·군모를
 * 크게 보여 준다.
 *
 * ⚠ 얼굴은 양식화한다. 실존 인물의 이목구비를 그리지 않는다.
 *   널리 알려진 사진에서 확인되는 「옷·머리·안경·수염」만 옮긴다.
 */

const W = 320;
const H = 380;

const SKIN = { young: '#f0cda9', middle: '#e8c39d', old: '#e0b994' } as const;
const SKIN_SHADE = { young: '#d8ab86', middle: '#cfa17d', old: '#c69a77' } as const;

function hairTone(app: Appearance): string {
  if (app.age === 'old') return app.facialHair === 'long-beard' ? '#9a9389' : '#5c554b';
  return '#241d17';
}

function darken(hex: string, amount: number): string {
  const n = parseInt(hex.slice(1), 16);
  const f = (v: number) => Math.max(0, Math.min(255, Math.round(v * (1 - amount))));
  return `#${[f((n >> 16) & 255), f((n >> 8) & 255), f(n & 255)]
    .map((v) => v.toString(16).padStart(2, '0'))
    .join('')}`;
}

function lighten(hex: string, amount: number): string {
  const n = parseInt(hex.slice(1), 16);
  const f = (v: number) => Math.max(0, Math.min(255, Math.round(v + (255 - v) * amount)));
  return `#${[f((n >> 16) & 255), f((n >> 8) & 255), f(n & 255)]
    .map((v) => v.toString(16).padStart(2, '0'))
    .join('')}`;
}

/** 윤곽선을 그린 뒤 채운다 — 손으로 그린 듯한 선을 만든다 */
function inked(ctx: CanvasRenderingContext2D, fill: string, line = '#2a2118', width = 3) {
  ctx.fillStyle = fill;
  ctx.fill();
  ctx.strokeStyle = line;
  ctx.lineWidth = width;
  ctx.lineJoin = 'round';
  ctx.stroke();
}

/* ───────────────────────── 부위별 그리기 ───────────────────────── */

const CX = W / 2;
const SHOULDER_Y = 262;
const NECK_Y = 232;
const HEAD_Y = 150;
const HEAD_R = 62;

/** 어깨와 몸통 — 옷 종류에 따라 실루엣이 달라진다 */
function drawTorso(ctx: CanvasRenderingContext2D, app: Appearance) {
  const coat = app.coat;
  const deep = darken(coat, 0.22);

  ctx.beginPath();
  if (app.garment === 'hanbok-woman') {
    // 저고리 — 어깨가 좁고 소매가 옆으로 길게 뻗는다
    ctx.moveTo(CX - 26, NECK_Y);
    ctx.bezierCurveTo(CX - 92, SHOULDER_Y - 18, CX - 138, SHOULDER_Y + 26, CX - 146, H);
    ctx.lineTo(CX + 146, H);
    ctx.bezierCurveTo(CX + 138, SHOULDER_Y + 26, CX + 92, SHOULDER_Y - 18, CX + 26, NECK_Y);
    ctx.closePath();
  } else if (app.garment === 'durumagi' || app.garment === 'changshan') {
    // 두루마기 — 어깨선이 완만하게 떨어진다
    ctx.moveTo(CX - 24, NECK_Y);
    ctx.bezierCurveTo(CX - 86, SHOULDER_Y - 14, CX - 124, SHOULDER_Y + 40, CX - 132, H);
    ctx.lineTo(CX + 132, H);
    ctx.bezierCurveTo(CX + 124, SHOULDER_Y + 40, CX + 86, SHOULDER_Y - 14, CX + 24, NECK_Y);
    ctx.closePath();
  } else {
    // 양복·군복·학생복 — 어깨가 각지다
    ctx.moveTo(CX - 26, NECK_Y);
    ctx.lineTo(CX - 104, SHOULDER_Y - 2);
    ctx.lineTo(CX - 122, H);
    ctx.lineTo(CX + 122, H);
    ctx.lineTo(CX + 104, SHOULDER_Y - 2);
    ctx.lineTo(CX + 26, NECK_Y);
    ctx.closePath();
  }
  const grad = ctx.createLinearGradient(CX - 120, SHOULDER_Y, CX + 120, H);
  grad.addColorStop(0, lighten(coat, 0.12));
  grad.addColorStop(0.5, coat);
  grad.addColorStop(1, deep);
  inked(ctx, grad as unknown as string);

  // 목
  ctx.beginPath();
  ctx.moveTo(CX - 22, NECK_Y + 6);
  ctx.lineTo(CX - 20, NECK_Y - 26);
  ctx.lineTo(CX + 20, NECK_Y - 26);
  ctx.lineTo(CX + 22, NECK_Y + 6);
  ctx.closePath();
  inked(ctx, SKIN_SHADE[app.age], '#2a2118', 2);
}

/** 옷의 마감 — 이 부분이 옷의 정체를 결정한다 */
function drawGarmentDetail(ctx: CanvasRenderingContext2D, app: Appearance) {
  const coat = app.coat;

  if (app.garment === 'durumagi' || app.garment === 'hanbok-woman') {
    // 깃 — 목에서 가슴 가운데로 모이는 V. 그 위에 흰 동정을 덧댄다.
    const cross = NECK_Y + (app.garment === 'hanbok-woman' ? 66 : 92);
    const collar = darken(coat, 0.12);

    // 아래로 깔리는 쪽 깃 (오른쪽)
    ctx.beginPath();
    ctx.moveTo(CX + 30, NECK_Y - 2);
    ctx.lineTo(CX + 58, NECK_Y + 10);
    ctx.lineTo(CX + 4, cross + 26);
    ctx.lineTo(CX - 6, cross + 2);
    ctx.closePath();
    inked(ctx, collar, '#2a2118', 2.5);

    // 위로 덮는 쪽 깃 (왼쪽)
    ctx.beginPath();
    ctx.moveTo(CX - 30, NECK_Y - 2);
    ctx.lineTo(CX - 58, NECK_Y + 10);
    ctx.lineTo(CX + 10, cross + 34);
    ctx.lineTo(CX + 14, cross + 6);
    ctx.closePath();
    inked(ctx, lighten(coat, 0.06), '#2a2118', 2.5);

    // 동정 — 깃 위에 덧댄 좁은 흰 띠. 한복을 한복으로 보이게 하는 가장 큰 단서.
    ctx.beginPath();
    ctx.moveTo(CX - 31, NECK_Y - 3);
    ctx.lineTo(CX - 48, NECK_Y + 6);
    ctx.lineTo(CX + 8, cross + 18);
    ctx.lineTo(CX + 13, cross + 2);
    ctx.closePath();
    inked(ctx, '#ffffff', '#4a4338', 2.5);

    ctx.beginPath();
    ctx.moveTo(CX + 31, NECK_Y - 3);
    ctx.lineTo(CX + 46, NECK_Y + 6);
    ctx.lineTo(CX + 2, cross + 12);
    ctx.lineTo(CX - 2, cross - 2);
    ctx.closePath();
    inked(ctx, '#f4f1e9', '#4a4338', 2.5);

    // 고름 — 깃이 모이는 곳에서 매듭을 짓고 두 자락이 늘어진다
    const ribbon = app.garment === 'hanbok-woman' ? '#9b3a4c' : darken(coat, 0.26);
    const kx = CX + 16;
    const ky = cross + 22;
    ctx.beginPath();
    ctx.roundRect(kx - 6, ky, 16, H - ky - 6, 6);
    inked(ctx, ribbon, '#2a2118', 2.5);
    ctx.beginPath();
    ctx.roundRect(kx + 16, ky + 6, 14, H - ky - 22, 6);
    inked(ctx, darken(ribbon, 0.14), '#2a2118', 2.5);
    ctx.beginPath();
    ctx.ellipse(kx + 8, ky - 2, 17, 13, -0.25, 0, Math.PI * 2);
    inked(ctx, ribbon, '#2a2118', 2.5);
    return;
  }

  if (app.garment === 'changshan') {
    // 입식 칼라와 옆으로 여미는 단추
    ctx.beginPath();
    ctx.roundRect(CX - 30, NECK_Y - 4, 60, 26, 8);
    inked(ctx, darken(coat, 0.16), '#2a2118', 2.5);
    for (let i = 0; i < 3; i += 1) {
      ctx.beginPath();
      ctx.arc(CX + 34 + i * 4, NECK_Y + 44 + i * 30, 6, 0, Math.PI * 2);
      inked(ctx, darken(coat, 0.3), '#2a2118', 2);
    }
    return;
  }

  if (app.garment === 'uniform') {
    // 깃 · 견장 · 가슴 주머니 — 군복의 표식
    for (const sx of [-1, 1]) {
      ctx.beginPath();
      ctx.moveTo(CX + sx * 22, NECK_Y + 4);
      ctx.lineTo(CX + sx * 62, NECK_Y + 30);
      ctx.lineTo(CX + sx * 30, NECK_Y + 52);
      ctx.closePath();
      inked(ctx, darken(coat, 0.14), '#2a2118', 2.5);

      ctx.beginPath();
      ctx.roundRect(CX + sx * 92 - 16, SHOULDER_Y - 6, 32, 15, 5);
      inked(ctx, app.trim, '#2a2118', 2.5);

      ctx.beginPath();
      ctx.roundRect(CX + sx * 64 - 27, H - 74, 54, 48, 5);
      inked(ctx, darken(coat, 0.08), '#2a2118', 2.5);
      ctx.beginPath();
      ctx.roundRect(CX + sx * 64 - 29, H - 80, 58, 12, 4);
      inked(ctx, app.trim, '#2a2118', 2);
    }
    return;
  }

  if (app.garment === 'student') {
    ctx.beginPath();
    ctx.roundRect(CX - 32, NECK_Y - 6, 64, 28, 9);
    inked(ctx, app.trim, '#2a2118', 2.5);
    for (let i = 0; i < 3; i += 1) {
      ctx.beginPath();
      ctx.arc(CX, NECK_Y + 52 + i * 34, 7, 0, Math.PI * 2);
      inked(ctx, '#c8ab5e', '#2a2118', 2);
    }
    return;
  }

  // 양복 — 셔츠·넥타이·옷깃
  ctx.beginPath();
  ctx.moveTo(CX - 28, NECK_Y + 2);
  ctx.lineTo(CX, H - 44);
  ctx.lineTo(CX + 28, NECK_Y + 2);
  ctx.closePath();
  inked(ctx, app.trim, '#2a2118', 2.5);

  ctx.beginPath();
  ctx.moveTo(CX - 10, NECK_Y + 16);
  ctx.lineTo(CX + 10, NECK_Y + 16);
  ctx.lineTo(CX + 16, NECK_Y + 34);
  ctx.lineTo(CX + 9, H - 20);
  ctx.lineTo(CX - 9, H - 20);
  ctx.lineTo(CX - 16, NECK_Y + 34);
  ctx.closePath();
  inked(ctx, '#5d3a33', '#2a2118', 2.5);

  for (const sx of [-1, 1]) {
    ctx.beginPath();
    ctx.moveTo(CX + sx * 24, NECK_Y + 2);
    ctx.lineTo(CX + sx * 74, SHOULDER_Y + 16);
    ctx.lineTo(CX + sx * 30, H - 30);
    ctx.closePath();
    inked(ctx, darken(app.coat, 0.14), '#2a2118', 2.5);
  }
}

function drawHead(ctx: CanvasRenderingContext2D, app: Appearance) {
  const skin = SKIN[app.age];

  // 귀
  for (const sx of [-1, 1]) {
    ctx.beginPath();
    ctx.ellipse(CX + sx * (HEAD_R - 4), HEAD_Y + 12, 11, 17, 0, 0, Math.PI * 2);
    inked(ctx, SKIN_SHADE[app.age], '#2a2118', 2.5);
  }

  // 얼굴 — 턱이 갸름한 달걀형
  ctx.beginPath();
  ctx.moveTo(CX - HEAD_R, HEAD_Y - 6);
  ctx.bezierCurveTo(CX - HEAD_R, HEAD_Y - 66, CX + HEAD_R, HEAD_Y - 66, CX + HEAD_R, HEAD_Y - 6);
  ctx.bezierCurveTo(CX + HEAD_R, HEAD_Y + 52, CX + 22, HEAD_Y + 82, CX, HEAD_Y + 82);
  ctx.bezierCurveTo(CX - 22, HEAD_Y + 82, CX - HEAD_R, HEAD_Y + 52, CX - HEAD_R, HEAD_Y - 6);
  ctx.closePath();
  const face = ctx.createLinearGradient(CX - HEAD_R, HEAD_Y - 60, CX + HEAD_R, HEAD_Y + 80);
  face.addColorStop(0, lighten(skin, 0.1));
  face.addColorStop(1, SKIN_SHADE[app.age]);
  inked(ctx, face as unknown as string, '#2a2118', 3);

  // 눈 — 점만 찍는다
  const ink = '#241c16';
  for (const sx of [-1, 1]) {
    ctx.beginPath();
    ctx.ellipse(CX + sx * 22, HEAD_Y + 8, 7, 5, 0, 0, Math.PI * 2);
    ctx.fillStyle = ink;
    ctx.fill();
    // 눈썹
    ctx.beginPath();
    ctx.moveTo(CX + sx * 10, HEAD_Y - 12);
    ctx.quadraticCurveTo(CX + sx * 23, HEAD_Y - (app.age === 'old' ? 20 : 17), CX + sx * 35, HEAD_Y - 10);
    ctx.strokeStyle = hairTone(app);
    ctx.lineWidth = app.age === 'old' ? 5 : 6;
    ctx.lineCap = 'round';
    ctx.stroke();
  }

  // 코와 입
  ctx.beginPath();
  ctx.moveTo(CX - 5, HEAD_Y + 30);
  ctx.quadraticCurveTo(CX, HEAD_Y + 36, CX + 6, HEAD_Y + 30);
  ctx.strokeStyle = SKIN_SHADE[app.age];
  ctx.lineWidth = 4;
  ctx.stroke();

  // 입 — 수염이 있어도 그 아래에 입이 보여야 사람 얼굴로 읽힌다
  const mouthY = app.facialHair === 'none' ? HEAD_Y + 52 : HEAD_Y + 60;
  ctx.beginPath();
  ctx.moveTo(CX - 13, mouthY);
  ctx.quadraticCurveTo(CX, mouthY + 5, CX + 13, mouthY);
  ctx.strokeStyle = '#96624f';
  ctx.lineWidth = 4;
  ctx.stroke();
}

function drawFacialHair(ctx: CanvasRenderingContext2D, app: Appearance) {
  if (app.facialHair === 'none') return;
  const tone = hairTone(app);
  // 콧수염 — 작게 그리면 초상 카드에서 사라진다. 코 아래를 확실히 덮는다.
  ctx.beginPath();
  ctx.moveTo(CX - 28, HEAD_Y + 42);
  ctx.quadraticCurveTo(CX - 14, HEAD_Y + 37, CX, HEAD_Y + 40);
  ctx.quadraticCurveTo(CX + 14, HEAD_Y + 37, CX + 28, HEAD_Y + 42);
  ctx.quadraticCurveTo(CX + 14, HEAD_Y + 52, CX, HEAD_Y + 50);
  ctx.quadraticCurveTo(CX - 14, HEAD_Y + 52, CX - 28, HEAD_Y + 42);
  ctx.closePath();
  inked(ctx, tone, '#211a14', 2.5);

  if (app.facialHair === 'mustache') return;

  if (app.facialHair === 'beard') {
    ctx.beginPath();
    ctx.moveTo(CX - 46, HEAD_Y + 46);
    ctx.quadraticCurveTo(CX, HEAD_Y + 116, CX + 46, HEAD_Y + 46);
    ctx.quadraticCurveTo(CX, HEAD_Y + 74, CX - 46, HEAD_Y + 46);
    ctx.closePath();
    inked(ctx, tone, '#2a2118', 2.5);
    return;
  }

  // 긴 수염 — 가슴까지 내려온다
  ctx.beginPath();
  ctx.moveTo(CX - 42, HEAD_Y + 46);
  ctx.bezierCurveTo(CX - 46, HEAD_Y + 140, CX - 20, HEAD_Y + 186, CX, HEAD_Y + 190);
  ctx.bezierCurveTo(CX + 20, HEAD_Y + 186, CX + 46, HEAD_Y + 140, CX + 42, HEAD_Y + 46);
  ctx.quadraticCurveTo(CX, HEAD_Y + 74, CX - 42, HEAD_Y + 46);
  ctx.closePath();
  inked(ctx, tone, '#2a2118', 3);
}

function drawHair(ctx: CanvasRenderingContext2D, app: Appearance) {
  const tone = hairTone(app);
  const top = HEAD_Y - 62;

  const crown = (height = 0) => {
    ctx.beginPath();
    ctx.moveTo(CX - HEAD_R - 3, HEAD_Y + 2);
    ctx.bezierCurveTo(CX - HEAD_R - 6, top - 20 - height, CX + HEAD_R + 6, top - 20 - height, CX + HEAD_R + 3, HEAD_Y + 2);
    ctx.bezierCurveTo(CX + 44, HEAD_Y - 26, CX - 44, HEAD_Y - 26, CX - HEAD_R - 3, HEAD_Y + 2);
    ctx.closePath();
    inked(ctx, tone, '#211a14', 3);
  };

  switch (app.hair) {
    case 'cropped':
      crown(0);
      break;
    case 'parted': {
      crown(8);
      // 가르마 — 한쪽으로 쓸어 넘긴 결
      ctx.beginPath();
      ctx.moveTo(CX - 18, top - 16);
      ctx.quadraticCurveTo(CX + 30, top - 6, CX + 52, HEAD_Y - 20);
      ctx.strokeStyle = lighten(tone, 0.22);
      ctx.lineWidth = 5;
      ctx.stroke();
      break;
    }
    case 'sleek':
      crown(4);
      for (let i = -2; i <= 2; i += 1) {
        ctx.beginPath();
        ctx.moveTo(CX + i * 16, top - 14);
        ctx.quadraticCurveTo(CX + i * 18, HEAD_Y - 42, CX + i * 22, HEAD_Y - 24);
        ctx.strokeStyle = lighten(tone, 0.18);
        ctx.lineWidth = 3;
        ctx.stroke();
      }
      break;
    case 'balding':
      // 옆과 뒤에만 남은 머리
      for (const sx of [-1, 1]) {
        ctx.beginPath();
        ctx.ellipse(CX + sx * 52, HEAD_Y - 10, 18, 30, sx * 0.3, 0, Math.PI * 2);
        inked(ctx, tone, '#211a14', 3);
      }
      break;
    case 'topknot': {
      crown(0);
      // 망건 — 이마를 두르는 띠
      ctx.beginPath();
      ctx.roundRect(CX - HEAD_R - 4, HEAD_Y - 44, (HEAD_R + 4) * 2, 22, 6);
      inked(ctx, '#2a2119', '#191309', 2.5);
      // 상투
      ctx.beginPath();
      ctx.roundRect(CX - 15, top - 54, 30, 44, 12);
      inked(ctx, tone, '#211a14', 3);
      break;
    }
    case 'bun': {
      crown(6);
      // 가운데 가르마
      ctx.beginPath();
      ctx.moveTo(CX, top - 14);
      ctx.lineTo(CX, HEAD_Y - 40);
      ctx.strokeStyle = lighten(tone, 0.2);
      ctx.lineWidth = 4;
      ctx.stroke();
      // 쪽 — 뒤통수 아래
      ctx.beginPath();
      ctx.ellipse(CX + HEAD_R + 14, HEAD_Y + 44, 26, 20, 0.2, 0, Math.PI * 2);
      inked(ctx, tone, '#211a14', 3);
      // 비녀 — 모자를 쓰면 가려지므로 그리지 않는다
      if (app.headwear === 'none') {
        ctx.beginPath();
        ctx.roundRect(CX + HEAD_R - 14, HEAD_Y + 38, 64, 7, 4);
        inked(ctx, '#c9a24b', '#6b551f', 2);
      }
      break;
    }
    case 'bob': {
      crown(6);
      for (const sx of [-1, 1]) {
        ctx.beginPath();
        ctx.moveTo(CX + sx * (HEAD_R + 2), HEAD_Y - 18);
        ctx.quadraticCurveTo(CX + sx * (HEAD_R + 20), HEAD_Y + 44, CX + sx * (HEAD_R - 6), HEAD_Y + 62);
        ctx.quadraticCurveTo(CX + sx * (HEAD_R + 2), HEAD_Y + 20, CX + sx * (HEAD_R - 10), HEAD_Y - 16);
        ctx.closePath();
        inked(ctx, tone, '#211a14', 3);
      }
      break;
    }
  }
}

function drawHeadwear(ctx: CanvasRenderingContext2D, app: Appearance) {
  const top = HEAD_Y - 62;
  switch (app.headwear) {
    case 'gat': {
      // 갓 — 넓은 양태에 원통 대우, 턱 아래 갓끈
      ctx.beginPath();
      ctx.roundRect(CX - 40, top - 62, 80, 62, 6);
      inked(ctx, '#332c24', '#14100b', 3);
      ctx.beginPath();
      ctx.ellipse(CX, top - 2, 128, 20, 0, 0, Math.PI * 2);
      inked(ctx, '#2b251e', '#14100b', 3);
      ctx.beginPath();
      ctx.ellipse(CX, top - 8, 128, 18, 0, 0, Math.PI * 2);
      inked(ctx, '#3a3229', '#14100b', 2);
      for (const sx of [-1, 1]) {
        for (let i = 0; i < 4; i += 1) {
          ctx.beginPath();
          ctx.arc(CX + sx * (58 - i * 5), top + 24 + i * 26, 7, 0, Math.PI * 2);
          inked(ctx, '#3f362d', '#191309', 2);
        }
      }
      break;
    }
    case 'tanggeon':
      ctx.beginPath();
      ctx.roundRect(CX - 52, top - 42, 104, 56, 10);
      inked(ctx, '#2c2721', '#14100b', 3);
      ctx.beginPath();
      ctx.roundRect(CX - 42, top - 62, 84, 30, 9);
      inked(ctx, '#332d26', '#14100b', 3);
      break;
    case 'fedora':
      ctx.beginPath();
      ctx.ellipse(CX, top + 4, 108, 22, 0, 0, Math.PI * 2);
      inked(ctx, '#3c352c', '#191309', 3);
      ctx.beginPath();
      ctx.moveTo(CX - 54, top + 4);
      ctx.quadraticCurveTo(CX - 48, top - 56, CX, top - 58);
      ctx.quadraticCurveTo(CX + 48, top - 56, CX + 54, top + 4);
      ctx.closePath();
      inked(ctx, '#463d32', '#191309', 3);
      ctx.beginPath();
      ctx.roundRect(CX - 56, top - 16, 112, 20, 4);
      inked(ctx, '#241f19', '#14100b', 2);
      break;
    case 'military-cap': {
      // 군모 — 낮은 모자통에 앞으로 뻗은 챙
      const capTop = top + 6;
      ctx.beginPath();
      ctx.moveTo(CX - 58, capTop + 26);
      ctx.quadraticCurveTo(CX - 54, capTop - 26, CX, capTop - 28);
      ctx.quadraticCurveTo(CX + 54, capTop - 26, CX + 58, capTop + 26);
      ctx.closePath();
      inked(ctx, '#5e6344', '#191309', 3);
      // 모자 띠
      ctx.beginPath();
      ctx.roundRect(CX - 61, capTop + 18, 122, 15, 5);
      inked(ctx, '#474c33', '#191309', 2.5);
      // 챙 — 아래로 조금 기운 반달
      ctx.beginPath();
      ctx.ellipse(CX, capTop + 36, 76, 15, 0, Math.PI, Math.PI * 2);
      ctx.closePath();
      inked(ctx, '#2b2721', '#14100b', 3);
      // 모표
      ctx.beginPath();
      ctx.arc(CX, capTop - 2, 13, 0, Math.PI * 2);
      inked(ctx, '#c2a355', '#6b551f', 2.5);
      break;
    }
    default:
      break;
  }
}

function drawGlasses(ctx: CanvasRenderingContext2D) {
  const y = HEAD_Y + 8;
  ctx.strokeStyle = '#332d25';
  ctx.lineWidth = 5;
  for (const sx of [-1, 1]) {
    ctx.beginPath();
    ctx.arc(CX + sx * 22, y, 21, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(206, 226, 234, 0.3)';
    ctx.fill();
    ctx.stroke();
  }
  ctx.beginPath();
  ctx.moveTo(CX - 1, y - 2);
  ctx.lineTo(CX + 1, y - 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(CX - 43, y - 3);
  ctx.lineTo(CX - 62, y - 8);
  ctx.moveTo(CX + 43, y - 3);
  ctx.lineTo(CX + 62, y - 8);
  ctx.stroke();
}

/* ───────────────────────── 진입점 ───────────────────────── */

const cache = new Map<string, string>();

/**
 * 인물 초상을 그려 data URL 로 돌려준다.
 * 같은 인물은 한 번만 그리고 재사용한다.
 */
export function portraitDataUrl(figure: Figure): string {
  const hit = cache.get(figure.id);
  if (hit) return hit;

  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  const app = figure.appearance;

  // 배경 — 인물 뒤에 은은한 동그라미
  const bg = ctx.createRadialGradient(CX, 170, 40, CX, 190, 230);
  bg.addColorStop(0, '#4a4234');
  bg.addColorStop(1, '#241f18');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);
  ctx.beginPath();
  ctx.arc(CX, 168, 132, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(201, 162, 75, 0.12)';
  ctx.fill();

  drawTorso(ctx, app);
  drawGarmentDetail(ctx, app);
  drawHead(ctx, app);
  drawHair(ctx, app);
  drawFacialHair(ctx, app);
  if (app.glasses) drawGlasses(ctx);
  drawHeadwear(ctx, app);

  const url = canvas.toDataURL('image/png');
  cache.set(figure.id, url);
  return url;
}

export function clearPortraitCache(): void {
  cache.clear();
}
