import React from "react";
import { AbsoluteFill } from "remotion";
import type { SceneBlueprint } from "../../types/scene";
import { AnimatedImage } from "../../components/AnimatedImage";
import { AnimatedText } from "../../components/AnimatedText";
import { Background } from "../../components/Background";
import { DistopicOverlay } from "../../components/DistopicOverlay";

export const CinematicScene: React.FC<{ scene: SceneBlueprint }> = ({ scene }) => {
  const hasImage = scene.imageUrl && scene.imageUrl.length > 0;
  const barHeight = 118;

  return (
    <AbsoluteFill style={{ backgroundColor: "#02040a" }}>
      <DistopicOverlay seed={scene.text} label="ARCHIVE // PLAYBACK" subtle />
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
            "linear-gradient(180deg, #02040a 0%, rgba(2,4,10,0.94) 72%, rgba(2,4,10,0.38) 100%)",
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
            "linear-gradient(180deg, rgba(2,4,10,0.38) 0%, rgba(2,4,10,0.95) 30%, #02040a 100%)",
          borderTop: "1px solid rgba(255, 255, 255, 0.08)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 48px",
          gap: 24,
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 10,
            maxWidth: 860,
          }}
        >
          <span
            style={{
              color: "rgba(255,255,255,0.58)",
              fontSize: 18,
              letterSpacing: 2.6,
              textTransform: "uppercase",
              fontFamily: "\"Inter\", sans-serif",
            }}
          >
            final anomaly
          </span>
          <AnimatedText
            text={scene.text}
            animation={scene.textAnimation}
            color="#f8fafc"
            fontSize={62}
            fontWeight="800"
            delay={8}
            textAlign="left"
            maxWidth={860}
            lineHeight={1.08}
            letterSpacing={1}
            fontFamily={'"Inter", "Montserrat", sans-serif'}
            textShadow="0 16px 30px rgba(0, 0, 0, 0.48)"
          />
        </div>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "flex-end",
            gap: 8,
            color: "rgba(255,255,255,0.5)",
            fontSize: 18,
            letterSpacing: 2.2,
            textTransform: "uppercase",
            fontFamily: "\"Inter\", sans-serif",
          }}
        >
          <span>POV / IA</span>
          <span>NO SIGNAL</span>
        </div>
      </div>
    </AbsoluteFill>
  );
};
