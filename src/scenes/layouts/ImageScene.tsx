import React from "react";
import { AbsoluteFill } from "remotion";
import type { SceneBlueprint } from "../../types/scene";
import { AnimatedImage } from "../../components/AnimatedImage";
import { AnimatedText } from "../../components/AnimatedText";
import { AnimatedEmoji } from "../../components/AnimatedEmoji";
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

      <AbsoluteFill
        style={{
          background:
            "linear-gradient(180deg, rgba(0, 0, 0, 0.08) 0%, rgba(0, 0, 0, 0.6) 80%)",
        }}
      />

      <AbsoluteFill
        style={{
          justifyContent: "space-between",
          padding: "64px 52px 94px",
        }}
      >
        <div />

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 28,
            alignItems: "flex-start",
            width: "100%",
          }}
        >
          <AnimatedText
            text={scene.text}
            animation={scene.textAnimation}
            color="#ffffff"
            fontSize={74}
            fontWeight="800"
            delay={8}
            textAlign="left"
            maxWidth={980}
            letterSpacing={0.5}
            lineHeight={1.14}
            textShadow="0 18px 34px rgba(0, 0, 0, 0.35)"
          />

          <div style={{ display: "flex", gap: 16 }}>
            {scene.emojis.slice(0, 3).map((emoji, index) => (
              <AnimatedEmoji
                key={`${emoji}-${index}`}
                emoji={emoji}
                animation={scene.emojiAnimation}
                size={64}
                delay={16 + index * 8}
              />
            ))}
          </div>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
