import { Composition } from "remotion";
import { DURATION, FPS } from "./copy";
import { Ep2Main } from "./ep2/Main";
import { ALL_TEXT as EP2_TEXT, CAPTIONS as EP2_CAPTIONS, DURATION as EP2_DURATION } from "./ep2/copy";
import { FontGate } from "./fonts";
import { Main } from "./Main";
import { Reels, ReelsFrame } from "./Reels";

// 1화 — 세계 최초의 고객 불만 편지
const MainWithFonts: React.FC = () => (
  <FontGate>
    <Main />
  </FontGate>
);

const ReelsWithFonts: React.FC = () => (
  <FontGate>
    <Reels />
  </FontGate>
);

// 2화 — 피라미드 감독관 메레르의 일지
const Ep2WithFonts: React.FC = () => (
  <FontGate text={EP2_TEXT}>
    <Ep2Main />
  </FontGate>
);

const Ep2ReelsWithFonts: React.FC = () => (
  <FontGate text={EP2_TEXT}>
    <ReelsFrame
      captions={EP2_CAPTIONS}
      series="고대 문명 편"
      headline={["피라미드 공사장에", "업무 일지가 있었다?!"]}
      footer="중학교 역사 · 이집트 문명 × 파피루스"
    >
      <Ep2Main />
    </ReelsFrame>
  </FontGate>
);

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="Dwitdamsa-EaNasir"
        component={MainWithFonts}
        durationInFrames={DURATION * FPS}
        fps={FPS}
        width={1920}
        height={1080}
      />
      <Composition
        id="Dwitdamsa-EaNasir-Reels"
        component={ReelsWithFonts}
        durationInFrames={DURATION * FPS}
        fps={FPS}
        width={1080}
        height={1920}
      />
      <Composition
        id="Dwitdamsa-Merer"
        component={Ep2WithFonts}
        durationInFrames={EP2_DURATION * FPS}
        fps={FPS}
        width={1920}
        height={1080}
      />
      <Composition
        id="Dwitdamsa-Merer-Reels"
        component={Ep2ReelsWithFonts}
        durationInFrames={EP2_DURATION * FPS}
        fps={FPS}
        width={1080}
        height={1920}
      />
    </>
  );
};
