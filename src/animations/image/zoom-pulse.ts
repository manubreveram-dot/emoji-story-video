import type React from "react";

export function getZoomPulseStyle(
  frame: number,
  durationInFrames: number,
): React.CSSProperties {
  const cycle = (frame / durationInFrames) * Math.PI * 2;
  const scale = 1.0 + 0.08 * Math.sin(cycle);

  return {
    transform: `scale(${scale})`,
  };
}
