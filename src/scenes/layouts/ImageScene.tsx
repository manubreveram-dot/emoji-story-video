import React from "react";
import { AbsoluteFill } from "remotion";
import type { SceneBlueprint } from "../../types/scene";
import { AnimatedImage } from "../../components/AnimatedImage";
import { AnimatedText } from "../../components/AnimatedText";
import { GlassPanel } from "../../components/GlassPanel";
import { Background } from "../../components/Background";

export const ImageScene: React.FC<{ scene: SceneBlueprint }> = ({ scene }) => {
  const hasImage = scene.imageUrl && scene.imageUrl.length > 0;

  return (
    <AbsoluteFill>
      {hasImage ? (
        <AnimatedImage
          src={scene.imageUrl!}
          animation={scene.imageAnimation || "ken-burns-in"}
        />
      ) : (
        <Background palette={scene.palette} animation={scene.backgroundAnimation} />
      )}

      {/* Text overlay at bottom */}
      <AbsoluteFill
        style={{
          display: "flex",
          alignItems: "flex-end",
          justifyContent: "center",
          padding: "0 40px 120px 40px",
        }}
      >
        <GlassPanel
          style={{
            backgroundColor: "rgba(0, 0, 0, 0.45)",
            backdropFilter: "blur(20px)",
          }}
        >
          <AnimatedText
            text={scene.text}
            animation={scene.textAnimation}
            color="#FFFFFF"
            fontSize={52}
            delay={15}
          />
        </GlassPanel>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
