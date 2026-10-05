import { Composition } from "remotion";
import { DURATION, FPS } from "./copy";
import { FontGate } from "./fonts";
import { Main } from "./Main";
import { Reels } from "./Reels";

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
    </>
  );
};
