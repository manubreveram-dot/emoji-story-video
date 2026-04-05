import React from "react";
import { AbsoluteFill } from "remotion";
import type { SceneBlueprint } from "../../types/scene";
import { Background } from "../../components/Background";
import { AnimatedText } from "../../components/AnimatedText";
import { AnimatedEmoji } from "../../components/AnimatedEmoji";

export const TitleScene: React.FC<{ scene: SceneBlueprint }> = ({ scene }) => {
  return (
    <AbsoluteFill>
      <Background palette={scene.palette} animation={scene.backgroundAnimation} />
      <AbsoluteFill
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 40,
        }}
      >
        {/* Emojis above text */}
        <div style={{ display: "flex", gap: 24, justifyContent: "center" }}>
          {scene.emojis.slice(0, 3).map((emoji, i) => (
            <AnimatedEmoji
              key={i}
              emoji={emoji}
              animation={scene.emojiAnimation}
              size={140}
              delay={i * 10}
            />
          ))}
        </div>

        {/* Main text */}
        <AnimatedText
          text={scene.text}
          animation={scene.textAnimation}
          color={scene.palette.text}
          fontSize={72}
          fontWeight="700"
          delay={15}
        />
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
