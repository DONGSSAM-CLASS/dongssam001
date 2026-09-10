import type { ReactElement } from 'react';
import type { SceneKey } from '../types';

/**
 * 시대·장소를 상징하는 시네마틱 SVG 배경.
 * 실제 사진 대신 저작권·개인정보 걱정 없는 벡터 일러스트로, 블록버스터 느낌의
 * 조명·안개·실루엣을 넣어 몰입감을 높인다. (요구사항 8: SVG/CSS 시네마틱)
 */
export function CinematicScene({ scene, className }: { scene: SceneKey; className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 1200 675"
      preserveAspectRatio="xMidYMid slice"
      role="img"
      aria-label={SCENE_LABEL[scene]}
      xmlns="http://www.w3.org/2000/svg"
    >
      {SCENES[scene]}
    </svg>
  );
}

const SCENE_LABEL: Record<SceneKey, string> = {
  'chongqing-night': '안개에 잠긴 밤의 충칭과 양쯔강',
  ceremony: '태극기가 걸린 한국광복군 창설식장',
  recruit: '광복군 대원 모집 벽보가 붙은 거리',
  declaration: '대일 선전 성명서를 작성하는 임시정부의 책상',
  burma: '버마 전선의 밤, 확성기로 방송하는 공작대',
  'oss-xian': '시안 훈련장에서 낙하·잠입을 훈련하는 대원들',
  'liberation-dawn': '광복의 새벽, 떠오르는 해와 태극기',
};

/** 공통: 하늘 그라디언트 + 은은한 그레인 */
function Sky({ from, to }: { from: string; to: string }) {
  return (
    <>
      <defs>
        <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={from} />
          <stop offset="100%" stopColor={to} />
        </linearGradient>
      </defs>
      <rect width="1200" height="675" fill="url(#sky)" />
    </>
  );
}

const SCENES: Record<SceneKey, ReactElement> = {
  // 안개의 도시 충칭 — 밤, 양쯔강, 산 위 불빛
  'chongqing-night': (
    <g>
      <Sky from="#1a2436" to="#0c0f16" />
      <circle cx="930" cy="130" r="60" fill="#cdb57a" opacity="0.35" />
      <circle cx="930" cy="130" r="34" fill="#e8d7a3" opacity="0.55" />
      {/* 원경 산 */}
      <path d="M0 380 L180 300 L360 360 L560 280 L780 350 L1000 290 L1200 360 L1200 675 L0 675 Z" fill="#141b28" />
      {/* 중경 언덕 위 건물 실루엣 */}
      <g fill="#0e131d">
        <path d="M0 430 L1200 430 L1200 675 L0 675 Z" />
      </g>
      <g fill="#0a0d14">
        {[80, 150, 210, 300, 360, 470, 560, 660, 760, 870, 980, 1080].map((x, i) => (
          <rect key={i} x={x} y={430 - ((i * 37) % 90) - 40} width={28 + (i % 3) * 10} height={((i * 37) % 90) + 130} />
        ))}
      </g>
      {/* 창문 불빛 */}
      <g fill="#d9b25a" opacity="0.8">
        {Array.from({ length: 40 }).map((_, i) => (
          <rect key={i} x={70 + ((i * 71) % 1080)} y={360 + ((i * 53) % 120)} width="4" height="6" opacity={0.3 + ((i * 7) % 6) / 10} />
        ))}
      </g>
      {/* 강물 반사 */}
      <rect x="0" y="560" width="1200" height="115" fill="#0b111c" />
      <g stroke="#3b4a63" strokeWidth="2" opacity="0.4">
        {[575, 595, 615, 640].map((y, i) => <line key={i} x1="0" y1={y} x2="1200" y2={y} />)}
      </g>
      {/* 안개 */}
      <g fill="#c9d3e0" opacity="0.06">
        <ellipse cx="300" cy="470" rx="420" ry="70" />
        <ellipse cx="900" cy="500" rx="480" ry="80" />
      </g>
    </g>
  ),

  // 창설식장 — 태극기, 홀
  ceremony: (
    <g>
      <Sky from="#26160f" to="#0d0805" />
      {/* 홀 벽·기둥 */}
      <rect x="0" y="0" width="1200" height="675" fill="#1c140c" />
      <g fill="#241a0f">
        {[120, 380, 820, 1080].map((x, i) => <rect key={i} x={x} y="60" width="46" height="560" />)}
      </g>
      {/* 무대 조명 */}
      <path d="M600 0 L360 675 L840 675 Z" fill="#c9a24b" opacity="0.12" />
      {/* 태극기(간략) */}
      <g transform="translate(600 250)">
        <rect x="-150" y="-100" width="300" height="200" fill="#f3ecdd" stroke="#8a6f3a" strokeWidth="3" />
        <circle cx="0" cy="0" r="52" fill="#a4442e" />
        <path d="M0 -52 A52 52 0 0 1 0 52 A26 26 0 0 0 0 0 A26 26 0 0 1 0 -52 Z" fill="#2f4b7c" />
        <g stroke="#20160c" strokeWidth="7">
          <line x1="-120" y1="-70" x2="-92" y2="-42" />
          <line x1="-113" y1="-77" x2="-85" y2="-49" />
          <line x1="120" y1="70" x2="92" y2="42" />
          <line x1="113" y1="77" x2="85" y2="49" />
        </g>
      </g>
      {/* 단상 앞 인물 실루엣 */}
      <g fill="#0c0704">
        <rect x="0" y="560" width="1200" height="115" />
        {[180, 300, 430, 560, 690, 820, 960, 1080].map((x, i) => (
          <g key={i} transform={`translate(${x} 560)`}>
            <circle cx="0" cy="-26" r="16" />
            <path d="M-18 0 Q0 -34 18 0 Z" />
          </g>
        ))}
      </g>
      <g fill="#e8d7a3" opacity="0.5">
        <circle cx="600" cy="70" r="8" />
      </g>
    </g>
  ),

  // 초모(모병) — 벽보 붙은 거리
  recruit: (
    <g>
      <Sky from="#2a2213" to="#100c07" />
      <rect x="0" y="360" width="1200" height="315" fill="#1a1509" />
      {/* 벽 */}
      <rect x="0" y="0" width="1200" height="400" fill="#221a0f" />
      {/* 벽보들 */}
      <g>
        {[
          { x: 120, r: -4 },
          { x: 360, r: 3 },
          { x: 620, r: -2 },
          { x: 880, r: 5 },
        ].map((p, i) => (
          <g key={i} transform={`translate(${p.x} 120) rotate(${p.r})`}>
            <rect width="150" height="200" fill="#e9dcbe" stroke="#7a6636" strokeWidth="2" />
            <rect x="20" y="18" width="110" height="14" fill="#a4442e" />
            <circle cx="75" cy="95" r="34" fill="none" stroke="#5a4a24" strokeWidth="3" />
            <path d="M60 95 l12 12 22 -28" fill="none" stroke="#5a4a24" strokeWidth="4" />
            <g fill="#6b5a30">
              <rect x="24" y="150" width="102" height="6" />
              <rect x="24" y="164" width="80" height="6" />
            </g>
          </g>
        ))}
      </g>
      {/* 지나가는 사람 실루엣 */}
      <g fill="#0d0803">
        {[240, 520, 780, 1000].map((x, i) => (
          <g key={i} transform={`translate(${x} 520)`}>
            <circle cx="0" cy="-70" r="18" />
            <rect x="-16" y="-56" width="32" height="120" rx="8" />
          </g>
        ))}
      </g>
      <g opacity="0.1" fill="#c9a24b"><rect width="1200" height="675" /></g>
    </g>
  ),

  // 대일 선전 성명서 — 책상, 타자기, 등불
  declaration: (
    <g>
      <Sky from="#20160e" to="#0a0705" />
      <rect x="0" y="0" width="1200" height="675" fill="#150f08" />
      {/* 등불 광원 */}
      <circle cx="820" cy="210" r="150" fill="#d9a94a" opacity="0.14" />
      <circle cx="820" cy="210" r="70" fill="#f0c25f" opacity="0.18" />
      {/* 책상 */}
      <rect x="150" y="470" width="900" height="205" fill="#2a1d10" />
      <rect x="150" y="470" width="900" height="16" fill="#3a2915" />
      {/* 문서 */}
      <g transform="translate(430 400) rotate(-3)">
        <rect width="240" height="150" fill="#efe4c8" stroke="#b79a5f" strokeWidth="2" />
        <rect x="24" y="24" width="150" height="10" fill="#a4442e" />
        <g fill="#6b5a30">
          {[52, 68, 84, 100, 116].map((y, i) => <rect key={i} x="24" y={y} width={i % 2 ? 150 : 190} height="6" />)}
        </g>
        <circle cx="200" cy="120" r="20" fill="#a4442e" opacity="0.85" />
      </g>
      {/* 만년필 */}
      <rect x="690" y="452" width="120" height="8" rx="4" fill="#c9a24b" transform="rotate(18 690 452)" />
      {/* 등불 */}
      <g transform="translate(800 150)">
        <rect x="-10" y="0" width="20" height="12" fill="#7a5a2c" />
        <path d="M-26 12 L26 12 L18 70 L-18 70 Z" fill="#e8b552" opacity="0.85" />
        <ellipse cx="0" cy="42" rx="9" ry="16" fill="#fff2c4" />
      </g>
    </g>
  ),

  // 버마 전선의 밤 — 정글, 확성기
  burma: (
    <g>
      <Sky from="#101d18" to="#05100c" />
      <circle cx="250" cy="150" r="46" fill="#cfe0cf" opacity="0.25" />
      {/* 정글 실루엣 */}
      <g fill="#0a1712">
        <path d="M0 675 L0 420 Q120 380 160 460 Q220 300 300 440 Q360 320 440 450 Q520 340 600 460 Q700 330 800 450 Q900 350 1000 460 Q1100 360 1200 440 L1200 675 Z" />
      </g>
      {/* 야자 잎 */}
      <g stroke="#12241b" strokeWidth="10" fill="none" opacity="0.8">
        <path d="M120 675 Q140 430 90 300" />
        <path d="M90 320 q-60 -20 -90 -60 M90 340 q60 -14 100 -50 M90 360 q-70 4 -110 -20" />
      </g>
      {/* 확성기 */}
      <g transform="translate(520 380)">
        <rect x="0" y="-8" width="70" height="16" rx="4" fill="#3a3226" />
        <path d="M70 -34 L150 -60 L150 60 L70 34 Z" fill="#c9a24b" />
        <circle cx="0" cy="0" r="10" fill="#241d12" />
      </g>
      {/* 음파 */}
      <g stroke="#e8d7a3" strokeWidth="3" fill="none" opacity="0.6">
        <path d="M690 320 q40 60 0 120" />
        <path d="M720 300 q60 80 0 160" />
        <path d="M752 282 q84 98 0 216" />
      </g>
      {/* 대원 실루엣 */}
      <g fill="#050d09">
        <g transform="translate(470 470)">
          <circle cx="0" cy="-70" r="16" />
          <rect x="-16" y="-56" width="32" height="110" rx="8" />
        </g>
      </g>
    </g>
  ),

  // 시안 훈련장 — 낙하산, 훈련 실루엣
  'oss-xian': (
    <g>
      <Sky from="#3a2c17" to="#120b06" />
      <circle cx="300" cy="140" r="90" fill="#e7c063" opacity="0.2" />
      {/* 원경 능선(황토 고원) */}
      <path d="M0 470 Q300 410 600 460 T1200 450 L1200 675 L0 675 Z" fill="#241a0e" />
      <path d="M0 540 Q400 500 800 540 T1200 530 L1200 675 L0 675 Z" fill="#180f07" />
      {/* 낙하산 */}
      <g transform="translate(860 150)">
        <path d="M-70 0 A70 60 0 0 1 70 0 Z" fill="#d8c79a" />
        <path d="M-70 0 L0 70 L70 0" fill="none" stroke="#8a7648" strokeWidth="2" />
        <line x1="-40" y1="6" x2="0" y2="70" stroke="#8a7648" strokeWidth="1.5" />
        <line x1="40" y1="6" x2="0" y2="70" stroke="#8a7648" strokeWidth="1.5" />
        <g fill="#0e0904" transform="translate(0 78)">
          <circle cx="0" cy="0" r="8" />
          <rect x="-6" y="6" width="12" height="26" rx="4" />
        </g>
      </g>
      {/* 훈련 대원 실루엣(포복·사격 자세) */}
      <g fill="#0d0803">
        <g transform="translate(300 560)">
          <circle cx="0" cy="-34" r="15" />
          <rect x="-14" y="-22" width="28" height="70" rx="8" />
          <rect x="6" y="-16" width="60" height="8" rx="4" transform="rotate(-8 6 -16)" />
        </g>
        <g transform="translate(560 575)">
          <ellipse cx="0" cy="-8" rx="40" ry="14" />
          <circle cx="-34" cy="-14" r="12" />
          <rect x="-30" y="-22" width="60" height="8" rx="4" transform="rotate(-6 -30 -22)" />
        </g>
        <g transform="translate(760 560)">
          <circle cx="0" cy="-34" r="15" />
          <rect x="-14" y="-22" width="28" height="70" rx="8" />
        </g>
      </g>
    </g>
  ),

  // 광복의 새벽 — 떠오르는 해, 태극기
  'liberation-dawn': (
    <g>
      <Sky from="#3d2a1a" to="#0f0a06" />
      {/* 여명 */}
      <circle cx="600" cy="470" r="360" fill="#e8b552" opacity="0.16" />
      <circle cx="600" cy="470" r="220" fill="#f0c25f" opacity="0.22" />
      <circle cx="600" cy="470" r="120" fill="#ffe7a3" opacity="0.35" />
      {/* 빛줄기 */}
      <g stroke="#f0c25f" strokeWidth="2" opacity="0.25">
        {Array.from({ length: 12 }).map((_, i) => {
          const a = (i / 12) * Math.PI * 2;
          return <line key={i} x1="600" y1="470" x2={600 + Math.cos(a) * 700} y2={470 + Math.sin(a) * 700} />;
        })}
      </g>
      {/* 능선 */}
      <path d="M0 520 Q300 470 600 510 T1200 500 L1200 675 L0 675 Z" fill="#1a120a" />
      {/* 깃대와 태극기 */}
      <g transform="translate(220 210)">
        <rect x="0" y="0" width="6" height="330" fill="#5a4a2a" />
        <g transform="translate(6 10)">
          <rect width="160" height="106" fill="#f3ecdd" stroke="#8a6f3a" strokeWidth="2" />
          <circle cx="80" cy="53" r="26" fill="#a4442e" />
          <path d="M80 27 A26 26 0 0 1 80 79 A13 13 0 0 0 80 53 A13 13 0 0 1 80 27 Z" fill="#2f4b7c" />
        </g>
      </g>
      {/* 사람들(만세) 실루엣 */}
      <g fill="#0b0704">
        {[520, 620, 720, 820, 900].map((x, i) => (
          <g key={i} transform={`translate(${x} 560)`}>
            <circle cx="0" cy="-40" r="14" />
            <rect x="-12" y="-28" width="24" height="70" rx="8" />
            <line x1="-10" y1="-24" x2="-30" y2="-58" stroke="#0b0704" strokeWidth="8" strokeLinecap="round" />
            <line x1="10" y1="-24" x2="30" y2="-58" stroke="#0b0704" strokeWidth="8" strokeLinecap="round" />
          </g>
        ))}
      </g>
    </g>
  ),
};
