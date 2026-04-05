import { spring, interpolate } from "remotion";
import { SPRING_CONFIGS } from "../easing";
import type React from "react";

export function getEmojiFloatStyle(
  frame: number,
  fps: number,
  delay: number = 0,
): React.CSSProperties {
  const entrance = spring({
    frame: frame - delay,
    fps,
    config: SPRING_CONFIGS.gentle,
  });

  const floatY = Math.sin((frame - delay) / 25) * 20;
  const floatRotate = Math.sin((frame - delay) / 40) * 5;
  const scale = interpolate(entrance, [0, 1], [0, 1]);
  const opacity = interpolate(entrance, [0, 0.3], [0, 1], {
    extrapolateRight: "clamp",
  });

  return {
    transform: `scale(${scale}) translateY(${floatY}px) rotate(${floatRotate}deg)`,
    opacity,
  };
}
