// ---------------------------------------------------------------------------
// art.js — 시네마틱 장면 배경과 인물 초상을 SVG 로 그린다.
//
//  왜 SVG 인가
//   · 고려 시대의 사진은 존재하지 않는다. 실사처럼 보이는 가짜 이미지를 만들어
//     붙이는 것은 역사 수업 자료로 옳지 않다.
//   · 대신 '영화의 한 장면' 같은 실루엣 + 광원 + 입자 연출로 몰입감을 만든다.
//   · 형태와 소품은 모두 실제 역사에 근거한다(만월대 회랑, 팔작지붕, 강화 갯벌,
//     벽란도의 돛, 상감 청자의 빛깔 등).
//   · 외부 파일이 없으므로 로딩 실패나 저작권 문제가 없고, 어떤 화면 크기에서도
//     선명하다.
// ---------------------------------------------------------------------------

const SCENES = {
  // 1장 · 개경 만월대의 눈 오는 밤
  palace: {
    sky: ['#101940', '#27356b', '#495a91'],
    glow: '#ffd79a',
    glowPos: [0.62, 0.34],
    particle: 'snow',
    build: 'palace',
  },
  // 2장 · 눈보라 치는 국경, 거란 진영
  border: {
    sky: ['#1b2238', '#3c4666', '#6d6f87'],
    glow: '#ffb36b',
    glowPos: [0.3, 0.42],
    particle: 'snow',
    build: 'camp',
  },
  // 3장 · 불타는 개경의 밤
  fire: {
    sky: ['#2a1110', '#5c2016', '#9e4020'],
    glow: '#ff7a3c',
    glowPos: [0.72, 0.52],
    particle: 'ember',
    build: 'burning',
  },
  // 4장 · 강화도 앞바다
  sea: {
    sky: ['#0c1e2e', '#1b4a66', '#3782a0'],
    glow: '#9fd8ff',
    glowPos: [0.24, 0.3],
    particle: 'rain',
    build: 'sea',
  },
  // 5장 · 원 간섭기의 개경, 잿빛 하늘
  yuan: {
    sky: ['#232739', '#474a68', '#7a7194'],
    glow: '#c9a6ff',
    glowPos: [0.5, 0.26],
    particle: 'dust',
    build: 'yuan',
  },
  // 6장 · 벽란도의 아침
  port: {
    sky: ['#3a2242', '#9a4f57', '#f0a967'],
    glow: '#ffe0a3',
    glowPos: [0.78, 0.44],
    particle: 'gull',
    build: 'port',
  },
  // 인트로 · 시간의 문
  gate: {
    sky: ['#080d20', '#182755', '#2c458f'],
    glow: '#8fd0ff',
    glowPos: [0.5, 0.45],
    particle: 'star',
    build: 'gate',
  },
};

function esc(n) { return Number(n).toFixed(1); }

// ── 입자(눈/불티/비/먼지/별) ───────────────────────────────────────────
function particles(kind, seed) {
  let rnd = seed || 7;
  const rand = () => ((rnd = (rnd * 9301 + 49297) % 233280) / 233280);
  const out = [];
  const spec = {
    snow:  { n: 70, r: [1, 3],   fill: '#ffffff', op: [0.25, 0.8], dur: [7, 16] },
    ember: { n: 55, r: [1, 2.6], fill: '#ffb166', op: [0.3, 0.95], dur: [4, 10], up: true },
    rain:  { n: 60, r: [0.6, 1.4], fill: '#bfe4ff', op: [0.2, 0.6], dur: [1.6, 3.4], streak: true },
    dust:  { n: 45, r: [1, 2.2], fill: '#d8cbe8', op: [0.15, 0.45], dur: [10, 22] },
    gull:  { n: 26, r: [1.2, 2.8], fill: '#fff3d8', op: [0.3, 0.8], dur: [12, 26] },
    star:  { n: 90, r: [0.6, 2.2], fill: '#dff0ff', op: [0.2, 1], dur: [2, 6], twinkle: true },
  }[kind] || { n: 40, r: [1, 2], fill: '#fff', op: [0.2, 0.6], dur: [8, 16] };

  for (let i = 0; i < spec.n; i++) {
    const x = rand() * 1000;
    const y = rand() * 700;
    const r = spec.r[0] + rand() * (spec.r[1] - spec.r[0]);
    const op = spec.op[0] + rand() * (spec.op[1] - spec.op[0]);
    const dur = spec.dur[0] + rand() * (spec.dur[1] - spec.dur[0]);
    const delay = -rand() * dur;
    if (spec.twinkle) {
      out.push(
        `<circle cx="${esc(x)}" cy="${esc(y)}" r="${esc(r)}" fill="${spec.fill}" opacity="${esc(op)}">` +
        `<animate attributeName="opacity" values="${esc(op)};${esc(op * 0.15)};${esc(op)}" ` +
        `dur="${esc(dur)}s" begin="${esc(delay)}s" repeatCount="indefinite"/></circle>`
      );
    } else if (spec.streak) {
      out.push(
        `<line x1="${esc(x)}" y1="${esc(y)}" x2="${esc(x - 8)}" y2="${esc(y + 22)}" ` +
        `stroke="${spec.fill}" stroke-width="${esc(r)}" opacity="${esc(op)}">` +
        `<animateTransform attributeName="transform" type="translate" values="0,-260;0,760" ` +
        `dur="${esc(dur)}s" begin="${esc(delay)}s" repeatCount="indefinite"/></line>`
      );
    } else {
      const dy = spec.up ? -360 : 360;
      const dx = spec.up ? 40 : (rand() * 70 - 35);
      out.push(
        `<circle cx="${esc(x)}" cy="${esc(y)}" r="${esc(r)}" fill="${spec.fill}" opacity="${esc(op)}">` +
        `<animateTransform attributeName="transform" type="translate" ` +
        `values="0,0;${esc(dx)},${esc(dy)}" dur="${esc(dur)}s" begin="${esc(delay)}s" repeatCount="indefinite"/>` +
        `<animate attributeName="opacity" values="0;${esc(op)};0" dur="${esc(dur)}s" ` +
        `begin="${esc(delay)}s" repeatCount="indefinite"/></circle>`
      );
    }
  }
  return out.join('');
}

// ── 건축/지형 실루엣 ───────────────────────────────────────────────────
// 팔작지붕 한 채 (고려 목조 건축의 완만한 처마 곡선을 반영)
function hall(cx, baseY, w, h, fill) {
  const half = w / 2;
  const eaveL = cx - half - w * 0.16;
  const eaveR = cx + half + w * 0.16;
  const ridgeY = baseY - h;
  const eaveY = baseY - h * 0.42;
  return (
    `<path d="M${esc(eaveL)},${esc(eaveY)} ` +
    `Q${esc(cx - half * 0.55)},${esc(eaveY - h * 0.2)} ${esc(cx)},${esc(ridgeY)} ` +
    `Q${esc(cx + half * 0.55)},${esc(eaveY - h * 0.2)} ${esc(eaveR)},${esc(eaveY)} ` +
    `Q${esc(cx + half * 0.6)},${esc(eaveY + h * 0.12)} ${esc(cx + half)},${esc(eaveY + h * 0.1)} ` +
    `L${esc(cx + half)},${esc(baseY)} L${esc(cx - half)},${esc(baseY)} ` +
    `L${esc(cx - half)},${esc(eaveY + h * 0.1)} ` +
    `Q${esc(cx - half * 0.6)},${esc(eaveY + h * 0.12)} ${esc(eaveL)},${esc(eaveY)} Z" fill="${fill}"/>`
  );
}

function ridgeline(pts, fill, o) {
  return `<path d="M0,700 L${pts.map((p) => `${esc(p[0])},${esc(p[1])}`).join(' L')} L1000,700 Z" fill="${fill}" opacity="${o}"/>`;
}

// 돛단배 (벽란도 / 강화)
function ship(x, y, s, fill) {
  return (
    `<g transform="translate(${esc(x)},${esc(y)}) scale(${esc(s)})" fill="${fill}">` +
    `<path d="M-52,0 Q0,22 52,0 L44,12 Q0,30 -44,12 Z"/>` +
    `<rect x="-2" y="-62" width="4" height="62"/>` +
    `<path d="M2,-58 Q34,-34 2,-8 Z"/>` +
    `<path d="M-2,-48 Q-26,-30 -2,-12 Z"/>` +
    `</g>`
  );
}

function buildScene(kind) {
  switch (kind) {
    case 'palace':
      return (
        ridgeline([[0, 500], [140, 410], [250, 470], [380, 365], [500, 450], [640, 380], [780, 460], [900, 405], [1000, 475]], '#2b3767', 1) +
        ridgeline([[0, 560], [180, 515], [340, 548], [520, 505], [700, 542], [880, 510], [1000, 545]], '#1c2648', 1) +
        // 만월대 축대(계단식 석축)
        `<path d="M60,700 L60,652 L940,652 L940,700 Z" fill="#0a0e20"/>` +
        `<path d="M130,652 L130,614 L870,614 L870,652 Z" fill="#0e1328"/>` +
        hall(500, 614, 320, 148, '#080b1a') +
        hall(210, 652, 176, 92, '#0b0f20') +
        hall(790, 652, 176, 92, '#0b0f20') +
        // 등불
        `<g fill="#ffcf87">` +
        [[300, 626], [400, 620], [600, 620], [700, 626]].map(
          ([x, y], i) =>
            `<circle cx="${x}" cy="${y}" r="5"><animate attributeName="opacity" values="0.55;1;0.55" dur="${3 + i * 0.7}s" repeatCount="indefinite"/></circle>`
        ).join('') +
        `</g>`
      );

    case 'camp':
      return (
        ridgeline([[0, 500], [160, 400], [300, 470], [460, 360], [620, 455], [780, 390], [1000, 470]], '#1c2133', 1) +
        ridgeline([[0, 580], [200, 545], [420, 575], [640, 540], [860, 570], [1000, 550]], '#252b40', 1) +
        // 거란 군막 줄지어 선 진영
        [110, 250, 390, 610, 750, 890].map((x, i) => {
          const s = i % 2 ? 1 : 0.82;
          return (
            `<g transform="translate(${x},640) scale(${s})">` +
            `<path d="M-58,0 L0,-64 L58,0 Z" fill="#141827"/>` +
            `<path d="M0,-64 L0,-84" stroke="#141827" stroke-width="3"/>` +
            `<path d="M0,-84 L26,-78 L0,-72 Z" fill="#8c2f2f"/>` +
            `</g>`
          );
        }).join('') +
        // 모닥불
        `<g>` +
        [[200, 655], [520, 660], [830, 652]].map(
          ([x, y], i) =>
            `<ellipse cx="${x}" cy="${y}" rx="26" ry="9" fill="#ff8a44" opacity="0.35">` +
            `<animate attributeName="rx" values="22;30;22" dur="${2 + i * 0.5}s" repeatCount="indefinite"/></ellipse>` +
            `<circle cx="${x}" cy="${y - 6}" r="9" fill="#ffc27a" opacity="0.8"/>`
        ).join('') +
        `</g>` +
        `<rect x="0" y="664" width="1000" height="36" fill="#0f1220"/>`
      );

    case 'burning':
      return (
        ridgeline([[0, 540], [180, 470], [360, 520], [540, 455], [720, 515], [900, 465], [1000, 510]], '#2a1210', 1) +
        hall(300, 640, 220, 100, '#1b0d0c') +
        hall(700, 630, 260, 118, '#1b0d0c') +
        // 불길
        `<g opacity="0.85">` +
        [[680, 600, 1], [720, 606, 0.8], [760, 598, 1.1], [300, 612, 0.7]].map(
          ([x, y, s], i) =>
            `<path transform="translate(${x},${y}) scale(${s})" ` +
            `d="M0,0 C-18,-26 -8,-44 0,-64 C10,-44 20,-26 0,0 Z" fill="#ff8a3c">` +
            `<animateTransform attributeName="transform" type="scale" additive="sum" ` +
            `values="1 1;1.12 0.9;1 1" dur="${1.4 + i * 0.3}s" repeatCount="indefinite"/></path>`
        ).join('') +
        `</g>` +
        `<rect x="0" y="648" width="1000" height="52" fill="#170a09"/>`
      );

    case 'sea':
      return (
        ridgeline([[0, 430], [170, 384], [330, 418], [520, 366], [700, 410], [870, 378], [1000, 414]], '#12394f', 1) +
        // 바다
        `<path d="M0,470 L1000,470 L1000,700 L0,700 Z" fill="#1d5876"/>` +
        [498, 530, 566, 606, 650].map((y, i) =>
          `<path d="M0,${y} Q125,${y - 8} 250,${y} T500,${y} T750,${y} T1000,${y}" ` +
          `stroke="#8fd0ff" stroke-width="${1.6 + i * 0.5}" fill="none" opacity="${0.5 - i * 0.06}">` +
          `<animate attributeName="d" dur="${5 + i}s" repeatCount="indefinite" ` +
          `values="M0,${y} Q125,${y - 8} 250,${y} T500,${y} T750,${y} T1000,${y};` +
          `M0,${y} Q125,${y + 8} 250,${y} T500,${y} T750,${y} T1000,${y};` +
          `M0,${y} Q125,${y - 8} 250,${y} T500,${y} T750,${y} T1000,${y}"/></path>`
        ).join('') +
        // 강화도 성곽 실루엣
        `<path d="M0,474 L0,404 L74,404 L74,382 L116,382 L116,404 L232,404 L232,376 L274,376 L274,404 L380,404 L380,474 Z" fill="#061520"/>` +
        ship(640, 528, 1.3, '#05141f') + ship(870, 588, 1.0, '#061a28') + ship(330, 566, 1.1, '#05161f')
      );

    case 'yuan':
      return (
        ridgeline([[0, 500], [200, 455], [400, 495], [600, 450], [800, 490], [1000, 460]], '#20222f', 1) +
        `<path d="M0,610 L1000,610 L1000,700 L0,700 Z" fill="#191b26"/>` +
        hall(500, 610, 280, 116, '#232535') +
        hall(200, 610, 130, 66, '#262838') +
        hall(800, 610, 130, 66, '#262838') +
        // 깃발(원의 영향 아래 낮게 드리운 개경)
        [140, 340, 660, 860].map((x, i) =>
          `<g transform="translate(${x},610)"><rect x="-2" y="-118" width="4" height="118" fill="#2d2f42"/>` +
          `<path d="M2,-114 Q34,-102 2,-88 Z" fill="#4b3a63" opacity="0.9">` +
          `<animate attributeName="d" dur="${3 + i * 0.6}s" repeatCount="indefinite" ` +
          `values="M2,-114 Q34,-102 2,-88 Z;M2,-114 Q28,-96 2,-88 Z;M2,-114 Q34,-102 2,-88 Z"/></path></g>`
        ).join('')
      );

    case 'port':
      return (
        ridgeline([[0, 440], [180, 398], [360, 436], [560, 388], [760, 434], [1000, 402]], '#5c3444', 1) +
        `<path d="M0,528 L1000,528 L1000,700 L0,700 Z" fill="#8a4d52"/>` +
        // 해면에 반사되는 아침 햇빛
        `<path d="M778,528 L880,700 L676,700 Z" fill="#ffca82" opacity="0.30"/>` +
        [560, 590, 622, 656].map((y, i) =>
          `<path d="M0,${y} Q140,${y - 7} 280,${y} T560,${y} T840,${y} T1120,${y}" ` +
          `stroke="#f0a86a" stroke-width="${1.4 + i * 0.5}" fill="none" opacity="${0.32 - i * 0.05}"/>`
        ).join('') +
        // 부두와 배들
        `<path d="M0,528 L0,486 L150,486 L150,528 Z" fill="#1f0e16"/>` +
        ship(190, 566, 1.45, '#241019') + ship(430, 606, 1.2, '#2a141d') +
        ship(640, 556, 1.0, '#25111a') + ship(880, 614, 1.3, '#241019') +
        // 창고 지붕
        hall(80, 528, 172, 84, '#1f0e16') + hall(950, 534, 150, 72, '#1f0e16')
      );

    case 'gate':
      return (
        `<g>` +
        `<ellipse cx="500" cy="380" rx="230" ry="230" fill="none" stroke="#7fc4ff" stroke-width="2" opacity="0.35">` +
        `<animate attributeName="rx" values="228;238;228" dur="6s" repeatCount="indefinite"/>` +
        `<animate attributeName="ry" values="228;238;228" dur="6s" repeatCount="indefinite"/></ellipse>` +
        `<ellipse cx="500" cy="380" rx="168" ry="168" fill="none" stroke="#a8dcff" stroke-width="1.4" opacity="0.5">` +
        `<animateTransform attributeName="transform" type="rotate" from="0 500 380" to="360 500 380" dur="42s" repeatCount="indefinite"/></ellipse>` +
        `<ellipse cx="500" cy="380" rx="112" ry="112" fill="#0d1b3c" opacity="0.85"/>` +
        `<ellipse cx="500" cy="380" rx="112" ry="112" fill="none" stroke="#bfe6ff" stroke-width="1" opacity="0.7" stroke-dasharray="6 10">` +
        `<animateTransform attributeName="transform" type="rotate" from="360 500 380" to="0 500 380" dur="26s" repeatCount="indefinite"/></ellipse>` +
        `</g>` +
        ridgeline([[0, 600], [200, 565], [420, 595], [640, 560], [860, 592], [1000, 570]], '#0a1026', 1)
      );

    default:
      return '';
  }
}

// ── 장면 SVG ───────────────────────────────────────────────────────────
export function sceneSVG(key) {
  const s = SCENES[key] || SCENES.gate;
  const id = 'sc' + key;
  const [gx, gy] = s.glowPos;
  return (
    `<svg class="scene-svg" viewBox="0 0 1000 700" preserveAspectRatio="xMidYMax slice" ` +
    `role="img" aria-label="장면 배경 그림" focusable="false">` +
    `<defs>` +
    `<linearGradient id="${id}sky" x1="0" y1="0" x2="0" y2="1">` +
    `<stop offset="0%" stop-color="${s.sky[0]}"/>` +
    `<stop offset="55%" stop-color="${s.sky[1]}"/>` +
    `<stop offset="100%" stop-color="${s.sky[2]}"/></linearGradient>` +
    `<radialGradient id="${id}glow" cx="${gx}" cy="${gy}" r="0.62">` +
    `<stop offset="0%" stop-color="${s.glow}" stop-opacity="0.72"/>` +
    `<stop offset="48%" stop-color="${s.glow}" stop-opacity="0.26"/>` +
    `<stop offset="100%" stop-color="${s.glow}" stop-opacity="0"/></radialGradient>` +
    `<linearGradient id="${id}vig" x1="0" y1="0" x2="0" y2="1">` +
    `<stop offset="0%" stop-color="#000" stop-opacity="0.30"/>` +
    `<stop offset="38%" stop-color="#000" stop-opacity="0"/>` +
    `<stop offset="100%" stop-color="#000" stop-opacity="0.50"/></linearGradient>` +
    `</defs>` +
    `<rect width="1000" height="700" fill="url(#${id}sky)"/>` +
    `<rect width="1000" height="700" fill="url(#${id}glow)"/>` +
    buildScene(s.build) +
    particles(s.particle, key.length * 31 + 5) +
    `<rect width="1000" height="700" fill="url(#${id}vig)"/>` +
    `</svg>`
  );
}

// ── 인물 초상 ──────────────────────────────────────────────────────────
// 관모(冠帽)·복두·승려의 민머리·투구 등 형태로 신분을 구분한다.
const PORTRAITS = {
  king:      { c1: '#7a2f2f', c2: '#efc35a', hat: 'crown',  robe: '#8d3838' },
  king2:     { c1: '#5a2b52', c2: '#e6b6ff', hat: 'crown',  robe: '#6d3563' },
  scholar:   { c1: '#26456b', c2: '#a7cdf5', hat: 'bokdu',  robe: '#2f527d' },
  scholar2:  { c1: '#1f5a56', c2: '#9fe0d6', hat: 'bokdu',  robe: '#276b66' },
  ssanggi:   { c1: '#4a3a76', c2: '#c6b4ff', hat: 'bokdu',  robe: '#57458a' },
  keeper:    { c1: '#4b4436', c2: '#d9cba6', hat: 'bokdu',  robe: '#5a5242' },
  official:  { c1: '#2f4a34', c2: '#b2dcb8', hat: 'bokdu',  robe: '#3a5a40' },
  noble:     { c1: '#6a4a1f', c2: '#f0d18a', hat: 'bokdu',  robe: '#7d5826' },
  seohui:    { c1: '#1f4f6b', c2: '#9fd6f0', hat: 'bokdu',  robe: '#276b8a' },
  general:   { c1: '#5a3a28', c2: '#e5b98a', hat: 'helmet', robe: '#6b4630' },
  general2:  { c1: '#3f4a2c', c2: '#cfe09a', hat: 'helmet', robe: '#4d5a36' },
  warrior:   { c1: '#4a2a2a', c2: '#e09a8a', hat: 'helmet', robe: '#5c3434' },
  warrior2:  { c1: '#33282e', c2: '#c9a2b0', hat: 'helmet', robe: '#41333a' },
  khitan:    { c1: '#3a3348', c2: '#b9a8d8', hat: 'fur',    robe: '#473e58' },
  monk:      { c1: '#6b4a20', c2: '#f2cf90', hat: 'bald',   robe: '#7d5827' },
  monk2:     { c1: '#5c4436', c2: '#e2c2a2', hat: 'bald',   robe: '#6d5141' },
  slave:     { c1: '#3b3b3b', c2: '#cfcfcf', hat: 'none',   robe: '#4a4a4a' },
  commoner:  { c1: '#46503f', c2: '#cdd7bd', hat: 'none',   robe: '#545f4c' },
  merchant:  { c1: '#6d4320', c2: '#ffd79a', hat: 'turban', robe: '#805028' },
  potter:    { c1: '#2c5350', c2: '#9fd8cf', hat: 'none',   robe: '#356360' },
  device:    { c1: '#123a5e', c2: '#8fd0ff', hat: 'orb',    robe: '#16496f' },
};

function hatPath(kind, c2) {
  switch (kind) {
    case 'crown': // 통천관 계열 — 고려는 건국 초부터 천자국 체제의 요소를 지녔다
      return `<path d="M28,34 L72,34 L74,22 L68,22 L66,12 L58,12 L56,22 L50,10 L44,22 L42,12 L34,12 L32,22 L26,22 Z" fill="${c2}"/>`;
    case 'bokdu': // 복두(관리의 관모)
      return `<path d="M26,36 Q50,14 74,36 L74,40 L26,40 Z" fill="${c2}"/><path d="M74,30 L88,26 L88,32 L74,36 Z" fill="${c2}"/><path d="M26,30 L12,26 L12,32 L26,36 Z" fill="${c2}"/>`;
    case 'helmet': // 투구
      return `<path d="M26,40 Q50,8 74,40 Z" fill="${c2}"/><rect x="47" y="2" width="6" height="12" fill="${c2}"/><path d="M22,40 L26,52 L30,40 Z M78,40 L74,52 L70,40 Z" fill="${c2}"/>`;
    case 'fur': // 거란의 털모자
      return `<ellipse cx="50" cy="32" rx="27" ry="15" fill="${c2}"/><ellipse cx="50" cy="24" rx="19" ry="10" fill="${c2}" opacity="0.7"/>`;
    case 'turban': // 아라비아 상인의 터번
      return `<path d="M24,40 Q50,10 76,40 Q50,30 24,40 Z" fill="${c2}"/><path d="M24,38 Q50,26 76,38 Q50,46 24,38 Z" fill="${c2}" opacity="0.75"/>`;
    case 'bald':
      return '';
    case 'orb':
      return `<circle cx="50" cy="26" r="10" fill="${c2}" opacity="0.85"><animate attributeName="r" values="9;11;9" dur="3s" repeatCount="indefinite"/></circle>`;
    default:
      return `<path d="M30,40 Q50,26 70,40 Z" fill="${c2}" opacity="0.6"/>`;
  }
}

export function portraitSVG(key) {
  const p = PORTRAITS[key] || PORTRAITS.commoner;
  const c2 = p.c2 && !/\s/.test(p.c2) ? p.c2 : '#e8e8e8';
  const id = 'pt' + key;
  return (
    `<svg viewBox="0 0 100 100" class="portrait-svg" role="img" aria-hidden="true" focusable="false">` +
    `<defs><radialGradient id="${id}bg" cx="0.5" cy="0.32" r="0.75">` +
    `<stop offset="0%" stop-color="${p.c1}"/><stop offset="100%" stop-color="#0b0f1c"/>` +
    `</radialGradient></defs>` +
    `<rect width="100" height="100" rx="14" fill="url(#${id}bg)"/>` +
    // 어깨/옷
    `<path d="M16,100 Q16,74 50,70 Q84,74 84,100 Z" fill="${p.robe}"/>` +
    `<path d="M50,70 L44,100 L56,100 Z" fill="${c2}" opacity="0.35"/>` +
    // 얼굴 실루엣
    `<ellipse cx="50" cy="52" rx="17" ry="20" fill="#e8d3bb" opacity="0.9"/>` +
    `<path d="M33,52 Q50,72 67,52 L67,58 Q50,78 33,58 Z" fill="#00000022"/>` +
    hatPath(p.hat, c2) +
    // 눈
    `<circle cx="43" cy="52" r="1.9" fill="#20161a"/><circle cx="57" cy="52" r="1.9" fill="#20161a"/>` +
    `</svg>`
  );
}

export const SCENE_KEYS = Object.keys(SCENES);
export const PORTRAIT_KEYS = Object.keys(PORTRAITS);
