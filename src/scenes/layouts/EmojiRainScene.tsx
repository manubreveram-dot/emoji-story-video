import React from "react";
import { AbsoluteFill } from "remotion";
import type { SceneBlueprint } from "../../types/scene";
import { Background } from "../../components/Background";
import { AnimatedText } from "../../components/AnimatedText";
import { EmojiRain } from "../../components/EmojiRain";
import { GlassPanel } from "../../components/GlassPanel";

export const EmojiRainScene: React.FC<{ scene: SceneBlueprint }> = ({ scene }) => {
  return (
    <AbsoluteFill>
      <Background palette={scene.palette} animation={scene.backgroundAnimation} />
      <EmojiRain emojis={scene.emojis} count={18} />
      <AbsoluteFill
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "0 50px",
        }}
      >
        <GlassPanel
          style={{
            backgroundColor: "rgba(0, 0, 0, 0.3)",
            backdropFilter: "blur(20px)",
          }}
        >
          <AnimatedText
            text={scene.text}
            animation={scene.textAnimation}
            color="#FFFFFF"
            fontSize={60}
            delay={15}
          />
        </GlassPanel>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
