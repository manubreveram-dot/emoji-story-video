import React from "react";
import { AbsoluteFill } from "remotion";
import type { SceneBlueprint } from "../../types/scene";
import { AnimatedImage } from "../../components/AnimatedImage";
import { AnimatedText } from "../../components/AnimatedText";
import { AnimatedEmoji } from "../../components/AnimatedEmoji";
import { Background } from "../../components/Background";

export const ImageTextScene: React.FC<{ scene: SceneBlueprint }> = ({ scene }) => {
  const hasImage = scene.imageUrl && scene.imageUrl.length > 0;

  return (
    <AbsoluteFill>
      {/* Top 60%: Image */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: "60%",
          overflow: "hidden",
        }}
      >
        {hasImage ? (
          <AnimatedImage
            src={scene.imageUrl!}
            animation={scene.imageAnimation || "parallax"}
          />
        ) : (
          <Background palette={scene.palette} animation={scene.backgroundAnimation} />
        )}
      </div>

      {/* Bottom 40%: Text + Emojis */}
      <div
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          height: "40%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "30px 40px",
          gap: 24,
          background: `linear-gradient(180deg, ${scene.palette.background}, ${scene.palette.backgroundEnd})`,
        }}
      >
        <AnimatedText
          text={scene.text}
          animation={scene.textAnimation}
          color={scene.palette.text}
          fontSize={48}
          delay={10}
        />
        <div style={{ display: "flex", gap: 20 }}>
          {scene.emojis.slice(0, 3).map((emoji, i) => (
            <AnimatedEmoji
              key={i}
              emoji={emoji}
              animation={scene.emojiAnimation}
              size={60}
              delay={20 + i * 8}
            />
          ))}
        </div>
      </div>
    </AbsoluteFill>
  );
};
