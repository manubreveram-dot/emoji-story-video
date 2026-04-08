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
          justifyContent: "space-between",
          padding: "80px 52px 92px",
        }}
      >
        <div />

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 28,
            alignItems: "flex-start",
          }}
        >
          <div style={{ display: "flex", gap: 16 }}>
            {scene.emojis.slice(0, 3).map((emoji, index) => (
              <AnimatedEmoji
                key={`${emoji}-${index}`}
                emoji={emoji}
                animation={scene.emojiAnimation}
                size={92}
                delay={index * 8}
              />
            ))}
          </div>

          <AnimatedText
            text={scene.text}
            animation={scene.textAnimation}
            color={scene.palette.text}
            fontSize={94}
            fontWeight="800"
            delay={12}
            textAlign="left"
            maxWidth={980}
            letterSpacing={0.5}
            lineHeight={1.08}
          />
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
