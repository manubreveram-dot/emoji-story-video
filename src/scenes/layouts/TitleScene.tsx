import React from "react";
import { AbsoluteFill } from "remotion";
import type { SceneBlueprint } from "../../types/scene";
import { Background } from "../../components/Background";
import { AnimatedText } from "../../components/AnimatedText";
import { DistopicOverlay } from "../../components/DistopicOverlay";

export const TitleScene: React.FC<{ scene: SceneBlueprint }> = ({ scene }) => {
  return (
    <AbsoluteFill>
      <Background palette={scene.palette} animation={scene.backgroundAnimation} />
      <DistopicOverlay seed={scene.text} label="CHANNEL // DISTOPIA" />
      <AbsoluteFill
        style={{
          justifyContent: "space-between",
          padding: "120px 62px 110px",
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 14,
          }}
        >
          <div
            style={{
              width: 120,
              height: 4,
              backgroundColor: "rgba(255,255,255,0.8)",
            }}
          />
          <span
            style={{
              color: "rgba(255,255,255,0.72)",
              fontSize: 24,
              letterSpacing: 4,
              textTransform: "uppercase",
              fontFamily: "\"Inter\", sans-serif",
            }}
          >
            Tecnologia que observa y decide
          </span>
        </div>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 30,
            alignItems: "flex-start",
          }}
        >
          <AnimatedText
            text={scene.text}
            animation={scene.textAnimation}
            color={scene.palette.text}
            fontSize={100}
            fontWeight="800"
            delay={12}
            textAlign="left"
            maxWidth={900}
            letterSpacing={1.6}
            lineHeight={1.02}
            fontFamily={'"Inter", "Montserrat", sans-serif'}
            textShadow="0 20px 60px rgba(0,0,0,0.62)"
          />

          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 12,
              padding: "14px 18px",
              border: "1px solid rgba(255,255,255,0.16)",
              backgroundColor: "rgba(8,8,10,0.45)",
              color: "rgba(255,255,255,0.82)",
              fontSize: 22,
              letterSpacing: 2,
              textTransform: "uppercase",
              fontFamily: "\"Inter\", sans-serif",
            }}
          >
            Hook inmediato // tension creciente // twist final
          </div>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
