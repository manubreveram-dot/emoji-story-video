import { interpolate } from "remotion";
import type React from "react";

export type RainDrop = {
  emoji: string;
  x: number;
  style: React.CSSProperties;
};

function seededRandom(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 16807 + 0) % 2147483647;
    return s / 2147483647;
  };
}

export function getEmojiRainDrops(
  frame: number,
  fps: number,
  emojis: string[],
  count: number = 15,
  screenHeight: number = 1920,
): RainDrop[] {
  const rng = seededRandom(42);
  const fallDuration = 3 * fps; // 3 seconds to fall

  return Array.from({ length: count }, (_, i) => {
    const x = rng() * 100; // percentage
    const staggerDelay = Math.floor(rng() * 2 * fps);
    const emojiIdx = Math.floor(rng() * emojis.length);
    const size = 0.6 + rng() * 0.8;
    const rotation = rng() * 360;
    const rotSpeed = (rng() - 0.5) * 4;

    const localFrame = frame - staggerDelay;
    const loopFrame = localFrame >= 0 ? localFrame % (fallDuration + fps) : -1;

    const y =
      loopFrame >= 0
        ? interpolate(loopFrame, [0, fallDuration], [-100, screenHeight + 100], {
            extrapolateRight: "clamp",
          })
        : -200;

    const currentRotation = rotation + (loopFrame >= 0 ? loopFrame * rotSpeed : 0);
    const opacity = loopFrame >= 0 ? 1 : 0;

    return {
      emoji: emojis[emojiIdx] || emojis[0],
      x,
      style: {
        position: "absolute" as const,
        left: `${x}%`,
        top: `${y}px`,
        fontSize: `${size * 60}px`,
        transform: `rotate(${currentRotation}deg)`,
        opacity,
        pointerEvents: "none" as const,
      },
    };
  });
}
