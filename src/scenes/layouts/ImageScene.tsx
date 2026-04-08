import React from "react";
import { AbsoluteFill } from "remotion";
import type { SceneBlueprint } from "../../types/scene";
import { AnimatedImage } from "../../components/AnimatedImage";
import { Background } from "../../components/Background";
import { StoryCaption } from "../../components/StoryCaption";

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
          padding: "56px 44px 78px",
        }}
      >
        <div />

        <StoryCaption
          text={scene.text}
          emojis={scene.emojis}
          textAnimation={scene.textAnimation}
          emojiAnimation={scene.emojiAnimation}
          tone="dark"
          align="left"
        />
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
