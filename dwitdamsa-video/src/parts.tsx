import React from "react";
import {
  AbsoluteFill,
  Easing,
  Img,
  interpolate,
  random,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { BODY, DISPLAY, HAND } from "./fonts";

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

const pop = (frame: number, fps: number, delay = 0, damping = 11) =>
  spring({ frame: frame - delay, fps, config: { damping, stiffness: 170, mass: 0.7 } });

/* ---------- 배경 그림: 천천히 확대/이동(켄 번스) ---------- */
export const KenBurns: React.FC<{
  src: string;
  from?: number;
  to?: number;
  panX?: number;
  panY?: number;
  dur: number;
  origin?: string;
}> = ({ src, from = 1.05, to = 1.14, panX = 0, panY = 0, dur, origin = "50% 50%" }) => {
  const frame = useCurrentFrame();
  const t = interpolate(frame, [0, dur], [0, 1], { ...clamp, easing: Easing.inOut(Easing.quad) });
  return (
    <AbsoluteFill style={{ overflow: "hidden", backgroundColor: "#2a1d12" }}>
      <Img
        src={staticFile(src)}
        style={{
          width: "100%",
          height: "100%",
          objectFit: "cover",
          transformOrigin: origin,
          scale: String(from + (to - from) * t),
          translate: `${panX * t}px ${panY * t}px`,
        }}
      />
    </AbsoluteFill>
  );
};

/* ---------- 종이 질감 + 가장자리 그늘 ---------- */
export const PaperGrain: React.FC<{ opacity?: number }> = ({ opacity = 0.16 }) => (
  <AbsoluteFill style={{ pointerEvents: "none" }}>
    <svg width="100%" height="100%" style={{ position: "absolute", opacity, mixBlendMode: "multiply" }}>
      <filter id="grain">
        <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="3" seed="7" />
        <feColorMatrix type="saturate" values="0" />
      </filter>
      <rect width="100%" height="100%" filter="url(#grain)" />
    </svg>
    <AbsoluteFill
      style={{ background: "radial-gradient(ellipse at center, rgba(0,0,0,0) 58%, rgba(40,20,5,0.38) 100%)" }}
    />
  </AbsoluteFill>
);

/* ---------- 랜섬 노트(오려 붙인 글자) 타이틀 ---------- */
const TILE_STYLES = [
  { bg: "#d7263d", fg: "#fff" },
  { bg: "#f6f1e3", fg: "#1d1d1d" },
  { bg: "#2a7f8f", fg: "#fff" },
  { bg: "#1f1d36", fg: "#f6ae2d" },
  { bg: "#f6ae2d", fg: "#1d1d1d" },
  { bg: "#ffffff", fg: "#c0392b" },
];

export const Ransom: React.FC<{
  chars: string[];
  size?: number;
  seed?: string;
  delay?: number;
  stagger?: number;
}> = ({ chars, size = 150, seed = "r", delay = 0, stagger = 4 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return (
    <div style={{ display: "flex", gap: size * 0.08, alignItems: "center" }}>
      {chars.map((c, i) => {
        const st = TILE_STYLES[Math.floor(random(`${seed}-c-${i}`) * TILE_STYLES.length)];
        const rot = (random(`${seed}-r-${i}`) - 0.5) * 14;
        const dy = (random(`${seed}-y-${i}`) - 0.5) * size * 0.18;
        const p = pop(frame, fps, delay + i * stagger, 9);
        const isNum = /[0-9]/.test(c);
        return (
          <div
            key={i}
            style={{
              fontFamily: DISPLAY,
              fontSize: size * (isNum ? 0.82 : 0.72),
              lineHeight: 1,
              padding: `${size * 0.1}px ${size * 0.12}px`,
              background: st.bg,
              color: st.fg,
              rotate: `${rot}deg`,
              translate: `0 ${dy + (1 - p) * 40}px`,
              scale: String(interpolate(p, [0, 1], [0.2, 1])),
              opacity: interpolate(p, [0, 0.3], [0, 1], clamp),
              boxShadow: "4px 6px 0 rgba(0,0,0,0.35)",
              borderRadius: 4,
            }}
          >
            {c}
          </div>
        );
      })}
    </div>
  );
};

/* ---------- 손글씨 라벨(써지듯 나타남 + 체크 표시) ---------- */
export const HandLabel: React.FC<{
  text: string;
  x: number;
  y: number;
  delay?: number;
  size?: number;
  rotate?: number;
  check?: boolean;
  color?: string;
  bg?: string;
  writeFrames?: number;
}> = ({ text, x, y, delay = 0, size = 60, rotate = -3, check = false, color = "#2b2118", bg = "rgba(255,252,240,0.94)", writeFrames }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const wf = writeFrames ?? Math.max(10, Math.min(28, text.length * 1.6));
  const f = frame - delay;
  const reveal = interpolate(f, [0, wf], [100, 0], clamp);
  const appear = pop(frame, fps, delay, 14);
  const checkDraw = interpolate(f, [wf + 2, wf + 12], [1, 0], clamp);
  if (f < 0) return null;
  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y,
        rotate: `${rotate}deg`,
        scale: String(interpolate(appear, [0, 1], [0.85, 1])),
        transformOrigin: "left center",
        display: "flex",
        alignItems: "center",
        gap: 10,
        padding: `${size * 0.08}px ${size * 0.34}px ${size * 0.02}px`,
        background: bg,
        boxShadow: "3px 5px 0 rgba(0,0,0,0.28)",
        borderRadius: 6,
        whiteSpace: "nowrap",
      }}
    >
      {/* 마스킹 테이프 */}
      <div
        style={{
          position: "absolute",
          left: -18,
          top: -12,
          width: 60,
          height: 26,
          background: "rgba(246,174,45,0.75)",
          rotate: "-28deg",
        }}
      />
      <span style={{ fontFamily: HAND, fontSize: size, color, clipPath: `inset(0 ${reveal}% 0 0)`, lineHeight: 1.15 }}>
        {text}
      </span>
      {check ? (
        <svg width={size * 0.8} height={size * 0.8} viewBox="0 0 40 40" style={{ marginTop: -size * 0.1 }}>
          <path
            d="M5 22 L16 32 L36 6"
            fill="none"
            stroke="#d7263d"
            strokeWidth={5}
            strokeLinecap="round"
            strokeLinejoin="round"
            pathLength={1}
            strokeDasharray={1}
            strokeDashoffset={checkDraw}
          />
        </svg>
      ) : null}
    </div>
  );
};

/* ---------- 오려 붙인 스티커(튀어나오며 흔들림) ---------- */
export const Sticker: React.FC<{
  src: string;
  x: number;
  y: number;
  w: number;
  delay?: number;
  rotate?: number;
  wobble?: boolean;
}> = ({ src, x, y, w, delay = 0, rotate = 0, wobble = true }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const p = pop(frame, fps, delay, 8);
  if (frame < delay) return null;
  const wob = wobble ? Math.sin((frame - delay) / 9) * 2.2 : 0;
  return (
    <Img
      src={staticFile(src)}
      style={{
        position: "absolute",
        left: x,
        top: y,
        width: w,
        rotate: `${rotate + wob + (1 - p) * -25}deg`,
        scale: String(interpolate(p, [0, 1], [0, 1])),
        filter: "drop-shadow(6px 10px 6px rgba(0,0,0,0.45))",
      }}
    />
  );
};

/* ---------- 손그림 화살표 ---------- */
export const Arrow: React.FC<{
  d: string;
  delay?: number;
  color?: string;
  width?: number;
  head: { x: number; y: number; angle: number };
}> = ({ d, delay = 0, color = "#fffbe8", width = 9, head }) => {
  const frame = useCurrentFrame();
  const draw = interpolate(frame - delay, [0, 14], [1, 0], { ...clamp, easing: Easing.out(Easing.cubic) });
  const headOp = interpolate(frame - delay, [12, 16], [0, 1], clamp);
  return (
    <svg width={1920} height={1080} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
      <g style={{ filter: "drop-shadow(3px 4px 0 rgba(0,0,0,0.4))" }}>
        <path d={d} fill="none" stroke={color} strokeWidth={width} strokeLinecap="round" pathLength={1} strokeDasharray={1} strokeDashoffset={draw} />
        <g transform={`translate(${head.x} ${head.y}) rotate(${head.angle})`} opacity={headOp}>
          <path d="M -26 -18 L 0 0 L -26 18" fill="none" stroke={color} strokeWidth={width} strokeLinecap="round" strokeLinejoin="round" />
        </g>
      </g>
    </svg>
  );
};

/* ---------- 도장 ---------- */
export const Stamp: React.FC<{
  text: string;
  x: number;
  y: number;
  delay?: number;
  size?: number;
  rotate?: number;
  color?: string;
  paper?: boolean;
}> = ({ text, x, y, delay = 0, size = 110, rotate = -12, color = "#d7263d", paper = false }) => {
  const frame = useCurrentFrame();
  const f = frame - delay;
  if (f < 0) return null;
  const sc = interpolate(f, [0, 6, 9], [2.6, 0.92, 1], { ...clamp, easing: Easing.out(Easing.quad) });
  const op = interpolate(f, [0, 4], [0, 1], clamp);
  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y,
        rotate: `${rotate}deg`,
        scale: String(sc),
        opacity: op,
        fontFamily: DISPLAY,
        fontSize: size,
        color,
        border: `${size * 0.09}px solid ${color}`,
        borderRadius: size * 0.16,
        padding: `${size * 0.06}px ${size * 0.26}px`,
        lineHeight: 1.1,
        background: paper ? "rgba(255,250,236,0.92)" : "rgba(255,255,255,0.12)",
        mixBlendMode: paper ? "normal" : "multiply",
        boxShadow: paper ? "5px 7px 0 rgba(0,0,0,0.3)" : undefined,
        whiteSpace: "nowrap",
      }}
    >
      {text}
    </div>
  );
};

/* ---------- 말풍선 ---------- */
export const Bubble: React.FC<{
  text: string;
  x: number;
  y: number;
  delay?: number;
  size?: number;
  tail?: "left" | "right";
}> = ({ text, x, y, delay = 0, size = 58, tail = "left" }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const p = pop(frame, fps, delay, 10);
  if (frame < delay) return null;
  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y,
        scale: String(p),
        transformOrigin: tail === "left" ? "0% 100%" : "100% 100%",
      }}
    >
      <div
        style={{
          position: "relative",
          background: "#fffdf4",
          border: "5px solid #2b2118",
          borderRadius: 40,
          padding: "14px 34px 8px",
          fontFamily: HAND,
          fontSize: size,
          color: "#2b2118",
          whiteSpace: "nowrap",
          boxShadow: "5px 7px 0 rgba(0,0,0,0.3)",
        }}
      >
        {text}
        <svg width={60} height={50} style={{ position: "absolute", bottom: -44, [tail]: 50 }} viewBox="0 0 60 50">
          <path d={tail === "left" ? "M4 0 L10 46 L40 0" : "M56 0 L50 46 L20 0"} fill="#fffdf4" stroke="#2b2118" strokeWidth={5} strokeLinejoin="round" />
          <rect x={0} y={0} width={60} height={5} fill="#fffdf4" />
        </svg>
      </div>
    </div>
  );
};

/* ---------- 폴라로이드 사진 ---------- */
export const Polaroid: React.FC<{
  src: string;
  x: number;
  y: number;
  w: number;
  delay?: number;
  rotate?: number;
  caption?: string;
}> = ({ src, x, y, w, delay = 0, rotate = 6, caption }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const p = pop(frame, fps, delay, 12);
  if (frame < delay) return null;
  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y,
        width: w,
        background: "#fbf8ef",
        padding: `${w * 0.04}px ${w * 0.04}px ${w * 0.16}px`,
        rotate: `${rotate + (1 - p) * 20}deg`,
        translate: `${(1 - p) * 300}px ${(1 - p) * -80}px`,
        boxShadow: "8px 12px 18px rgba(0,0,0,0.45)",
      }}
    >
      <div style={{ position: "absolute", top: -20, left: "38%", width: 110, height: 36, background: "rgba(220,220,200,0.75)", rotate: "-4deg" }} />
      <Img src={staticFile(src)} style={{ width: "100%", aspectRatio: "16 / 9", objectFit: "cover", display: "block" }} />
      {caption ? (
        <div style={{ position: "absolute", bottom: w * 0.025, left: 0, right: 0, textAlign: "center", fontFamily: HAND, fontSize: w * 0.062, color: "#3a2a1a" }}>
          {caption}
        </div>
      ) : null}
    </div>
  );
};

/* ---------- 찢어진 종이 전환 ---------- */
const tornPoints = (edge: number, seed: string, height: number) => {
  const pts: string[] = [];
  const step = 36;
  for (let y = -step, i = 0; y <= height + step; y += step, i++) {
    const j = (random(`${seed}-${i}`) - 0.5) * 46;
    pts.push(`${edge + j}px ${y}px`);
  }
  return pts;
};

export const TornReveal: React.FC<{ children: React.ReactNode; dur?: number; seed?: string }> = ({
  children,
  dur = 16,
  seed = "tear",
}) => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const t = interpolate(frame, [0, dur], [0, 1], { ...clamp, easing: Easing.inOut(Easing.cubic) });
  if (t >= 1) return <AbsoluteFill>{children}</AbsoluteFill>;
  const edge = interpolate(t, [0, 1], [width + 80, -80]);
  const front = tornPoints(edge, seed, height);
  const paper = tornPoints(edge - 22, `${seed}-p`, height);
  const poly = (pts: string[]) => `polygon(${[...pts, `${width + 200}px ${height + 200}px`, `${width + 200}px -200px`].join(",")})`;
  return (
    <AbsoluteFill>
      <AbsoluteFill style={{ clipPath: poly(paper), background: "#f4ecd8", filter: "drop-shadow(-8px 0 10px rgba(0,0,0,0.45))" }} />
      <AbsoluteFill style={{ clipPath: poly(front) }}>{children}</AbsoluteFill>
    </AbsoluteFill>
  );
};

/* ---------- 브랜드 배지(좌상단) ---------- */
export const BrandBadge: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const p = pop(frame, fps, 4, 14);
  return (
    <div
      style={{
        position: "absolute",
        left: 44,
        top: 38,
        display: "flex",
        alignItems: "baseline",
        gap: 10,
        padding: "8px 22px 10px",
        background: "#1b1714",
        color: "#fff",
        borderRadius: 14,
        rotate: "-2deg",
        translate: `${(1 - p) * -260}px 0`,
        boxShadow: "4px 5px 0 rgba(0,0,0,0.35)",
      }}
    >
      <span style={{ fontFamily: BODY, fontWeight: 500, fontSize: 26, opacity: 0.85 }}>동쌤의</span>
      <span style={{ fontFamily: DISPLAY, fontSize: 44, color: "#39ff14" }}>뒷담사</span>
      <span style={{ fontFamily: DISPLAY, fontSize: 30, color: "#f6ae2d" }}>(史)</span>
    </div>
  );
};

/* ---------- 흔들리는 큰 외침 ---------- */
export const Shout: React.FC<{ text: string; delay?: number; x: number; y: number; size?: number }> = ({ text, delay = 0, x, y, size = 120 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const f = frame - delay;
  if (f < 0) return null;
  const p = pop(frame, fps, delay, 7);
  const shake = f < 30 ? Math.sin(f * 2.3) * 9 * (1 - f / 30) : 0;
  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y,
        fontFamily: DISPLAY,
        fontSize: size,
        color: "#d7263d",
        WebkitTextStroke: "10px #fffdf4",
        paintOrder: "stroke fill",
        rotate: `${-6 + shake * 0.3}deg`,
        translate: `${shake}px 0`,
        scale: String(interpolate(p, [0, 1], [2.2, 1])),
        opacity: interpolate(f, [0, 3], [0, 1], clamp),
        whiteSpace: "nowrap",
        filter: "drop-shadow(6px 8px 0 rgba(0,0,0,0.4))",
      }}
    >
      {text}
    </div>
  );
};
