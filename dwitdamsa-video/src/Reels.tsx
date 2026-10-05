import React from "react";
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { CAPTIONS, FPS } from "./copy";
import { BODY, DISPLAY } from "./fonts";
import { Main } from "./Main";

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

// 세로형(9:16) 릴스/쇼츠 버전 — 레퍼런스 영상처럼 위에 초록 제목 박스, 가운데 16:9 영상, 아래 자막
export const Reels: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / FPS;
  const cap = CAPTIONS.find(([a, b]) => t >= a && t < b);
  const capIn = cap ? spring({ frame: frame - Math.round(cap[0] * FPS), fps, config: { damping: 14 } }) : 0;
  const scale = 1080 / 1920;
  return (
    <AbsoluteFill style={{ backgroundColor: "#17130f" }}>
      <div style={{ position: "absolute", top: 250, left: 0, right: 0, textAlign: "center" }}>
        <div style={{ fontFamily: BODY, fontWeight: 800, fontSize: 40, color: "#fff" }}>
          동쌤의 <span style={{ color: "#39ff14" }}>뒷담사(史)</span> · 고대 문명 편
        </div>
        <div
          style={{
            display: "inline-block",
            marginTop: 22,
            background: "#39ff14",
            padding: "14px 46px 18px",
            borderRadius: 14,
            fontFamily: DISPLAY,
            fontSize: 84,
            lineHeight: 1.18,
            color: "#111",
          }}
        >
          3,750년 전에도
          <br />
          별점 테러가 있었다?!
        </div>
      </div>

      <div
        style={{
          position: "absolute",
          top: 700,
          left: 0,
          width: 1920,
          height: 1080,
          scale: String(scale),
          transformOrigin: "0 0",
          overflow: "hidden",
        }}
      >
        <Main />
      </div>

      <div style={{ position: "absolute", top: 1380, left: 40, right: 40, textAlign: "center" }}>
        {cap ? (
          <span
            style={{
              display: "inline-block",
              fontFamily: DISPLAY,
              fontSize: 76,
              lineHeight: 1.25,
              color: "#fff",
              WebkitTextStroke: "10px #000",
              paintOrder: "stroke fill",
              scale: String(interpolate(capIn, [0, 1], [0.8, 1])),
              opacity: interpolate(capIn, [0, 0.4], [0, 1], clamp),
            }}
          >
            {cap[2]}
          </span>
        ) : null}
      </div>
      <div
        style={{
          position: "absolute",
          bottom: 230,
          left: 0,
          right: 0,
          textAlign: "center",
          fontFamily: BODY,
          fontWeight: 500,
          fontSize: 30,
          color: "rgba(255,255,255,0.6)",
        }}
      >
        중학교 역사 · 메소포타미아 문명 × 쐐기 문자
      </div>
    </AbsoluteFill>
  );
};
