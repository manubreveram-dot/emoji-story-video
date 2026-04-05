import { spring, interpolate } from "remotion";
import { SPRING_CONFIGS } from "../easing";
import type React from "react";

export function getScaleInStyles(
  frame: number,
  fps: number,
  text: string,
): Array<{ word: string; style: React.CSSProperties }> {
  const words = text.split(/\s+/);
  const delayPerWord = 8;

  return words.map((word, index) => {
    const progress = spring({
      frame: frame - index * delayPerWord,
      fps,
      config: SPRING_CONFIGS.snappy,
    });

    const scale = interpolate(progress, [0, 1], [0.3, 1]);
    const opacity = interpolate(progress, [0, 1], [0, 1], {
      extrapolateRight: "clamp",
    });

    return {
      word,
      style: {
        display: "inline-block",
        transform: `scale(${scale})`,
        opacity,
        marginRight: "12px",
      },
    };
  });
}
