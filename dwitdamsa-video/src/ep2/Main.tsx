import React from "react";
import { Audio } from "@remotion/media";
import { AbsoluteFill, Easing, interpolate, Sequence, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { FPS } from "../copy";
import { BODY, DISPLAY, HAND } from "../fonts";
import {
  Arrow,
  BrandBadge,
  HandLabel,
  KenBurns,
  PaperGrain,
  Polaroid,
  Ransom,
  Stamp,
  Sticker,
  TimeJump,
  TornReveal,
} from "../parts";
import { TEXT } from "./copy";

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const OFFSET = 0.5; // 내레이션 시작(초)
const s = (sec: number) => Math.round(sec * FPS);

export const SCENES = {
  giza: [0, 110],
  merer: [98, 176],
  boat: [164, 250],
  night: [238, 282],
  cave: [270, 400],
  meal: [388, 560],
  graffiti: [548, 668],
  card: [656, 840],
} as const;

// 장면 안에서 쓰는 지연값: 영상 전체 기준 초 → 장면 시작 기준 프레임
const at = (k: keyof typeof SCENES, sec: number) => s(sec) - SCENES[k][0];

const Scene: React.FC<{ k: keyof typeof SCENES; children: React.ReactNode; tear?: boolean }> = ({ k, children, tear = true }) => {
  const [from, to] = SCENES[k];
  return (
    <Sequence from={from} durationInFrames={to - from} name={k}>
      {tear ? <TornReveal seed={`ep2-${k}`}>{children}</TornReveal> : <AbsoluteFill>{children}</AbsoluteFill>}
    </Sequence>
  );
};

const img = (f: string) => `ep2/img/${f}`;
const stk = (f: string) => `ep2/stickers/${f}`;

/* 1. 쿠푸 왕의 피라미드 공사장 */
const GizaScene: React.FC = () => (
  <AbsoluteFill>
    <KenBurns src={img("g1_giza.jpg")} dur={110} from={1.03} to={1.1} panX={-20} origin="50% 5%" />
    <PaperGrain />
    <HandLabel text={TEXT.giza} x={1120} y={250} size={60} delay={s(1.7)} check rotate={-3} />
    <Arrow d="M 1110 300 C 1060 300, 1020 310, 980 330" head={{ x: 980, y: 330, angle: 160 }} delay={s(2.1)} />
  </AbsoluteFill>
);

/* 2. 감독관 메레르 */
const MererScene: React.FC = () => (
  <AbsoluteFill>
    <KenBurns src={img("g2_merer.jpg")} dur={78} from={1.05} to={1.11} origin="60% 40%" />
    <PaperGrain />
    <HandLabel text={TEXT.merer} x={110} y={170} size={74} delay={at("merer", 3.7)} check rotate={-3} />
    <Arrow d="M 640 260 C 760 250, 860 280, 940 330" head={{ x: 940, y: 330, angle: 30 }} delay={at("merer", 4.0)} />
    <Sticker src={stk("papyrus.png")} x={150} y={520} w={420} delay={at("merer", 4.6)} rotate={-8} />
    <HandLabel text={TEXT.logbook} x={140} y={880} size={56} delay={at("merer", 4.9)} rotate={2} />
  </AbsoluteFill>
);

/* 3. 석회암을 배로 나르다 */
const BoatScene: React.FC = () => (
  <AbsoluteFill>
    <KenBurns src={img("g3_boat.jpg")} dur={86} from={1.05} to={1.1} panX={30} origin="50% 55%" />
    <PaperGrain />
    <HandLabel text={TEXT.block} x={1080} y={150} size={58} delay={8} rotate={-2} />
    <Polaroid src={img("g5_map.jpg")} x={90} y={90} w={560} delay={18} rotate={-5} caption={TEXT.mapCaption} />
    <HandLabel text={TEXT.route} x={90} y={560} size={46} delay={30} rotate={-2} />
    <HandLabel text={TEXT.everyday} x={1180} y={880} size={66} delay={at("boat", 6.6)} check rotate={-4} bg="rgba(246,174,45,0.96)" />
  </AbsoluteFill>
);

/* 4. 시간 점프 */
const NightScene: React.FC = () => <TimeJump chars={TEXT.titleLater} seed="ep2-later" />;

/* 5. 2013년 발견 — 가장 오래된 파피루스 */
const CaveScene: React.FC = () => (
  <AbsoluteFill>
    <KenBurns src={img("g6_cave.jpg")} dur={130} from={1.04} to={1.12} origin="55% 50%" />
    <PaperGrain />
    <HandLabel text={TEXT.found} x={90} y={160} size={58} delay={at("cave", 9.3)} rotate={-2} />
    <HandLabel text={TEXT.oldest} x={820} y={860} size={64} delay={at("cave", 10.2)} check rotate={-3} />
    <Stamp text={TEXT.guinness} x={1180} y={240} delay={at("cave", 11.6)} size={70} rotate={8} color="#b8321f" paper />
  </AbsoluteFill>
);

/* "노예" 도장 위에 빨간 X */
const NoSlave: React.FC<{ delay: number }> = ({ delay }) => {
  const frame = useCurrentFrame();
  const draw = interpolate(frame - delay, [8, 18], [1, 0], clamp);
  return (
    <>
      <Stamp text={TEXT.slave} x={720} y={330} delay={delay} size={150} rotate={-8} color="#1b1714" paper />
      <svg width={1920} height={1080} style={{ position: "absolute", left: 0, top: 0 }}>
        <g stroke="#d7263d" strokeWidth={26} strokeLinecap="round" fill="none">
          <path d="M 700 320 L 1120 560" pathLength={1} strokeDasharray={1} strokeDashoffset={draw} />
          <path d="M 1120 320 L 700 560" pathLength={1} strokeDasharray={1} strokeDashoffset={interpolate(frame - delay, [14, 24], [1, 0], clamp)} />
        </g>
      </svg>
    </>
  );
};

/* 6. 노예가 아니라 빵과 맥주를 받던 일꾼 */
const MealScene: React.FC = () => {
  const frame = useCurrentFrame();
  const fade = interpolate(frame, [at("meal", 15.3), at("meal", 15.6)], [1, 0], clamp);
  return (
    <AbsoluteFill>
      <KenBurns src={img("g4_meal.jpg")} dur={172} from={1.04} to={1.14} origin="50% 55%" />
      <PaperGrain />
      <div style={{ opacity: fade }}>
        <NoSlave delay={at("meal", 14.2)} />
      </div>
      <Sticker src={stk("bread.png")} x={300} y={250} w={300} delay={at("meal", 15.5)} rotate={-10} />
      <HandLabel text={TEXT.bread} x={330} y={190} size={70} delay={at("meal", 15.6)} rotate={-6} />
      <Sticker src={stk("beer.png")} x={1350} y={230} w={260} delay={at("meal", 15.95)} rotate={8} />
      <HandLabel text={TEXT.beer} x={1380} y={170} size={70} delay={at("meal", 16.05)} rotate={5} />
      <HandLabel text={TEXT.ration} x={560} y={900} size={70} delay={at("meal", 16.5)} check rotate={-2} bg="rgba(246,174,45,0.96)" />
    </AbsoluteFill>
  );
};

/* 7. 뒷담 한 스푼 — 작업 팀 이름 낙서 */
const GraffitiScene: React.FC = () => (
  <AbsoluteFill>
    <KenBurns src={img("g7_graffiti.jpg")} dur={120} from={1.04} to={1.1} origin="50% 45%" />
    <PaperGrain />
    <HandLabel text={TEXT.gossipHead} x={90} y={160} size={62} delay={10} rotate={-2} />
    <HandLabel text={TEXT.gang1} x={1120} y={700} size={76} delay={30} rotate={-5} bg="rgba(246,174,45,0.96)" />
    <HandLabel text={TEXT.gang2} x={1060} y={840} size={76} delay={46} rotate={3} bg="rgba(255,252,240,0.96)" check />
  </AbsoluteFill>
);

/* 8. 팩트 체크 + 교과서 연결 */
const CardScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const qIn = spring({ frame: frame - 70, fps, config: { damping: 14 } });
  return (
    <AbsoluteFill style={{ background: "#efe4c8" }}>
      <PaperGrain opacity={0.22} />
      <div style={{ position: "absolute", left: 110, top: 150, width: 860 }}>
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
                fontSize: 38,
                color: "#2b2118",
                marginTop: 26,
                opacity: op,
                translate: `${(1 - op) * -40}px 0`,
              }}
            >
              <svg width={40} height={40} viewBox="0 0 40 40">
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
          right: 100,
          top: 140,
          width: 740,
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
      <Ransom chars={TEXT.titleThen} size={160} seed="ep2-then" delay={6} stagger={4} />
    </div>
  );
};

const CornerBadge: React.FC<{ chars: string[]; seed: string }> = ({ chars, seed }) => (
  <div style={{ position: "absolute", right: 60, top: 50 }}>
    <Ransom chars={chars} size={62} seed={seed} delay={6} stagger={3} />
  </div>
);

export const Ep2Main: React.FC = () => (
  <AbsoluteFill style={{ backgroundColor: "#1b1714" }}>
    <Scene k="giza" tear={false}>
      <GizaScene />
    </Scene>
    <Scene k="merer">
      <MererScene />
    </Scene>
    <Scene k="boat">
      <BoatScene />
    </Scene>
    <Scene k="night">
      <NightScene />
    </Scene>
    <Scene k="cave">
      <CaveScene />
    </Scene>
    <Scene k="meal">
      <MealScene />
    </Scene>
    <Scene k="graffiti">
      <GraffitiScene />
    </Scene>
    <Scene k="card">
      <CardScene />
    </Scene>

    <TitleBadge />
    <Sequence from={SCENES.cave[0] + 10} durationInFrames={SCENES.cave[1] - SCENES.cave[0] - 10}>
      <CornerBadge chars={["2", "0", "1", "3", "년"]} seed="ep2-2013" />
    </Sequence>
    <Sequence from={SCENES.meal[0] + 10} durationInFrames={SCENES.graffiti[1] - SCENES.meal[0] - 10}>
      <CornerBadge chars={TEXT.titleThen} seed="ep2-back" />
    </Sequence>
    <BrandBadge />

    <Sequence from={s(OFFSET)}>
      <Audio src={staticFile("ep2/audio/narration.mp3")} />
    </Sequence>
  </AbsoluteFill>
);
