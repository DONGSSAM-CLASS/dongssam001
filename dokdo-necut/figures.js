/* =========================================================================
 * 독도네컷 — 역사 인물 클레이 캐릭터 SVG 데이터
 * 각 인물은 역사적 고증(활동 시기 · 복식)에 기반한 교육용 스타일라이즈드
 * 클레이(점토) 일러스트입니다. 실존 초상이 남아있지 않은 인물이 많아
 * '고증된 복식 + 상징물'로 인물을 구분합니다.
 * ========================================================================= */

/* 클레이 질감을 위한 공통 SVG 필터 (부드러운 볼륨 + 미세한 표면 요철) */
const CLAY_DEFS = `
  <defs>
    <filter id="clayBump" x="-20%" y="-20%" width="140%" height="140%">
      <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed="7" result="noise"/>
      <feDiffuseLighting in="noise" lighting-color="#ffffff" surfaceScale="1.1" result="light">
        <feDistantLight azimuth="235" elevation="60"/>
      </feDiffuseLighting>
      <feComposite in="light" in2="SourceGraphic" operator="arithmetic" k1="1" k2="0" k3="0" k4="0" result="lit"/>
      <feBlend in="SourceGraphic" in2="lit" mode="multiply"/>
    </filter>
    <filter id="softShadow" x="-40%" y="-40%" width="180%" height="180%">
      <feDropShadow dx="0" dy="7" stdDeviation="7" flood-color="#000000" flood-opacity="0.28"/>
    </filter>
  </defs>`;

/* 헬퍼: 얼굴(살구빛 클레이) */
function clayFace(cx, cy, r, skin = '#e8b48c', shade = '#cf9068') {
  return `
    <defs>
      <radialGradient id="fg${cx}${cy}" cx="38%" cy="34%" r="75%">
        <stop offset="0%" stop-color="#ffe0c4"/>
        <stop offset="55%" stop-color="${skin}"/>
        <stop offset="100%" stop-color="${shade}"/>
      </radialGradient>
    </defs>
    <ellipse cx="${cx}" cy="${cy}" rx="${r}" ry="${r * 1.06}" fill="url(#fg${cx}${cy})"/>
    <ellipse cx="${cx - r * 0.42}" cy="${cy + r * 0.15}" rx="${r * 0.22}" ry="${r * 0.15}" fill="#f4a3a0" opacity="0.55"/>
    <ellipse cx="${cx + r * 0.42}" cy="${cy + r * 0.15}" rx="${r * 0.22}" ry="${r * 0.15}" fill="#f4a3a0" opacity="0.55"/>
    <circle cx="${cx - r * 0.33}" cy="${cy - r * 0.05}" r="${r * 0.1}" fill="#2b2b2b"/>
    <circle cx="${cx + r * 0.33}" cy="${cy - r * 0.05}" r="${r * 0.1}" fill="#2b2b2b"/>
    <circle cx="${cx - r * 0.30}" cy="${cy - r * 0.09}" r="${r * 0.035}" fill="#fff"/>
    <circle cx="${cx + r * 0.36}" cy="${cy - r * 0.09}" r="${r * 0.035}" fill="#fff"/>
    <path d="M ${cx - r * 0.22} ${cy + r * 0.42} Q ${cx} ${cy + r * 0.6} ${cx + r * 0.22} ${cy + r * 0.42}"
          fill="none" stroke="#7a4a33" stroke-width="${r * 0.07}" stroke-linecap="round"/>`;
}

/* =========================================================================
 * 인물 정의
 * ========================================================================= */
const FIGURES = [
  {
    id: 'isabu',
    name: '이사부',
    role: '신라 하슬라주 군주',
    era: '6세기 · 신라 지증왕',
    emoji: '⚔️',
    accent: '#b5852f',
    fact: '512년(지증왕 13년) 하슬라주 군주로서 나무 사자상을 앞세워 우산국(울릉도·독도)을 신라에 복속시켰습니다.',
    costume: '신라 무장의 찰갑(비늘 갑옷)과 투구, 붉은 술 장식을 고증해 표현했습니다.',
    // 갑옷 무장 클레이 캐릭터
    svg: (s = 1) => `
<svg viewBox="0 0 220 300" xmlns="http://www.w3.org/2000/svg">
  ${CLAY_DEFS}
  <ellipse cx="110" cy="288" rx="78" ry="12" fill="#000" opacity="0.18"/>
  <g filter="url(#softShadow)">
    <!-- 창 -->
    <rect x="176" y="40" width="7" height="220" rx="3" fill="#8a5a2b"/>
    <path d="M179 24 L189 46 L169 46 Z" fill="#c9ced6"/>
    <!-- 몸통: 찰갑 -->
    <path d="M58 300 L58 168 Q110 150 162 168 L162 300 Z" fill="#6b7d54"/>
    <g fill="#556545">
      <rect x="66" y="176" width="88" height="13" rx="4"/>
      <rect x="66" y="196" width="88" height="13" rx="4"/>
      <rect x="66" y="216" width="88" height="13" rx="4"/>
      <rect x="66" y="236" width="88" height="13" rx="4"/>
      <rect x="66" y="256" width="88" height="13" rx="4"/>
    </g>
    <!-- 어깨 갑옷 -->
    <ellipse cx="60" cy="176" rx="24" ry="18" fill="#b5852f"/>
    <ellipse cx="160" cy="176" rx="24" ry="18" fill="#b5852f"/>
    <!-- 목/가슴 -->
    <rect x="94" y="150" width="32" height="30" fill="#e8b48c"/>
    <!-- 얼굴 -->
    ${clayFace(110, 110, 46)}
    <!-- 콧수염 -->
    <path d="M88 128 Q110 138 132 128" stroke="#3a2a20" stroke-width="6" fill="none" stroke-linecap="round"/>
    <!-- 투구 -->
    <path d="M60 96 Q110 30 160 96 Q160 74 110 62 Q60 74 60 96 Z" fill="#8a6a35"/>
    <path d="M62 92 Q110 44 158 92 L150 100 Q110 66 70 100 Z" fill="#b5852f"/>
    <rect x="104" y="30" width="12" height="20" rx="4" fill="#7a4a1f"/>
    <path d="M110 12 Q126 24 118 46 Q110 34 102 46 Q94 24 110 12 Z" fill="#c0392b"/>
    <path d="M110 14 Q100 30 110 46" stroke="#e74c3c" stroke-width="4" fill="none"/>
  </g>
</svg>`
  },
  {
    id: 'anyongbok',
    name: '안용복',
    role: '조선 숙종 시기 어부',
    era: '17세기 말 · 조선 숙종',
    emoji: '🎣',
    accent: '#2e79b0',
    fact: '1693·1696년 두 차례 일본으로 건너가 울릉도·독도가 조선 땅임을 강력히 주장한 동래 출신 어부입니다.',
    costume: '조선 후기 서민(어부)의 흰 저고리·바지, 상투와 패랭이(대나무 삿갓)를 고증했습니다.',
    svg: (s = 1) => `
<svg viewBox="0 0 220 300" xmlns="http://www.w3.org/2000/svg">
  ${CLAY_DEFS}
  <ellipse cx="110" cy="288" rx="76" ry="12" fill="#000" opacity="0.18"/>
  <g filter="url(#softShadow)">
    <!-- 노(oar) -->
    <rect x="30" y="60" width="6" height="210" rx="3" fill="#8a5a2b" transform="rotate(-8 33 165)"/>
    <ellipse cx="24" cy="58" rx="12" ry="22" fill="#a06a35" transform="rotate(-8 24 58)"/>
    <!-- 흰 저고리 몸통 -->
    <path d="M60 300 L58 176 Q110 158 162 176 L160 300 Z" fill="#f3f0e7"/>
    <path d="M60 300 L58 176 Q84 168 110 168 L110 300 Z" fill="#e9e5d8"/>
    <!-- 옷고름/동정 -->
    <path d="M110 168 L92 200 L110 210 L128 200 Z" fill="#fff"/>
    <path d="M110 172 L110 300" stroke="#cfc8b4" stroke-width="3"/>
    <!-- 파란 허리띠 -->
    <rect x="58" y="236" width="104" height="14" rx="6" fill="#2e79b0"/>
    <!-- 목 -->
    <rect x="96" y="150" width="28" height="28" fill="#d99a6a"/>
    <!-- 얼굴 (햇볕에 그을린 어부) -->
    ${clayFace(110, 112, 45, '#d99a6a', '#b87a4c')}
    <!-- 상투 -->
    <ellipse cx="110" cy="70" rx="10" ry="12" fill="#2b2b2b"/>
    <rect x="106" y="60" width="8" height="14" rx="3" fill="#1f1f1f"/>
    <!-- 머리카락 옆선 -->
    <path d="M66 104 Q64 74 110 66 Q156 74 154 104 Q150 84 110 80 Q70 84 66 104 Z" fill="#2b2b2b"/>
    <!-- 패랭이(삿갓) 살짝 뒤로 -->
    <path d="M52 92 Q110 44 168 92 Q110 74 52 92 Z" fill="#c9a45e" opacity="0.9"/>
    <ellipse cx="110" cy="90" rx="58" ry="10" fill="#b8934c" opacity="0.5"/>
  </g>
</svg>`
  },
  {
    id: 'simheungtaek',
    name: '심흥택',
    role: '대한제국기 울도군수',
    era: '1906년 · 대한제국',
    emoji: '📜',
    accent: '#3a4a8c',
    fact: '1906년 일본의 독도 편입 통보를 받고 "본군 소속 독도(本郡所屬獨島)"라 기록해 조선의 영토주권을 즉시 보고했습니다.',
    costume: '대한제국 문관의 흑단령(관복)과 사모, 가슴의 흉배를 고증했습니다.',
    svg: (s = 1) => `
<svg viewBox="0 0 220 300" xmlns="http://www.w3.org/2000/svg">
  ${CLAY_DEFS}
  <ellipse cx="110" cy="288" rx="80" ry="12" fill="#000" opacity="0.18"/>
  <g filter="url(#softShadow)">
    <!-- 관복(흑단령) 몸통 -->
    <path d="M50 300 L54 180 Q110 156 166 180 L170 300 Z" fill="#2a2f45"/>
    <path d="M50 300 L54 180 Q82 168 110 166 L110 300 Z" fill="#232840"/>
    <!-- 붉은 단령 안감/깃 -->
    <path d="M110 166 L88 196 L110 206 L132 196 Z" fill="#8c2b2b"/>
    <!-- 흉배(가슴 관대 문양) -->
    <rect x="90" y="210" width="40" height="40" rx="5" fill="#c9a94a"/>
    <path d="M110 216 Q122 230 110 244 Q98 230 110 216 Z" fill="#3a4a8c"/>
    <!-- 각대(허리) -->
    <rect x="52" y="252" width="116" height="12" rx="4" fill="#6b4a2a"/>
    <!-- 소매 -->
    <ellipse cx="52" cy="210" rx="20" ry="30" fill="#2a2f45"/>
    <ellipse cx="168" cy="210" rx="20" ry="30" fill="#2a2f45"/>
    <!-- 목 -->
    <rect x="96" y="150" width="28" height="26" fill="#e8b48c"/>
    <!-- 얼굴 -->
    ${clayFace(110, 112, 44)}
    <!-- 수염 -->
    <path d="M92 132 Q110 142 128 132" stroke="#3a2a20" stroke-width="5" fill="none" stroke-linecap="round"/>
    <path d="M104 138 Q110 158 116 138" stroke="#3a2a20" stroke-width="6" fill="none" stroke-linecap="round"/>
    <!-- 사모(관모) -->
    <path d="M70 90 Q110 60 150 90 L150 78 Q110 54 70 78 Z" fill="#1a1a22"/>
    <rect x="74" y="66" width="72" height="26" rx="10" fill="#26262f"/>
    <path d="M78 60 Q110 46 142 60 L142 72 Q110 60 78 72 Z" fill="#1a1a22"/>
    <!-- 사모 뿔(양각) -->
    <ellipse cx="58" cy="78" rx="16" ry="7" fill="#1a1a22"/>
    <ellipse cx="162" cy="78" rx="16" ry="7" fill="#1a1a22"/>
  </g>
</svg>`
  },
  {
    id: 'hongsunchil',
    name: '홍순칠',
    role: '독도의용수비대장',
    era: '1953년 · 대한민국',
    emoji: '🇰🇷',
    accent: '#3f6b3a',
    fact: '한국전쟁 참전 후 1953년 독도의용수비대를 결성해 독도를 지킨 초대 대장입니다.',
    costume: '1950년대 예비역의 야전 전투복·전투모와 태극 완장, M1 소총을 고증했습니다.',
    svg: (s = 1) => `
<svg viewBox="0 0 220 300" xmlns="http://www.w3.org/2000/svg">
  ${CLAY_DEFS}
  <ellipse cx="110" cy="288" rx="78" ry="12" fill="#000" opacity="0.18"/>
  <g filter="url(#softShadow)">
    <!-- 소총(M1) 어깨에 -->
    <rect x="150" y="40" width="7" height="230" rx="3" fill="#4a3524" transform="rotate(6 153 155)"/>
    <rect x="150" y="230" width="16" height="40" rx="4" fill="#3a281a" transform="rotate(6 158 250)"/>
    <!-- 야전 전투복 몸통 -->
    <path d="M56 300 L58 176 Q110 158 162 176 L164 300 Z" fill="#5c6b3d"/>
    <path d="M56 300 L58 176 Q84 168 110 168 L110 300 Z" fill="#4e5c33"/>
    <!-- 가슴 주머니 -->
    <rect x="72" y="196" width="28" height="24" rx="3" fill="#4a5730"/>
    <rect x="120" y="196" width="28" height="24" rx="3" fill="#4a5730"/>
    <!-- 태극 완장 -->
    <rect x="52" y="184" width="26" height="20" rx="3" fill="#f4f0e6"/>
    <circle cx="65" cy="194" r="7" fill="#cd2e3a"/>
    <path d="M65 187 a7 7 0 0 1 0 14 a3.5 3.5 0 0 1 0 -7 a3.5 3.5 0 0 0 0 -7" fill="#0047a0"/>
    <!-- 목 -->
    <rect x="96" y="150" width="28" height="28" fill="#d9a06a"/>
    <!-- 얼굴 -->
    ${clayFace(110, 112, 45, '#dca877', '#b9855a')}
    <!-- 전투모 -->
    <path d="M62 96 Q110 58 158 96 Q158 80 110 74 Q62 80 62 96 Z" fill="#4e5c33"/>
    <path d="M60 96 Q110 92 160 96 L160 104 Q110 100 60 104 Z" fill="#3f4a2a"/>
    <!-- 모자 챙 -->
    <path d="M60 100 Q110 96 160 100 L164 108 Q110 104 56 108 Z" fill="#33401f"/>
    <!-- 모표(별) -->
    <path d="M110 78 l3 6 6 1 -4.5 4.5 1 6 -5.5 -3 -5.5 3 1 -6 -4.5 -4.5 6 -1 Z" fill="#f2c94c"/>
  </g>
</svg>`
  }
];
