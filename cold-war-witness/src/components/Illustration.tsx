/**
 * 챕터 그림 — 저작권 걱정 없는 단순한 SVG. 폭력적이거나 무서운 모습은 넣지 않는다.
 */
import type { Chapter } from '../types/content';

export function ChapterIllustration({ theme, className = '' }: { theme: Chapter['theme']; className?: string }) {
  const common = { viewBox: '0 0 320 120', className, role: 'img' as const };
  if (theme === 'berlin') {
    return (
      <svg {...common} aria-label="창문이 늘어선 동베를린의 아파트와 긴 벽">
        <rect width="320" height="120" fill="#dfe6ec" />
        <rect x="20" y="20" width="110" height="80" fill="#4f6475" />
        {[0, 1, 2, 3].map((r) =>
          [0, 1, 2, 3, 4].map((c) => (
            <rect key={`${r}-${c}`} x={28 + c * 20} y={28 + r * 18} width="12" height="10" fill={(r + c) % 3 === 0 ? '#f4e3a1' : '#9fb1bf'} />
          )),
        )}
        <rect x="150" y="70" width="170" height="30" fill="#9aa7b1" />
        {[...Array(9)].map((_, i) => (
          <line key={i} x1={150 + i * 20} y1="70" x2={150 + i * 20} y2="100" stroke="#7d8a94" strokeWidth="1.5" />
        ))}
        <circle cx="265" cy="30" r="12" fill="#f3f0e6" />
        <rect y="100" width="320" height="20" fill="#26323d" />
      </svg>
    );
  }
  if (theme === 'newyork') {
    return (
      <svg {...common} aria-label="1950년대 라디오 방송국의 마이크와 대본">
        <rect width="320" height="120" fill="#efe2cf" />
        <rect x="30" y="30" width="90" height="70" rx="6" fill="#fbf6ea" stroke="#7a5634" strokeWidth="2" transform="rotate(-6 75 65)" />
        {[0, 1, 2, 3, 4].map((i) => (
          <line key={i} x1="42" y1={46 + i * 10} x2="105" y2={40 + i * 10} stroke="#b9a07e" strokeWidth="2" />
        ))}
        <rect x="190" y="18" width="36" height="56" rx="18" fill="#7a5634" />
        {[0, 1, 2, 3].map((i) => (
          <line key={i} x1="194" y1={30 + i * 10} x2="222" y2={30 + i * 10} stroke="#3b2a1a" strokeWidth="2" />
        ))}
        <rect x="205" y="74" width="6" height="22" fill="#3b2a1a" />
        <rect x="185" y="96" width="46" height="6" rx="3" fill="#3b2a1a" />
        <text x="250" y="60" fontFamily="monospace" fontSize="14" fill="#7a5634">
          ON AIR
        </text>
        <rect y="104" width="320" height="16" fill="#3b2a1a" />
      </svg>
    );
  }
  return (
    <svg {...common} aria-label="플로리다 바닷가 마을과 신문">
      <rect width="320" height="120" fill="#dde4f0" />
      <path d="M0 80 Q 40 70 80 80 T 160 80 T 240 80 T 320 80 V120 H0 Z" fill="#2c4a7a" />
      <path d="M0 92 Q 40 84 80 92 T 160 92 T 240 92 T 320 92 V120 H0 Z" fill="#14213d" />
      <rect x="54" y="40" width="5" height="40" fill="#6b4f2a" />
      <path d="M56 40 q -18 -6 -26 4 M56 40 q 18 -8 26 2 M56 40 q -8 -14 -20 -12 M56 40 q 10 -14 22 -10" stroke="#2f6b1f" strokeWidth="5" fill="none" strokeLinecap="round" />
      <rect x="200" y="22" width="92" height="56" fill="#fbf6ea" stroke="#14213d" strokeWidth="2" transform="rotate(4 246 50)" />
      <text x="212" y="42" fontFamily="monospace" fontSize="12" fontWeight="bold" fill="#b04e0a" transform="rotate(4 246 50)">
        NEWS
      </text>
      {[0, 1, 2].map((i) => (
        <line key={i} x1="212" y1={52 + i * 8} x2="280" y2={56 + i * 8} stroke="#9aa6b8" strokeWidth="2" />
      ))}
    </svg>
  );
}
