import React from "react";
import { AbsoluteFill } from "remotion";
import type { SceneBlueprint } from "../../types/scene";
import { Background } from "../../components/Background";
import { AnimatedText } from "../../components/AnimatedText";

export const MinimalScene: React.FC<{ scene: SceneBlueprint }> = ({ scene }) => {
  return (
    <AbsoluteFill>
      <Background palette={scene.palette} animation="gradient-shift" />
      <AbsoluteFill
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "60px 50px",
        }}
      >
        <AnimatedText
          text={scene.text}
          animation={scene.textAnimation}
          color={scene.palette.text}
          fontSize={64}
          fontWeight="600"
          delay={10}
        />
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
