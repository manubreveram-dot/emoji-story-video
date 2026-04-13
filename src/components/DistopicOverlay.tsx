import React from "react";
import { AbsoluteFill } from "remotion";

function pickAccent(seed: string): string {
  let hash = 0;
  for (let index = 0; index < seed.length; index++) {
    hash = (hash + seed.charCodeAt(index) * (index + 3)) % 997;
  }

  return hash % 2 === 0 ? "#ff3b30" : "#3b82f6";
}

type DistopicOverlayProps = {
  seed: string;
  label?: string;
  subtle?: boolean;
};

export const DistopicOverlay: React.FC<DistopicOverlayProps> = ({
  seed,
  label = "SYSTEM ACTIVE",
  subtle = false,
}) => {
  const accent = pickAccent(seed);

  return (
    <>
      <AbsoluteFill
        style={{
          background:
            subtle
              ? "linear-gradient(180deg, rgba(0,0,0,0.08) 0%, rgba(0,0,0,0.26) 100%)"
              : "linear-gradient(180deg, rgba(0,0,0,0.16) 0%, rgba(0,0,0,0.54) 100%)",
          mixBlendMode: "multiply",
          pointerEvents: "none",
        }}
      />
      <AbsoluteFill
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.045) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)",
          backgroundSize: "100% 28px, 28px 100%",
          opacity: subtle ? 0.12 : 0.18,
          pointerEvents: "none",
        }}
      />
      <AbsoluteFill
        style={{
          background:
            "repeating-linear-gradient(180deg, rgba(255,255,255,0.04) 0px, rgba(255,255,255,0.04) 1px, transparent 1px, transparent 5px)",
          opacity: subtle ? 0.08 : 0.14,
          mixBlendMode: "screen",
          pointerEvents: "none",
        }}
      />
      <div
        style={{
          position: "absolute",
          top: 28,
          left: 28,
          padding: "10px 16px",
          border: `1px solid ${accent}66`,
          backgroundColor: "rgba(0,0,0,0.46)",
          color: "#f4f4f5",
          fontFamily: "\"Inter\", sans-serif",
          fontSize: 18,
          letterSpacing: 3.2,
          textTransform: "uppercase",
          boxShadow: `0 0 24px ${accent}22`,
        }}
      >
        {label}
      </div>
      <div
        style={{
          position: "absolute",
          top: 28,
          right: 28,
          width: 84,
          height: 84,
          borderRadius: 999,
          border: `1px solid ${accent}66`,
          boxShadow: `0 0 30px ${accent}22`,
          opacity: subtle ? 0.35 : 0.55,
        }}
      />
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 0,
          height: 4,
          background: `linear-gradient(90deg, transparent 0%, ${accent} 14%, transparent 48%, ${accent} 78%, transparent 100%)`,
          opacity: subtle ? 0.45 : 0.75,
        }}
      />
    </>
  );
};
