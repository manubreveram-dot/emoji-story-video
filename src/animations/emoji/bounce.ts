import { spring, interpolate } from "remotion";
import { SPRING_CONFIGS } from "../easing";
import type React from "react";

export function getEmojiBounceStyle(
  frame: number,
  fps: number,
  delay: number = 0,
): React.CSSProperties {
  const entrance = spring({
    frame: frame - delay,
    fps,
    config: SPRING_CONFIGS.bouncy,
  });

  const entranceScale = interpolate(entrance, [0, 1], [0, 1]);
  const loopBounce = Math.abs(Math.sin((frame - delay) / 25)) * 15;
  const opacity = interpolate(entrance, [0, 0.3], [0, 1], {
    extrapolateRight: "clamp",
  });

  return {
    transform: `scale(${entranceScale}) translateY(${-loopBounce}px)`,
    opacity,
  };
}
