import React from "react";
import { AbsoluteFill } from "remotion";
import type { SceneBlueprint } from "../../types/scene";
import { AnimatedImage } from "../../components/AnimatedImage";
import { Background } from "../../components/Background";
import { StoryCaption } from "../../components/StoryCaption";

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
          bottom: 12,
          height: 368,
          background:
            "linear-gradient(180deg, rgba(2,4,10,0.2) 0%, rgba(2,4,10,0.92) 24%, #02040a 100%)",
          borderTop: "1px solid rgba(255, 255, 255, 0.08)",
          display: "grid",
          alignItems: "stretch",
          padding: "16px 40px 22px",
        }}
      >
        <StoryCaption
          text={scene.text}
          emojis={scene.emojis}
          textAnimation={scene.textAnimation}
          emojiAnimation={scene.emojiAnimation}
          tone="dark"
          align="left"
          compact
          showLabel={false}
        />
      </div>
    </AbsoluteFill>
  );
};
