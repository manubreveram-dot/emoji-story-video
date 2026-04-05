import { interpolate } from "remotion";
import type React from "react";

export function getParallaxStyle(
  frame: number,
  durationInFrames: number,
): React.CSSProperties {
  const translateY = interpolate(frame, [0, durationInFrames], [0, -30], {
    extrapolateRight: "clamp",
  });
  const scale = interpolate(frame, [0, durationInFrames], [1.1, 1.15], {
    extrapolateRight: "clamp",
  });

  return {
    transform: `scale(${scale}) translateY(${translateY}px)`,
  };
}
