import React from "react";
import { AbsoluteFill } from "remotion";
import type { ColorPalette } from "../../types/theme";

function generateWavePath(
  frame: number,
  width: number,
  baseY: number,
  amplitude: number,
  frequency: number,
  speed: number,
): string {
  const points: string[] = [];
  const steps = 20;

  for (let i = 0; i <= steps; i++) {
    const x = (i / steps) * width;
    const y =
      baseY +
      Math.sin((i / steps) * Math.PI * frequency + frame / speed) * amplitude;
    points.push(i === 0 ? `M ${x} ${y}` : `L ${x} ${y}`);
  }

  // Close path to bottom
  points.push(`L ${width} ${baseY + amplitude + 50}`);
  points.push(`L 0 ${baseY + amplitude + 50}`);
  points.push("Z");

  return points.join(" ");
}

export const Waves: React.FC<{
  palette: ColorPalette;
  frame: number;
  width: number;
  height: number;
}> = ({ palette, frame, width, height }) => {
  const wave1 = generateWavePath(frame, width, height * 0.7, 40, 2, 30);
  const wave2 = generateWavePath(frame, width, height * 0.75, 30, 3, 45);
  const wave3 = generateWavePath(frame, width, height * 0.8, 25, 2.5, 60);

  return (
    <AbsoluteFill
      style={{
        background: `linear-gradient(180deg, ${palette.background}, ${palette.backgroundEnd})`,
      }}
    >
      <svg
        width={width}
        height={height}
        style={{ position: "absolute", top: 0, left: 0 }}
      >
        <path d={wave1} fill={palette.accent} opacity={0.15} />
        <path d={wave2} fill={palette.accent} opacity={0.1} />
        <path d={wave3} fill={palette.particle} opacity={0.08} />
      </svg>
    </AbsoluteFill>
  );
};
