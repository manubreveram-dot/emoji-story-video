import React from "react";
import { AbsoluteFill } from "remotion";
import type { SceneBlueprint } from "../../types/scene";
import { AnimatedImage } from "../../components/AnimatedImage";
import { AnimatedText } from "../../components/AnimatedText";
import { AnimatedEmoji } from "../../components/AnimatedEmoji";
import { Background } from "../../components/Background";

export const CinematicScene: React.FC<{ scene: SceneBlueprint }> = ({ scene }) => {
  const hasImage = scene.imageUrl && scene.imageUrl.length > 0;
  const barHeight = 128;

  return (
    <AbsoluteFill style={{ backgroundColor: "#02040a" }}>
      <div
        style={{
          position: "absolute",
          top: barHeight,
          left: 0,
          right: 0,
          bottom: barHeight,
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

      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: barHeight,
          background:
            "linear-gradient(180deg, #02040a 0%, rgba(2,4,10,0.94) 72%, rgba(2,4,10,0.5) 100%)",
          borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
        }}
      />

      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 0,
          height: barHeight,
          background:
            "linear-gradient(180deg, rgba(2,4,10,0.5) 0%, rgba(2,4,10,0.95) 30%, #02040a 100%)",
          borderTop: "1px solid rgba(255, 255, 255, 0.08)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 48px",
          gap: 24,
        }}
      >
        <AnimatedText
          text={scene.text}
          animation={scene.textAnimation}
          color="#f8fafc"
          fontSize={62}
          fontWeight="800"
          delay={8}
          textAlign="left"
          maxWidth={900}
          lineHeight={1.14}
          textShadow="0 16px 30px rgba(0, 0, 0, 0.35)"
        />
        <div style={{ display: "flex", gap: 14 }}>
          {scene.emojis.slice(0, 2).map((emoji, index) => (
            <AnimatedEmoji
              key={`${emoji}-${index}`}
              emoji={emoji}
              animation={scene.emojiAnimation}
              size={58}
              delay={14 + index * 8}
            />
          ))}
        </div>
      </div>
    </AbsoluteFill>
  );
};
