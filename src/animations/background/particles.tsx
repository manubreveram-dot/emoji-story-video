import React from "react";
import { AbsoluteFill } from "remotion";
import type { ColorPalette } from "../../types/theme";

function seededRandom(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 16807 + 0) % 2147483647;
    return s / 2147483647;
  };
}

export const Particles: React.FC<{
  palette: ColorPalette;
  frame: number;
  width: number;
  height: number;
  count?: number;
}> = ({ palette, frame, width, height, count = 20 }) => {
  const rng = seededRandom(123);

  const particles = Array.from({ length: count }, (_, i) => {
    const baseX = rng() * width;
    const baseY = rng() * height;
    const radius = 4 + rng() * 6;
    const periodX = 80 + rng() * 120;
    const periodY = 60 + rng() * 100;
    const phaseX = rng() * Math.PI * 2;
    const phaseY = rng() * Math.PI * 2;
    const amplitudeX = 20 + rng() * 40;
    const amplitudeY = 15 + rng() * 30;

    const x = baseX + Math.sin(frame / periodX + phaseX) * amplitudeX;
    const y = baseY + Math.cos(frame / periodY + phaseY) * amplitudeY;
    const opacity = 0.3 + 0.3 * Math.sin(frame / 40 + i);

    return (
      <div
        key={i}
        style={{
          position: "absolute",
          left: x,
          top: y,
          width: radius * 2,
          height: radius * 2,
          borderRadius: "50%",
          backgroundColor: palette.particle,
          opacity,
        }}
      />
    );
  });

  return (
    <AbsoluteFill
      style={{
        background: `linear-gradient(180deg, ${palette.background}, ${palette.backgroundEnd})`,
      }}
    >
      {particles}
    </AbsoluteFill>
  );
};
