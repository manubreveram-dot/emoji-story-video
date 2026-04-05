import { spring, interpolate } from "remotion";
import { SPRING_CONFIGS } from "../easing";
import type React from "react";

export function getFadeUpStyle(
  frame: number,
  fps: number,
  delay: number = 0,
): React.CSSProperties {
  const progress = spring({
    frame: frame - delay,
    fps,
    config: SPRING_CONFIGS.smooth,
  });

  const translateY = interpolate(progress, [0, 1], [40, 0]);
  const opacity = interpolate(progress, [0, 1], [0, 1], {
    extrapolateRight: "clamp",
  });
  const scale = interpolate(progress, [0, 1], [0.97, 1]);

  return {
    transform: `translateY(${translateY}px) scale(${scale})`,
    opacity,
  };
}
