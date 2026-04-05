import { interpolate, spring } from "remotion";
import type React from "react";

export function getSlideRevealStyle(
  frame: number,
  fps: number,
): React.CSSProperties {
  const progress = spring({
    frame,
    fps,
    config: { damping: 200 },
    durationInFrames: fps, // 1 second reveal
  });

  const clipPercent = interpolate(progress, [0, 1], [100, 0]);

  return {
    clipPath: `inset(0 ${clipPercent}% 0 0)`,
    transform: `scale(1.05)`,
  };
}
