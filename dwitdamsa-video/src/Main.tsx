import React from "react";
import { Audio } from "@remotion/media";
import {
  AbsoluteFill,
  Easing,
  interpolate,
  random,
  Sequence,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
  spring,
} from "remotion";
import { NARRATION_OFFSET, s, TEXT } from "./copy";
import { BODY, DISPLAY, HAND } from "./fonts";
import {
  Arrow,
  BrandBadge,
  Bubble,
  HandLabel,
  KenBurns,
  PaperGrain,
  Polaroid,
  Ransom,
  Shout,
  Stamp,
  Sticker,
  TornReveal,
} from "./parts";

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

// 장면 경계(프레임). 다음 장면은 이전 장면 끝보다 조금 일찍 시작해 찢어진 종이로 덮는다.
export const SCENES = {
  ur: [0, 126],
  merchant: [114, 178],
  offer: [166, 230],
  angry: [218, 372],
  night: [360, 400],
  phone: [388, 516],
  dig: [504, 624],
  card: [612, 780],
} as const;

const Scene: React.FC<{ k: keyof typeof SCENES; children: React.ReactNode; tear?: boolean; seed?: string }> = ({
  k,
  children,
  tear = true,
  seed,
}) => {
  const [from, to] = SCENES[k];
  return (
    <Sequence from={from} durationInFrames={to - from} name={k}>
      {tear ? <TornReveal seed={seed ?? k}>{children}</TornReveal> : <AbsoluteFill>{children}</AbsoluteFill>}
    </Sequence>
  );
};

/* 1. 3,750년 전 우르 */
const UrScene: React.FC = () => (
  <AbsoluteFill>
    <KenBurns src="img/s1_ur.jpg" dur={126} from={1.04} to={1.13} panX={-30} origin="40% 45%" />
    <PaperGrain />
    <HandLabel text={TEXT.ur} x={1060} y={200} size={70} delay={s(1.9)} check rotate={-4} />
    <Arrow d="M 1050 250 C 980 250, 930 270, 880 300" head={{ x: 880, y: 300, angle: 160 }} delay={s(2.3)} />
    <HandLabel text={TEXT.ziggurat} x={230} y={650} size={56} delay={s(2.9)} rotate={3} />
    <Arrow d="M 330 640 C 360 590, 400 560, 450 540" head={{ x: 450, y: 540, angle: -30 }} delay={s(3.1)} />
  </AbsoluteFill>
);

/* 2. 구리 상인 에아나시르 */
const MerchantScene: React.FC = () => (
  <AbsoluteFill>
    <KenBurns src="img/s2_merchant.jpg" dur={64} from={1.05} to={1.11} origin="65% 30%" />
    <PaperGrain />
    <HandLabel text={TEXT.merchant} x={110} y={170} size={72} delay={8} check rotate={-3} />
    <Arrow d="M 820 270 C 900 250, 960 260, 1030 300" head={{ x: 1030, y: 300, angle: 25 }} delay={14} />
    <Polaroid src="img/s5_map.jpg" x={120} y={400} w={600} delay={22} rotate={-6} caption="딜문(지금의 바레인)에서 배로 수입" />
    <Sticker src="stickers/boat.png" x={600} y={330} w={170} delay={34} rotate={6} />
  </AbsoluteFill>
);

/* 3. 불량 구리 + “살 거면 사고…” */
const OfferScene: React.FC = () => (
  <AbsoluteFill>
    <KenBurns src="img/s3_offer.jpg" dur={64} from={1.05} to={1.1} origin="40% 70%" />
    <PaperGrain />
    <Stamp text={TEXT.bad} x={560} y={780} delay={10} size={120} />
    <Bubble text={TEXT.merchantSays} x={600} y={70} delay={22} size={60} />
    <HandLabel text={TEXT.messenger} x={1330} y={930} size={56} delay={38} rotate={-2} />
  </AbsoluteFill>
);

/* 4. 화난 난니 — 점토판에 항의 */
const AngryScene: React.FC = () => {
  const frame = useCurrentFrame();
  const A = SCENES.angry[0];
  const shoutOut = interpolate(frame, [s(10.9) - A, s(11.2) - A], [1, 0], clamp);
  return (
    <AbsoluteFill>
      <KenBurns src="img/s4_angry.jpg" dur={154} from={1.04} to={1.16} origin="55% 40%" />
      <PaperGrain />
      <HandLabel text={TEXT.nanni} x={1390} y={200} size={72} delay={s(7.7) - A} check rotate={3} />
      <Arrow d="M 1380 250 C 1320 250, 1280 270, 1240 300" head={{ x: 1240, y: 300, angle: 150 }} delay={s(7.95) - A} />
      <Sticker src="stickers/tablet.png" x={1500} y={520} w={330} delay={s(8.4) - A} rotate={8} />
      <HandLabel text={TEXT.tablet} x={1330} y={890} size={58} delay={s(8.65) - A} rotate={-3} />
      <div style={{ opacity: shoutOut }}>
        <Shout text={TEXT.shout} x={250} y={590} delay={s(9.28) - A} size={140} />
      </div>
      <HandLabel text={TEXT.stylus} x={110} y={330} size={60} delay={s(11.0) - A} rotate={-4} check />
      <Arrow d="M 330 400 C 420 430, 560 440, 650 430" head={{ x: 650, y: 430, angle: -5 }} delay={s(11.25) - A} />
    </AbsoluteFill>
  );
};

/* 5. 시간 점프 — 3,750년 뒤 */
const NightScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const stars = new Array(46).fill(0).map((_, i) => ({
    x: random(`sx${i}`) * width,
    y: random(`sy${i}`) * height,
    r: 3 + random(`sr${i}`) * 7,
    ph: random(`sp${i}`) * 6,
  }));
  const shoot = interpolate(frame, [4, 26], [0, 1], { ...clamp, easing: Easing.out(Easing.quad) });
  return (
    <AbsoluteFill style={{ background: "radial-gradient(ellipse at 50% 40%, #1d2f6b 0%, #101a40 60%, #0a1030 100%)" }}>
      <svg width={width} height={height} style={{ position: "absolute" }}>
        {stars.map((st, i) => (
          <path
            key={i}
            transform={`translate(${st.x} ${st.y}) scale(${st.r / 10})`}
            d="M0 -10 L2.4 -3 L10 -3 L4 1.6 L6.2 9 L0 4.6 L-6.2 9 L-4 1.6 L-10 -3 L-2.4 -3 Z"
            fill="#f6c945"
            opacity={0.55 + 0.45 * Math.sin(frame / 5 + st.ph)}
          />
        ))}
        <path
          d={`M 260 220 L ${260 + 520 * shoot} ${220 + 150 * shoot}`}
          stroke="#fffbe8"
          strokeWidth={4}
          strokeDasharray="14 12"
          strokeLinecap="round"
        />
        <circle cx={1580} cy={230} r={86} fill="#f3e3b3" />
        <circle cx={1620} cy={205} r={80} fill="#15225a" />
      </svg>
      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center" }}>
        <Ransom chars={TEXT.titleLater} size={170} seed="later" delay={3} stagger={3} />
      </AbsoluteFill>
      <PaperGrain opacity={0.12} />
    </AbsoluteFill>
  );
};

/* 6. 오늘날 — 별점 1개의 조상 */
const PhoneScene: React.FC = () => (
  <AbsoluteFill>
    <KenBurns src="img/s7_phone.jpg" dur={128} from={1.03} to={1.1} origin="62% 55%" />
    <PaperGrain />
    <HandLabel text={TEXT.oldest} x={930} y={170} size={64} delay={s(13.5) - SCENES.phone[0]} check rotate={-2} />
    <Stamp text={TEXT.guinness} x={1060} y={850} delay={s(14.3) - SCENES.phone[0]} size={72} rotate={-7} color="#b8321f" paper />
    <HandLabel text={TEXT.size} x={980} y={300} size={44} delay={s(15.2) - SCENES.phone[0]} rotate={1} bg="rgba(246,174,45,0.95)" />
  </AbsoluteFill>
);

/* 7. 발굴 + 뒷담 한 스푼 */
const DigScene: React.FC = () => (
  <AbsoluteFill>
    <KenBurns src="img/s6_dig.jpg" dur={120} from={1.04} to={1.1} origin="30% 50%" />
    <PaperGrain />
    <HandLabel text={TEXT.digTitle} x={880} y={380} size={56} delay={10} rotate={-2} />
    <HandLabel text={TEXT.digGossip} x={180} y={920} size={58} delay={34} rotate={-1} bg="rgba(246,174,45,0.96)" check />
    <Arrow d="M 520 900 C 520 820, 540 720, 560 660" head={{ x: 560, y: 660, angle: -80 }} delay={42} />
  </AbsoluteFill>
);

/* 8. 팩트 체크 + 교과서 연결 카드 */
const CardScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const qIn = spring({ frame: frame - 70, fps, config: { damping: 14 } });
  return (
    <AbsoluteFill style={{ background: "#efe4c8" }}>
      <PaperGrain opacity={0.22} />
      <div style={{ position: "absolute", left: 110, top: 150, width: 820 }}>
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
                fontSize: 40,
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
          width: 760,
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
          “{TEXT.textbookQuote}”
        </div>
        <div style={{ fontFamily: BODY, fontWeight: 500, fontSize: 26, color: "#6b5a44", marginTop: 12 }}>
          — 중학교 역사 교과서 Ⅱ단원 「문명의 발생」 (22쪽)
        </div>
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
        출처: 영국박물관 소장품 131236 · A. L. Oppenheim, Letters from Mesopotamia(1967) · 기네스 세계 기록
      </div>
    </AbsoluteFill>
  );
};

/* 타이틀(랜섬 노트) — 가운데에서 등장 후 우상단 배지로 이동 */
const TitleBadge: React.FC = () => {
  const frame = useCurrentFrame();
  const t = interpolate(frame, [38, 58], [0, 1], { ...clamp, easing: Easing.inOut(Easing.cubic) });
  const hide = frame >= SCENES.night[0] + 10;
  if (hide) return null;
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
      <Ransom chars={TEXT.titleThen} size={160} seed="then" delay={6} stagger={4} />
    </div>
  );
};

const NowBadge: React.FC = () => (
  <div style={{ position: "absolute", right: 60, top: 50 }}>
    <Ransom chars={TEXT.badgeNow} size={70} seed="now" delay={6} stagger={4} />
  </div>
);

export const Main: React.FC = () => {
  return (
    <AbsoluteFill style={{ backgroundColor: "#1b1714" }}>
      <Scene k="ur" tear={false}>
        <UrScene />
      </Scene>
      <Scene k="merchant">
        <MerchantScene />
      </Scene>
      <Scene k="offer">
        <OfferScene />
      </Scene>
      <Scene k="angry">
        <AngryScene />
      </Scene>
      <Scene k="night">
        <NightScene />
      </Scene>
      <Scene k="phone">
        <PhoneScene />
      </Scene>
      <Scene k="dig">
        <DigScene />
      </Scene>
      <Scene k="card">
        <CardScene />
      </Scene>

      <TitleBadge />
      <Sequence from={SCENES.phone[0] + 10} durationInFrames={SCENES.phone[1] - SCENES.phone[0] - 10}>
        <NowBadge />
      </Sequence>
      <BrandBadge />

      <Sequence from={s(NARRATION_OFFSET)}>
        <Audio src={staticFile("audio/narration.mp3")} />
      </Sequence>
    </AbsoluteFill>
  );
};
