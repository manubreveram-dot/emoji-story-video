import { interpolate } from "remotion";

export function getTypewriterStyle(
  frame: number,
  fps: number,
  text: string,
): { visibleText: string; showCursor: boolean } {
  const charsPerSecond = 15;
  const totalFrames = (text.length / charsPerSecond) * fps;

  const charCount = Math.floor(
    interpolate(frame, [0, totalFrames], [0, text.length], {
      extrapolateRight: "clamp",
      extrapolateLeft: "clamp",
    }),
  );

  const visibleText = text.slice(0, charCount);
  const showCursor = frame % (fps / 2) < fps / 4; // Blinking cursor

  return { visibleText, showCursor };
}
