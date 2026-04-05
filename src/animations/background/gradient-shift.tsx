import React from "react";
import { AbsoluteFill, interpolate } from "remotion";
import type { ColorPalette } from "../../types/theme";

export const GradientShift: React.FC<{
  palette: ColorPalette;
  frame: number;
}> = ({ palette, frame }) => {
  const angle = interpolate(frame, [0, 300], [0, 360], {
    extrapolateRight: "extend",
  });

  return (
    <AbsoluteFill
      style={{
        background: `linear-gradient(${angle}deg, ${palette.background}, ${palette.backgroundEnd})`,
      }}
    />
  );
};
