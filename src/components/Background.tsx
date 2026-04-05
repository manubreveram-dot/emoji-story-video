import React from "react";
import { useCurrentFrame, useVideoConfig, AbsoluteFill } from "remotion";
import type { BackgroundAnimation } from "../types/scene";
import type { ColorPalette } from "../types/theme";
import { GradientShift } from "../animations/background/gradient-shift";
import { Particles } from "../animations/background/particles";
import { Waves } from "../animations/background/waves";

type BackgroundProps = {
  palette: ColorPalette;
  animation: BackgroundAnimation;
};

export const Background: React.FC<BackgroundProps> = ({ palette, animation }) => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();

  switch (animation) {
    case "particles":
      return <Particles palette={palette} frame={frame} width={width} height={height} />;
    case "waves":
      return <Waves palette={palette} frame={frame} width={width} height={height} />;
    case "gradient-shift":
      return <GradientShift palette={palette} frame={frame} />;
    case "none":
    default:
      return (
        <AbsoluteFill
          style={{
            background: `linear-gradient(180deg, ${palette.background}, ${palette.backgroundEnd})`,
          }}
        />
      );
  }
};
