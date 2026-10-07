import React from "react";
import { Audio } from "@remotion/media";
import { AbsoluteFill, Easing, interpolate, Sequence, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { FPS } from "../copy";
import { BODY, DISPLAY, HAND } from "../fonts";
import {
  BrandBadge,
  EndingMusic,
  HandLabel,
  KenBurns,
  PaperGrain,
  Ransom,
  Shout,
  Stamp,
  Sticker,
  TimeJump,
  TornReveal,
} from "../parts";
import { DURATION, NARRATION_END, TEXT } from "./copy";

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const OFFSET = 0.5; // 내레이션 시작(초)
const s = (sec: number) => Math.round(sec * FPS);

export const SCENES = {
  sippar: [0, 112],
  elam: [100, 240],
  erase: [228, 380],
  blank: [368, 484],
  night: [472, 512],
  dig: [500, 600],
  museum: [588, 690],
  naramsin: [678, 780],
  card: [768, 930],
} as const;

// 영상 전체 기준 초 → 장면 시작 기준 프레임
const at = (k: keyof typeof SCENES, sec: number) => s(sec) - SCENES[k][0];

const Scene: React.FC<{ k: keyof typeof SCENES; children: React.ReactNode; tear?: boolean }> = ({ k, children, tear = true }) => {
  const [from, to] = SCENES[k];
  return (
    <Sequence from={from} durationInFrames={to - from} name={k}>
      {tear ? <TornReveal seed={`ep3-${k}`}>{children}</TornReveal> : <AbsoluteFill>{children}</AbsoluteFill>}
    </Sequence>
  );
};

const img = (f: string) => `ep3/img/${f}`;
const stk = (f: string) => `ep3/stickers/${f}`;

/* 1. 시파르의 신전 */
const SipparScene: React.FC = () => (
  <AbsoluteFill>
    <KenBurns src={img("g1_sippar.jpg")} dur={112} from={1.03} to={1.1} panX={-20} origin="50% 30%" />
    <PaperGrain />
    <HandLabel text={TEXT.sippar} x={980} y={230} size={56} delay={s(1.6)} check rotate={-3} />
  </AbsoluteFill>
);

/* 2. 엘람 왕이 통째로 빼앗아 가다 */
const ElamScene: React.FC = () => (
  <AbsoluteFill>
    <KenBurns src={img("g2_elam.jpg")} dur={140} from={1.04} to={1.12} panX={30} origin="50% 50%" />
    <PaperGrain />
    <HandLabel text={TEXT.king} x={110} y={170} size={64} delay={at("elam", 3.7)} check rotate={-3} />
    <HandLabel text={TEXT.stele} x={1020} y={250} size={54} delay={at("elam", 4.8)} rotate={2} />
    <Stamp text={TEXT.loot} x={760} y={760} delay={at("elam", 6.3)} size={130} rotate={-10} />
    <HandLabel text={TEXT.route} x={1060} y={930} size={48} delay={at("elam", 6.9)} rotate={-2} bg="rgba(246,174,45,0.96)" />
  </AbsoluteFill>
);

/* 3. 법 조항 일곱 단을 갈아 버리다 */
const EraseScene: React.FC = () => {
  const frame = useCurrentFrame();
  const out = interpolate(frame, [at("erase", 12.2), at("erase", 12.5)], [1, 0], clamp);
  return (
    <AbsoluteFill>
      <KenBurns src={img("g3_erase.jpg")} dur={152} from={1.04} to={1.16} origin="55% 60%" />
      <PaperGrain />
      <HandLabel text={TEXT.seven} x={110} y={170} size={60} delay={at("erase", 9.7)} check rotate={-3} />
      <Sticker src={stk("chisel.png")} x={1450} y={180} w={300} delay={at("erase", 10.0)} rotate={12} />
      <div style={{ opacity: out }}>
        <Shout text={TEXT.scrub} x={760} y={760} delay={at("erase", 11.2)} size={150} />
      </div>
    </AbsoluteFill>
  );
};

/* 4. 정작 이름은 못 새김 */
const BlankScene: React.FC = () => (
  <AbsoluteFill>
    <KenBurns src={img("g4_blank.jpg")} dur={116} from={1.04} to={1.12} origin="50% 55%" />
    <PaperGrain />
    <HandLabel text={TEXT.blank} x={110} y={170} size={66} delay={at("blank", 13.1)} rotate={-3} />
    <Shout text={TEXT.empty} x={1260} y={620} delay={at("blank", 14.4)} size={170} />
  </AbsoluteFill>
);

/* 5. 시간 점프 */
const NightScene: React.FC = () => <TimeJump chars={TEXT.titleLater} seed="ep3-later" />;

/* 6. 1901년 수사 발굴 */
const DigScene: React.FC = () => (
  <AbsoluteFill>
    <KenBurns src={img("g5_dig.jpg")} dur={100} from={1.04} to={1.1} origin="50% 50%" />
    <PaperGrain />
    <HandLabel text={TEXT.found} x={110} y={170} size={62} delay={14} rotate={-3} />
    <Sticker src={stk("fragments.png")} x={1380} y={600} w={420} delay={32} rotate={-6} />
    <HandLabel text={TEXT.pieces} x={1300} y={480} size={66} delay={40} check rotate={3} bg="rgba(246,174,45,0.96)" />
  </AbsoluteFill>
);

/* 7. 루브르 박물관 — 지운 자리 그대로 */
const MuseumScene: React.FC = () => (
  <AbsoluteFill>
    <KenBurns src={img("g6_museum.jpg")} dur={102} from={1.04} to={1.1} origin="50% 40%" />
    <PaperGrain />
    <HandLabel text={TEXT.louvre} x={110} y={170} size={62} delay={12} rotate={-3} />
    <HandLabel text={TEXT.scar} x={1060} y={880} size={62} delay={36} check rotate={-2} bg="rgba(246,174,45,0.96)" />
  </AbsoluteFill>
);

/* 8. 뒷담 한 스푼 — 나람신 승전비 */
const NaramSinScene: React.FC = () => (
  <AbsoluteFill>
    <KenBurns src={img("g7_naramsin.jpg")} dur={102} from={1.04} to={1.1} origin="50% 40%" />
    <PaperGrain />
    <HandLabel text={TEXT.gossipHead} x={90} y={160} size={58} delay={10} rotate={-2} />
    <HandLabel text={TEXT.gossip} x={150} y={880} size={64} delay={34} check rotate={-1} bg="rgba(246,174,45,0.96)" />
  </AbsoluteFill>
);

/* 9. 팩트 체크 + 교과서 연결 */
const CardScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const qIn = spring({ frame: frame - 70, fps, config: { damping: 14 } });
  return (
    <AbsoluteFill style={{ background: "#efe4c8" }}>
      <PaperGrain opacity={0.22} />
      <div style={{ position: "absolute", left: 110, top: 150, width: 900 }}>
        <div style={{ fontFamily: DISPLAY, fontSize: 70, color: "#1b1714", marginBottom: 26 }}>
          <span style={{ background: "#39ff14", padding: "0 16px", boxShadow: "5px 6px 0 #1b1714" }}>{TEXT.factHead}</span>
        </div>
        {TEXT.facts.map((f, i) => {
          const d = 10 + i * 12;
          const op = interpolate(frame, [d, d + 8], [0, 1], clamp);
          return (
            <div
              key={f}
              style={{
                display: "flex",
                gap: 16,
                alignItems: "center",
                fontFamily: BODY,
                fontWeight: 500,
                fontSize: 34,
                color: "#2b2118",
                marginTop: 26,
                opacity: op,
                translate: `${(1 - op) * -40}px 0`,
              }}
            >
              <svg width={40} height={40} viewBox="0 0 40 40" style={{ flexShrink: 0 }}>
                <path d="M5 22 L16 32 L36 6" fill="none" stroke="#d7263d" strokeWidth={6} strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              {f}
            </div>
          );
        })}
      </div>
      <div
        style={{
          position: "absolute",
          right: 90,
          top: 140,
          width: 700,
          background: "#fffdf6",
          border: "6px solid #1b1714",
          borderRadius: 26,
          padding: "34px 40px",
          rotate: "2deg",
          boxShadow: "10px 12px 0 rgba(0,0,0,0.25)",
          opacity: interpolate(frame, [40, 50], [0, 1], clamp),
          translate: `0 ${interpolate(frame, [40, 52], [60, 0], { ...clamp, easing: Easing.out(Easing.back(1.6)) })}px`,
        }}
      >
        <div style={{ fontFamily: DISPLAY, fontSize: 44, color: "#2a7f8f" }}>{TEXT.textbookHead}</div>
        <div style={{ fontFamily: BODY, fontWeight: 800, fontSize: 38, lineHeight: 1.5, color: "#1b1714", marginTop: 16 }}>
          {TEXT.textbookBody}
        </div>
        <div style={{ fontFamily: BODY, fontWeight: 500, fontSize: 26, color: "#6b5a44", marginTop: 12 }}>{TEXT.textbookNote}</div>
      </div>
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 130,
          textAlign: "center",
          fontFamily: HAND,
          fontSize: 76,
          color: "#1b1714",
          scale: String(qIn),
        }}
      >
        <span style={{ background: "#f6ae2d", padding: "4px 30px", boxShadow: "5px 6px 0 rgba(0,0,0,0.3)" }}>Q. {TEXT.question}</span>
      </div>
      <div
        style={{
          position: "absolute",
          right: 70,
          bottom: 40,
          fontFamily: BODY,
          fontWeight: 500,
          fontSize: 24,
          color: "#6b5a44",
          opacity: interpolate(frame, [90, 100], [0, 1], clamp),
        }}
      >
        {TEXT.sources}
      </div>
    </AbsoluteFill>
  );
};

/* 타이틀 — 가운데에서 등장 후 우상단 배지로 */
const TitleBadge: React.FC = () => {
  const frame = useCurrentFrame();
  const t = interpolate(frame, [36, 56], [0, 1], { ...clamp, easing: Easing.inOut(Easing.cubic) });
  if (frame >= SCENES.night[0] + 10) return null;
  return (
    <div
      style={{
        position: "absolute",
        left: interpolate(t, [0, 1], [960, 1700]),
        top: interpolate(t, [0, 1], [520, 92]),
        translate: "-50% -50%",
        scale: String(interpolate(t, [0, 1], [1, 0.34])),
      }}
    >
      <Ransom chars={TEXT.titleThen} size={160} seed="ep3-then" delay={6} stagger={4} />
    </div>
  );
};

const CornerBadge: React.FC<{ chars: string[]; seed: string }> = ({ chars, seed }) => (
  <div style={{ position: "absolute", right: 60, top: 50 }}>
    <Ransom chars={chars} size={62} seed={seed} delay={6} stagger={3} />
  </div>
);

export const Ep3Main: React.FC = () => (
  <AbsoluteFill style={{ backgroundColor: "#1b1714" }}>
    <Scene k="sippar" tear={false}>
      <SipparScene />
    </Scene>
    <Scene k="elam">
      <ElamScene />
    </Scene>
    <Scene k="erase">
      <EraseScene />
    </Scene>
    <Scene k="blank">
      <BlankScene />
    </Scene>
    <Scene k="night">
      <NightScene />
    </Scene>
    <Scene k="dig">
      <DigScene />
    </Scene>
    <Scene k="museum">
      <MuseumScene />
    </Scene>
    <Scene k="naramsin">
      <NaramSinScene />
    </Scene>
    <Scene k="card">
      <CardScene />
    </Scene>

    <TitleBadge />
    <Sequence from={SCENES.dig[0] + 10} durationInFrames={SCENES.dig[1] - SCENES.dig[0] - 10}>
      <CornerBadge chars={["1", "9", "0", "1", "년"]} seed="ep3-1901" />
    </Sequence>
    <Sequence from={SCENES.museum[0] + 10} durationInFrames={SCENES.museum[1] - SCENES.museum[0] - 10}>
      <CornerBadge chars={["오", "늘"]} seed="ep3-now" />
    </Sequence>
    <BrandBadge />

    <Sequence from={s(OFFSET)}>
      <Audio src={staticFile("ep3/audio/narration.mp3")} />
    </Sequence>
    <EndingMusic fromSec={NARRATION_END} endSec={DURATION} />
  </AbsoluteFill>
);
