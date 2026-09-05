/* =========================================================================
 * 독도네컷 — 독도 배경 씬 (3D · 애니메이션 · 스케치 3종 스타일)
 * 독도의 실제 지형을 고증: 왼쪽 서도(西島, 대한봉·가장 높음), 오른쪽 동도(東島,
 * 등대·선착장), 두 섬 사이 좁은 수로, 주변의 부속 바위(촛대바위 등).
 * viewBox 1080 x 620 기준.
 * ========================================================================= */

/* 공통: 섬 실루엣 경로 (서도=왼쪽 높음, 동도=오른쪽) */
const SEODO_PATH = 'M120 470 L150 300 L210 210 L270 175 L330 250 L360 340 L400 470 Z';
const DONGDO_PATH = 'M560 470 L590 330 L650 275 L720 250 L800 300 L860 360 L910 470 Z';
const ROCK1 = 'M470 470 L495 400 L515 440 L525 470 Z';   // 촛대바위 느낌
const ROCK2 = 'M935 470 L955 425 L975 470 Z';

function dokdoScene(style, layout) {
  if (layout === 'banner') return dokdoBanner(style);
  if (style === 'sketch') return sketchScene();
  if (style === 'anime') return animeScene();
  return threeDScene();
}

/* =========================================================================
 * 배너(가로 띠) 버전 — 네컷 하단에 독도가 크고 정확하게 보이도록.
 * 왼쪽은 인물 캐릭터 자리로 비우고, 중앙~오른쪽에 서도·동도를 크게 배치.
 * viewBox 1080 x 300.
 * ========================================================================= */
const B_SEODO = 'M330 262 L360 120 L430 66 L500 118 L540 200 L580 262 Z';   // 중앙 서도(높음)
const B_DONGDO = 'M620 262 L660 150 L740 100 L840 140 L900 200 L950 262 Z'; // 오른쪽 동도
const B_ROCK = 'M980 262 L1000 210 L1020 262 Z';

function dokdoBanner(style) {
  if (style === 'sketch') {
    return `
<svg viewBox="0 0 1080 300" xmlns="http://www.w3.org/2000/svg">
  <rect width="1080" height="300" fill="#fbfaf5"/>
  <g stroke="#3a3a3a" fill="none" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">
    <path d="M0 250 L1080 246"/>
    <g stroke-width="1.5" opacity="0.6">
      <path d="M120 275 q26 -9 52 0 t52 0"/><path d="M700 278 q26 -9 52 0 t52 0"/><path d="M900 270 q26 -9 52 0 t52 0"/>
    </g>
    <path d="${B_SEODO}" fill="#f0ede2"/>
    <g stroke-width="1.4" opacity="0.55"><path d="M380 150 L420 240"/><path d="M440 120 L480 250"/><path d="M510 160 L540 250"/></g>
    <path d="${B_DONGDO}" fill="#f0ede2"/>
    <g stroke-width="1.4" opacity="0.55"><path d="M690 190 L730 250"/><path d="M760 140 L800 250"/><path d="M850 190 L890 250"/></g>
    <path d="${B_ROCK}" fill="#f0ede2"/>
    <rect x="820" y="118" width="14" height="30" rx="2" fill="#fff"/><path d="M820 128 L834 128"/><circle cx="827" cy="112" r="4" fill="#fff"/>
    <path d="M429 66 L429 30"/><rect x="431" y="30" width="30" height="20" fill="#fff"/><circle cx="446" cy="40" r="6"/>
    <circle cx="120" cy="80" r="34" fill="none"/>
    <path d="M300 70 q11 -8 22 0 q11 -8 22 0"/>
  </g>
</svg>`;
  }
  if (style === 'anime') {
    return `
<svg viewBox="0 0 1080 300" xmlns="http://www.w3.org/2000/svg">
  <defs><linearGradient id="bskyA" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#8ecbff"/><stop offset="100%" stop-color="#dcf1ff"/></linearGradient></defs>
  <rect width="1080" height="250" fill="url(#bskyA)"/>
  <circle cx="150" cy="80" r="46" fill="#fff2b0"/><circle cx="150" cy="80" r="60" fill="#fff2b0" opacity="0.35"/>
  <g fill="#fff"><ellipse cx="640" cy="66" rx="70" ry="24"/><ellipse cx="700" cy="76" rx="54" ry="20"/></g>
  <rect y="230" width="1080" height="70" fill="#3aa0d6"/><rect y="230" width="1080" height="20" fill="#54b4e6"/>
  <path d="${B_SEODO}" fill="#7d8a5a" stroke="#3f4a2a" stroke-width="6" stroke-linejoin="round"/>
  <path d="M360 120 L430 66 L500 118 L470 200 L400 200 Z" fill="#93a06a"/>
  <path d="${B_DONGDO}" fill="#8a9464" stroke="#3f4a2a" stroke-width="6" stroke-linejoin="round"/>
  <path d="M660 150 L740 100 L840 140 L800 210 L700 210 Z" fill="#9daa72"/>
  <path d="${B_ROCK}" fill="#7d8a5a" stroke="#3f4a2a" stroke-width="5" stroke-linejoin="round"/>
  <rect x="818" y="116" width="18" height="34" rx="3" fill="#fff" stroke="#3f4a2a" stroke-width="3"/><rect x="818" y="127" width="18" height="9" fill="#cd2e3a"/><circle cx="827" cy="108" r="6" fill="#ffd83a" stroke="#3f4a2a" stroke-width="2"/>
  <rect x="427" y="30" width="4" height="38" fill="#5a3f2a"/><rect x="431" y="30" width="34" height="22" fill="#fff" stroke="#3f4a2a" stroke-width="2"/>
  <circle cx="448" cy="41" r="7" fill="#cd2e3a"/><path d="M448 34 a7 7 0 0 1 0 14 a3.5 3.5 0 0 1 0 -7 a3.5 3.5 0 0 0 0 -7" fill="#0047a0"/>
  <path d="M300 70 q12 -9 24 0 q12 -9 24 0" stroke="#3f4a2a" stroke-width="4" fill="none"/>
</svg>`;
  }
  return `
<svg viewBox="0 0 1080 300" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bsky" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#bfe3ff"/><stop offset="100%" stop-color="#eef8ff"/></linearGradient>
    <linearGradient id="bsea" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#2f7fb5"/><stop offset="100%" stop-color="#1b5c8a"/></linearGradient>
    <linearGradient id="brockL" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#8a7f6b"/><stop offset="60%" stop-color="#6f6552"/><stop offset="100%" stop-color="#514a3b"/></linearGradient>
    <linearGradient id="brockR" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#93876f"/><stop offset="60%" stop-color="#736853"/><stop offset="100%" stop-color="#544c3c"/></linearGradient>
    <radialGradient id="bsun" cx="50%" cy="50%" r="50%"><stop offset="0%" stop-color="#fff7d6"/><stop offset="100%" stop-color="#ffe9a8" stop-opacity="0"/></radialGradient>
  </defs>
  <rect width="1080" height="250" fill="url(#bsky)"/>
  <circle cx="150" cy="70" r="90" fill="url(#bsun)"/><circle cx="150" cy="70" r="38" fill="#fff3c4"/>
  <ellipse cx="660" cy="66" rx="70" ry="20" fill="#fff" opacity="0.85"/><ellipse cx="710" cy="74" rx="52" ry="16" fill="#fff" opacity="0.8"/>
  <rect y="222" width="1080" height="78" fill="url(#bsea)"/>
  <g opacity="0.5" stroke="#bfe6ff" stroke-width="3" fill="none">
    <path d="M0 258 Q70 250 140 258 T280 258 T420 258 T560 258 T700 258 T840 258 T980 258 T1120 258"/>
    <path d="M0 282 Q80 274 160 282 T320 282 T480 282 T640 282 T800 282 T960 282 T1120 282"/>
  </g>
  <path d="${B_SEODO}" fill="url(#brockL)"/>
  <path d="M430 66 L500 118 L470 262 L400 262 Z" fill="#000" opacity="0.12"/>
  <path d="M360 120 L430 66 L410 200 L350 200 Z" fill="#fff" opacity="0.10"/>
  <path d="${B_DONGDO}" fill="url(#brockR)"/>
  <path d="M740 100 L840 140 L810 262 L720 262 Z" fill="#000" opacity="0.12"/>
  <path d="M660 150 L740 100 L710 230 L660 220 Z" fill="#fff" opacity="0.10"/>
  <path d="${B_ROCK}" fill="url(#brockR)"/>
  <rect x="818" y="112" width="16" height="36" rx="3" fill="#f6f6f6"/><rect x="818" y="123" width="16" height="9" fill="#cd2e3a"/><rect x="816" y="105" width="20" height="9" rx="2" fill="#e6e6e6"/><circle cx="826" cy="102" r="4" fill="#ffe680"/>
  <rect x="427" y="30" width="3" height="40" fill="#7a5a3a"/><rect x="430" y="30" width="30" height="20" fill="#fff" stroke="#ccc" stroke-width="0.5"/>
  <circle cx="445" cy="40" r="6" fill="#cd2e3a"/><path d="M445 34 a6 6 0 0 1 0 12 a3 3 0 0 1 0 -6 a3 3 0 0 0 0 -6" fill="#0047a0"/>
  <path d="M290 66 q10 -8 20 0 q10 -8 20 0" stroke="#4a4a4a" stroke-width="3" fill="none"/>
  <path d="M980 54 q8 -6 16 0 q8 -6 16 0" stroke="#4a4a4a" stroke-width="2.5" fill="none"/>
</svg>`;
}

/* ---------------- 3D / 사실적 음영 ---------------- */
function threeDScene() {
  return `
<svg viewBox="0 0 1080 620" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="sky3d" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#bfe3ff"/><stop offset="60%" stop-color="#e8f6ff"/><stop offset="100%" stop-color="#f4fbff"/>
    </linearGradient>
    <linearGradient id="sea3d" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#2f7fb5"/><stop offset="100%" stop-color="#1b5c8a"/>
    </linearGradient>
    <linearGradient id="rockL" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#8a7f6b"/><stop offset="55%" stop-color="#6f6552"/><stop offset="100%" stop-color="#514a3b"/>
    </linearGradient>
    <linearGradient id="rockR" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#93876f"/><stop offset="60%" stop-color="#736853"/><stop offset="100%" stop-color="#544c3c"/>
    </linearGradient>
    <radialGradient id="sun3d" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#fff7d6"/><stop offset="100%" stop-color="#ffe9a8" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect width="1080" height="470" fill="url(#sky3d)"/>
  <circle cx="880" cy="120" r="120" fill="url(#sun3d)"/>
  <circle cx="880" cy="120" r="46" fill="#fff3c4"/>
  <ellipse cx="300" cy="120" rx="90" ry="26" fill="#fff" opacity="0.85"/>
  <ellipse cx="360" cy="130" rx="70" ry="22" fill="#fff" opacity="0.8"/>
  <rect y="440" width="1080" height="180" fill="url(#sea3d)"/>
  <g opacity="0.5" stroke="#bfe6ff" stroke-width="3" fill="none">
    <path d="M0 500 Q80 490 160 500 T320 500 T480 500 T640 500 T800 500 T960 500 T1120 500"/>
    <path d="M0 545 Q90 535 180 545 T360 545 T540 545 T720 545 T900 545 T1080 545"/>
  </g>
  <!-- 서도 -->
  <path d="${SEODO_PATH}" fill="url(#rockL)"/>
  <path d="M270 175 L330 250 L300 470 L210 210 Z" fill="#000" opacity="0.12"/>
  <path d="M210 210 L270 175 L250 300 L190 320 Z" fill="#fff" opacity="0.10"/>
  <!-- 동도 -->
  <path d="${DONGDO_PATH}" fill="url(#rockR)"/>
  <path d="M720 250 L800 300 L780 470 L700 470 Z" fill="#000" opacity="0.12"/>
  <path d="M650 275 L720 250 L690 380 L640 360 Z" fill="#fff" opacity="0.10"/>
  <!-- 부속 바위 -->
  <path d="${ROCK1}" fill="url(#rockL)"/>
  <path d="${ROCK2}" fill="url(#rockR)"/>
  <!-- 등대 (동도) -->
  <rect x="742" y="228" width="16" height="34" rx="3" fill="#f6f6f6"/>
  <rect x="742" y="238" width="16" height="8" fill="#cd2e3a"/>
  <rect x="740" y="222" width="20" height="8" rx="2" fill="#e6e6e6"/>
  <circle cx="750" cy="220" r="4" fill="#ffe680"/>
  <!-- 태극기 (서도 정상) -->
  <rect x="268" y="150" width="3" height="34" fill="#7a5a3a"/>
  <rect x="271" y="150" width="30" height="20" fill="#fff" stroke="#ccc" stroke-width="0.5"/>
  <circle cx="286" cy="160" r="6" fill="#cd2e3a"/>
  <path d="M286 154 a6 6 0 0 1 0 12 a3 3 0 0 1 0 -6 a3 3 0 0 0 0 -6" fill="#0047a0"/>
  <!-- 갈매기 -->
  <path d="M470 90 q10 -8 20 0 q10 -8 20 0" stroke="#4a4a4a" stroke-width="3" fill="none"/>
  <path d="M540 70 q8 -6 16 0 q8 -6 16 0" stroke="#4a4a4a" stroke-width="2.5" fill="none"/>
</svg>`;
}

/* ---------------- 애니메이션 / 셀 스타일(플랫) ---------------- */
function animeScene() {
  return `
<svg viewBox="0 0 1080 620" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="skyA" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#8ecbff"/><stop offset="100%" stop-color="#d8f0ff"/>
    </linearGradient>
  </defs>
  <rect width="1080" height="470" fill="url(#skyA)"/>
  <circle cx="870" cy="115" r="52" fill="#fff2b0"/>
  <circle cx="870" cy="115" r="66" fill="#fff2b0" opacity="0.35"/>
  <g fill="#ffffff">
    <ellipse cx="300" cy="115" rx="78" ry="30"/>
    <ellipse cx="360" cy="125" rx="60" ry="24"/>
    <ellipse cx="250" cy="128" rx="50" ry="20"/>
  </g>
  <rect y="440" width="1080" height="180" fill="#3aa0d6"/>
  <rect y="440" width="1080" height="40" fill="#54b4e6"/>
  <g stroke="#eaf7ff" stroke-width="5" fill="none" stroke-linecap="round" opacity="0.9">
    <path d="M40 520 q40 -14 80 0"/><path d="M260 545 q40 -14 80 0"/>
    <path d="M520 515 q40 -14 80 0"/><path d="M820 548 q40 -14 80 0"/>
  </g>
  <!-- 섬: 플랫 + 굵은 외곽선 -->
  <path d="${SEODO_PATH}" fill="#7d8a5a" stroke="#3f4a2a" stroke-width="6" stroke-linejoin="round"/>
  <path d="M150 300 L210 210 L270 175 L250 300 Z" fill="#93a06a"/>
  <path d="${DONGDO_PATH}" fill="#8a9464" stroke="#3f4a2a" stroke-width="6" stroke-linejoin="round"/>
  <path d="M590 330 L650 275 L720 250 L700 360 Z" fill="#9daa72"/>
  <path d="${ROCK1}" fill="#7d8a5a" stroke="#3f4a2a" stroke-width="5" stroke-linejoin="round"/>
  <path d="${ROCK2}" fill="#8a9464" stroke="#3f4a2a" stroke-width="5" stroke-linejoin="round"/>
  <!-- 등대 -->
  <rect x="742" y="226" width="18" height="36" rx="3" fill="#fff" stroke="#3f4a2a" stroke-width="3"/>
  <rect x="742" y="238" width="18" height="9" fill="#cd2e3a"/>
  <circle cx="751" cy="218" r="6" fill="#ffd83a" stroke="#3f4a2a" stroke-width="2"/>
  <!-- 태극기 -->
  <rect x="268" y="148" width="4" height="36" fill="#5a3f2a"/>
  <rect x="272" y="148" width="32" height="21" fill="#fff" stroke="#3f4a2a" stroke-width="2"/>
  <circle cx="288" cy="158.5" r="6.5" fill="#cd2e3a"/>
  <path d="M288 152 a6.5 6.5 0 0 1 0 13 a3.25 3.25 0 0 1 0 -6.5 a3.25 3.25 0 0 0 0 -6.5" fill="#0047a0"/>
  <path d="M470 95 q12 -9 24 0 q12 -9 24 0" stroke="#3f4a2a" stroke-width="4" fill="none"/>
</svg>`;
}

/* ---------------- 스케치 / 손그림 라인아트 ---------------- */
function sketchScene() {
  return `
<svg viewBox="0 0 1080 620" xmlns="http://www.w3.org/2000/svg">
  <rect width="1080" height="620" fill="#fbfaf5"/>
  <g stroke="#3a3a3a" fill="none" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">
    <!-- 수평선 -->
    <path d="M0 452 L1080 448"/>
    <!-- 물결 해칭 -->
    <g stroke-width="1.6" opacity="0.7">
      <path d="M60 500 q30 -10 60 0 t60 0"/><path d="M300 520 q30 -10 60 0 t60 0"/>
      <path d="M560 505 q30 -10 60 0 t60 0"/><path d="M820 522 q30 -10 60 0 t60 0"/>
      <path d="M120 560 q30 -10 60 0 t60 0"/><path d="M640 560 q30 -10 60 0 t60 0"/>
    </g>
    <!-- 서도 -->
    <path d="${SEODO_PATH}" fill="#f0ede2"/>
    <g stroke-width="1.5" opacity="0.6">
      <path d="M210 250 L250 360"/><path d="M250 230 L290 380"/><path d="M300 260 L330 400"/>
    </g>
    <!-- 동도 -->
    <path d="${DONGDO_PATH}" fill="#f0ede2"/>
    <g stroke-width="1.5" opacity="0.6">
      <path d="M660 300 L700 420"/><path d="M720 285 L760 430"/><path d="M800 320 L840 440"/>
    </g>
    <path d="${ROCK1}" fill="#f0ede2"/>
    <path d="${ROCK2}" fill="#f0ede2"/>
    <!-- 등대 -->
    <rect x="742" y="228" width="16" height="34" rx="2" fill="#fff"/>
    <path d="M742 240 L758 240"/><circle cx="750" cy="221" r="4" fill="#fff"/>
    <!-- 태극기 (라인) -->
    <path d="M269 150 L269 184"/>
    <rect x="271" y="150" width="30" height="20" fill="#fff"/>
    <circle cx="286" cy="160" r="6" fill="none"/>
    <!-- 해 -->
    <circle cx="875" cy="120" r="40" fill="none"/>
    <g stroke-width="1.8"><path d="M875 60 L875 44"/><path d="M935 120 L955 120"/><path d="M918 78 L932 64"/></g>
    <!-- 갈매기 -->
    <path d="M470 100 q12 -9 24 0 q12 -9 24 0"/>
    <path d="M545 82 q9 -7 18 0 q9 -7 18 0"/>
  </g>
</svg>`;
}
