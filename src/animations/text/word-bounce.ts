import { spring, interpolate } from "remotion";
import { SPRING_CONFIGS } from "../easing";
import type React from "react";

export function getWordBounceStyles(
  frame: number,
  fps: number,
  text: string,
): Array<{ word: string; style: React.CSSProperties }> {
  const words = text.split(/\s+/);
  const delayPerWord = 6;

  return words.map((word, index) => {
    const progress = spring({
      frame: frame - index * delayPerWord,
      fps,
      config: SPRING_CONFIGS.bouncy,
    });

    const translateY = interpolate(progress, [0, 1], [30, 0]);
    const scale = interpolate(progress, [0, 1], [0.5, 1]);
    const opacity = interpolate(progress, [0, 1], [0, 1], {
      extrapolateRight: "clamp",
    });

    return {
      word,
      style: {
        display: "inline-block",
        transform: `translateY(${translateY}px) scale(${scale})`,
        opacity,
        marginRight: "12px",
      },
    };
  });
}
