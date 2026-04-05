import React from "react";
import { AbsoluteFill } from "remotion";
import type { SceneBlueprint } from "../../types/scene";
import { Background } from "../../components/Background";
import { AnimatedText } from "../../components/AnimatedText";
import { AnimatedEmoji } from "../../components/AnimatedEmoji";

export const SplitScene: React.FC<{ scene: SceneBlueprint }> = ({ scene }) => {
  return (
    <AbsoluteFill>
      <Background palette={scene.palette} animation={scene.backgroundAnimation} />
      <AbsoluteFill
        style={{
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* Top half: text */}
        <div
          style={{
            flex: 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "40px",
          }}
        >
          <AnimatedText
            text={scene.text}
            animation={scene.textAnimation}
            color={scene.palette.text}
            fontSize={52}
            delay={10}
          />
        </div>

        {/* Divider */}
        <div
          style={{
            height: 3,
            margin: "0 80px",
            backgroundColor: scene.palette.accent,
            opacity: 0.4,
            borderRadius: 2,
          }}
        />

        {/* Bottom half: emojis */}
        <div
          style={{
            flex: 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 40,
          }}
        >
          {scene.emojis.slice(0, 3).map((emoji, i) => (
            <AnimatedEmoji
              key={i}
              emoji={emoji}
              animation={scene.emojiAnimation}
              size={100}
              delay={25 + i * 15}
            />
          ))}
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
