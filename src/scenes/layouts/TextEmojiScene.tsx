import React from "react";
import { AbsoluteFill } from "remotion";
import type { SceneBlueprint } from "../../types/scene";
import { Background } from "../../components/Background";
import { AnimatedText } from "../../components/AnimatedText";
import { AnimatedEmoji } from "../../components/AnimatedEmoji";
import { GlassPanel } from "../../components/GlassPanel";

export const TextEmojiScene: React.FC<{ scene: SceneBlueprint }> = ({ scene }) => {
  return (
    <AbsoluteFill>
      <Background palette={scene.palette} animation={scene.backgroundAnimation} />
      <AbsoluteFill
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "60px 40px",
          gap: 60,
        }}
      >
        {/* Text area - top 60% */}
        <div style={{ flex: 6, display: "flex", alignItems: "center" }}>
          <GlassPanel>
            <AnimatedText
              text={scene.text}
              animation={scene.textAnimation}
              color={scene.palette.text}
              fontSize={56}
              delay={10}
            />
          </GlassPanel>
        </div>

        {/* Emoji area - bottom 40% */}
        <div
          style={{
            flex: 4,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 30,
          }}
        >
          {scene.emojis.slice(0, 3).map((emoji, i) => (
            <AnimatedEmoji
              key={i}
              emoji={emoji}
              animation={scene.emojiAnimation}
              size={100}
              delay={20 + i * 12}
            />
          ))}
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
