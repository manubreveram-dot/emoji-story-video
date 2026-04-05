import { spring, interpolate } from "remotion";
import { SPRING_CONFIGS } from "../easing";
import type React from "react";

export function getSlideInStyles(
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
      config: SPRING_CONFIGS.smooth,
    });

    const direction = index % 2 === 0 ? -60 : 60;
    const translateX = interpolate(progress, [0, 1], [direction, 0]);
    const opacity = interpolate(progress, [0, 1], [0, 1], {
      extrapolateRight: "clamp",
    });

    return {
      word,
      style: {
        display: "inline-block",
        transform: `translateX(${translateX}px)`,
        opacity,
        marginRight: "12px",
      },
    };
  });
}
