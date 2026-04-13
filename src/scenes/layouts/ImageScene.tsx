import React from "react";
import { AbsoluteFill } from "remotion";
import type { SceneBlueprint } from "../../types/scene";
import { AnimatedImage } from "../../components/AnimatedImage";
import { AnimatedText } from "../../components/AnimatedText";
import { Background } from "../../components/Background";
import { DistopicOverlay } from "../../components/DistopicOverlay";

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
            "linear-gradient(180deg, rgba(0,0,0,0.12) 0%, rgba(0,0,0,0.26) 34%, rgba(0,0,0,0.72) 100%)",
        }}
      />
      <DistopicOverlay seed={scene.text} label="OBSERVATION FEED" subtle />

      <AbsoluteFill
        style={{
          justifyContent: "space-between",
          padding: "72px 52px 94px",
        }}
      >
        <div />

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 18,
            alignItems: "flex-start",
            width: "100%",
          }}
        >
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 16,
              width: "100%",
              maxWidth: 920,
              padding: "28px 28px 30px",
              background:
                "linear-gradient(180deg, rgba(7,7,9,0.34) 0%, rgba(7,7,9,0.72) 100%)",
              border: "1px solid rgba(255,255,255,0.12)",
              boxShadow: "0 24px 60px rgba(0,0,0,0.42)",
              backdropFilter: "blur(4px)",
            }}
          >
            <span
              style={{
                color: "rgba(255,255,255,0.7)",
                fontSize: 20,
                letterSpacing: 3,
                textTransform: "uppercase",
                fontFamily: "\"Inter\", sans-serif",
              }}
            >
              anomalous event detected
            </span>
            <AnimatedText
              text={scene.text}
              animation={scene.textAnimation}
              color="#ffffff"
              fontSize={78}
              fontWeight="800"
              delay={8}
              textAlign="left"
              maxWidth={860}
              letterSpacing={1.1}
              lineHeight={1.08}
              fontFamily={'"Inter", "Montserrat", sans-serif'}
              textShadow="0 18px 34px rgba(0, 0, 0, 0.48)"
            />
          </div>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
