import React from "react";
import { AbsoluteFill } from "remotion";
import type { SceneBlueprint } from "../../types/scene";
import { AnimatedImage } from "../../components/AnimatedImage";
import { AnimatedText } from "../../components/AnimatedText";
import { Background } from "../../components/Background";

export const CinematicScene: React.FC<{ scene: SceneBlueprint }> = ({ scene }) => {
  const hasImage = scene.imageUrl && scene.imageUrl.length > 0;
  const barHeight = 200;

  return (
    <AbsoluteFill style={{ backgroundColor: "#000" }}>
      {/* Image in 16:9 area (centered) */}
      <div
        style={{
          position: "absolute",
          top: barHeight,
          left: 0,
          right: 0,
          bottom: barHeight + 160, // extra space for subtitle
          overflow: "hidden",
        }}
      >
        {hasImage ? (
          <AnimatedImage
            src={scene.imageUrl!}
            animation={scene.imageAnimation || "zoom-pulse"}
          />
        ) : (
          <Background palette={scene.palette} animation={scene.backgroundAnimation} />
        )}
      </div>

      {/* Top cinematic bar */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: barHeight,
          backgroundColor: "#000",
        }}
      />

      {/* Bottom cinematic bar */}
      <div
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          height: barHeight + 160,
          backgroundColor: "#000",
        }}
      />

      {/* Subtitle text at bottom */}
      <div
        style={{
          position: "absolute",
          bottom: 60,
          left: 40,
          right: 40,
          display: "flex",
          justifyContent: "center",
        }}
      >
        <AnimatedText
          text={scene.text}
          animation={scene.textAnimation}
          color="#FFFFFF"
          fontSize={44}
          fontWeight="500"
          delay={10}
        />
      </div>
    </AbsoluteFill>
  );
};
