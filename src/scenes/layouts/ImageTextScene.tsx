import React from "react";
import { AbsoluteFill } from "remotion";
import type { SceneBlueprint } from "../../types/scene";
import { AnimatedImage } from "../../components/AnimatedImage";
import { AnimatedText } from "../../components/AnimatedText";
import { Background } from "../../components/Background";
import { DistopicOverlay } from "../../components/DistopicOverlay";

export const ImageTextScene: React.FC<{ scene: SceneBlueprint }> = ({ scene }) => {
  const hasImage = scene.imageUrl && scene.imageUrl.length > 0;

  return (
    <AbsoluteFill style={{ backgroundColor: "#05070c" }}>
      <DistopicOverlay seed={scene.text} label="SYSTEM TRACE" subtle />
      <div
        style={{
          position: "absolute",
          top: 28,
          left: 28,
          right: 28,
          height: "56%",
          borderRadius: 18,
          overflow: "hidden",
          boxShadow: "0 24px 58px rgba(0, 0, 0, 0.42)",
          border: "1px solid rgba(255,255,255,0.08)",
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
          height: "46%",
          borderTopLeftRadius: 28,
          borderTopRightRadius: 28,
          background:
            "linear-gradient(180deg, rgba(9,11,16,0.9), rgba(4,6,10,0.98))",
          borderTop: "1px solid rgba(255,255,255,0.12)",
          padding: "40px 48px 44px",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
        }}
      >
        <div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              marginBottom: 18,
              color: "rgba(255,255,255,0.62)",
              fontSize: 18,
              letterSpacing: 2.6,
              textTransform: "uppercase",
              fontFamily: "\"Inter\", sans-serif",
            }}
          >
            <span
              style={{
                width: 10,
                height: 10,
                borderRadius: 999,
                backgroundColor: "#ff3b30",
                boxShadow: "0 0 20px rgba(255,59,48,0.45)",
              }}
            />
            monitored response
          </div>
          <AnimatedText
            text={scene.text}
            animation={scene.textAnimation}
            color="#f8fafc"
            fontSize={66}
            fontWeight="800"
            delay={8}
            textAlign="left"
            maxWidth={920}
            textShadow="0 18px 48px rgba(0,0,0,0.48)"
            lineHeight={1.08}
            letterSpacing={1.2}
            fontFamily={'"Inter", "Montserrat", sans-serif'}
          />
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            color: "rgba(255,255,255,0.5)",
            fontSize: 18,
            letterSpacing: 2,
            textTransform: "uppercase",
            fontFamily: "\"Inter\", sans-serif",
          }}
        >
          <span>signal unstable</span>
          <span>frame locked</span>
        </div>
      </div>
    </AbsoluteFill>
  );
};
