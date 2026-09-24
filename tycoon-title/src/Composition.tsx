import { loadFont } from "@remotion/google-fonts/NotoSansKR";
import {
  AbsoluteFill,
  Composition,
  Easing,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

const { fontFamily } = loadFont("normal", { weights: ["900"] });

// 제목 등장: 0.3초 안에 아래 44px·72%·투명 → 제자리·100%·불투명.
// damping 12.5 스프링은 도착할 때 약 8% 넘쳤다가 되돌아온다.
const POP = Easing.spring({ damping: 12.5 });

export const MyComposition = () => {
  return (
    <Composition
      id="TitlePop"
      component={TitlePop}
      durationInFrames={180}
      fps={60}
      width={1920}
      height={1080}
    />
  );
};

export const TitlePop: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  return (
    <AbsoluteFill
      style={{
        backgroundColor: "#f5f8ff",
        justifyContent: "center",
        alignItems: "center",
        fontFamily,
      }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 24,
          color: "#1e2f5c",
          fontWeight: 900,
          textAlign: "center",
          opacity: interpolate(frame, [0, 0.3 * fps], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          }),
          translate: interpolate(frame, [0, 0.3 * fps], ["0px 44px", "0px 0px"], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
            easing: POP,
          }),
          scale: interpolate(frame, [0, 0.3 * fps], [0.72, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
            easing: POP,
            output: "perceptual-scale",
          }),
        }}
      >
        <div style={{ fontSize: 160, lineHeight: 1.1 }}>교실을 국가로!</div>
        <div style={{ fontSize: 96, lineHeight: 1.1, color: "#0ea5e9" }}>
          교실 경제 운영하기
        </div>
      </div>
    </AbsoluteFill>
  );
};
