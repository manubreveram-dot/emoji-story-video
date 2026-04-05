import { spring, interpolate } from "remotion";
import { SPRING_CONFIGS } from "../easing";
import type React from "react";

export function getEmojiPulseStyle(
  frame: number,
  fps: number,
  delay: number = 0,
): React.CSSProperties {
  const entrance = spring({
    frame: frame - delay,
    fps,
    config: SPRING_CONFIGS.smooth,
  });

  const pulseScale = 1 + 0.2 * Math.abs(Math.sin(((frame - delay) * Math.PI) / 30));
  const scale = interpolate(entrance, [0, 1], [0, 1]) * pulseScale;
  const opacity = interpolate(entrance, [0, 0.3], [0, 1], {
    extrapolateRight: "clamp",
  });

  return {
    transform: `scale(${scale})`,
    opacity,
  };
}
