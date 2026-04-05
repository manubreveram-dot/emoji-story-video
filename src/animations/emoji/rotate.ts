import { spring, interpolate } from "remotion";
import { SPRING_CONFIGS } from "../easing";
import type React from "react";

export function getEmojiRotateStyle(
  frame: number,
  fps: number,
  delay: number = 0,
): React.CSSProperties {
  const entrance = spring({
    frame: frame - delay,
    fps,
    config: SPRING_CONFIGS.smooth,
  });

  const rotation = interpolate(frame - delay, [0, 90], [0, 360], {
    extrapolateRight: "extend",
  });

  const scale = interpolate(entrance, [0, 1], [0, 1]);
  const opacity = interpolate(entrance, [0, 0.3], [0, 1], {
    extrapolateRight: "clamp",
  });

  return {
    transform: `scale(${scale}) rotate(${rotation}deg)`,
    opacity,
  };
}
