import React from "react";
import { AbsoluteFill } from "remotion";
import type { SceneBlueprint } from "../../types/scene";
import { AnimatedImage } from "../../components/AnimatedImage";
import { Background } from "../../components/Background";
import { StoryCaption } from "../../components/StoryCaption";

export const ImageTextScene: React.FC<{ scene: SceneBlueprint }> = ({ scene }) => {
  const hasImage = scene.imageUrl && scene.imageUrl.length > 0;

  return (
    <AbsoluteFill style={{ backgroundColor: "#ffffff" }}>
      <div
        style={{
          position: "absolute",
          top: 36,
          left: 36,
          right: 36,
          height: "58%",
          borderRadius: 38,
          overflow: "hidden",
          boxShadow: "0 24px 58px rgba(0, 0, 0, 0.22)",
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

      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 0,
          height: "44%",
          borderTopLeftRadius: 42,
          borderTopRightRadius: 42,
          background:
            "linear-gradient(180deg, rgba(255,255,255,0.94), rgba(248,250,255,0.98))",
          borderTop: "1px solid rgba(66, 133, 244, 0.25)",
          padding: "36px 42px 38px",
        }}
      >
        <StoryCaption
          text={scene.text}
          emojis={scene.emojis}
          textAnimation={scene.textAnimation}
          emojiAnimation={scene.emojiAnimation}
          tone="light"
          align="left"
          compact
        />
      </div>
    </AbsoluteFill>
  );
};
