import { interpolate } from "remotion";
import type React from "react";

export function getKenBurnsInStyle(
  frame: number,
  durationInFrames: number,
): React.CSSProperties {
  const scale = interpolate(frame, [0, durationInFrames], [1.0, 1.2], {
    extrapolateRight: "clamp",
  });
  const translateX = interpolate(frame, [0, durationInFrames], [0, -20], {
    extrapolateRight: "clamp",
  });
  const translateY = interpolate(frame, [0, durationInFrames], [0, -10], {
    extrapolateRight: "clamp",
  });

  return {
    transform: `scale(${scale}) translate(${translateX}px, ${translateY}px)`,
  };
}

export function getKenBurnsOutStyle(
  frame: number,
  durationInFrames: number,
): React.CSSProperties {
  const scale = interpolate(frame, [0, durationInFrames], [1.2, 1.0], {
    extrapolateRight: "clamp",
  });
  const translateX = interpolate(frame, [0, durationInFrames], [-15, 0], {
    extrapolateRight: "clamp",
  });
  const translateY = interpolate(frame, [0, durationInFrames], [-10, 0], {
    extrapolateRight: "clamp",
  });

  return {
    transform: `scale(${scale}) translate(${translateX}px, ${translateY}px)`,
  };
}
