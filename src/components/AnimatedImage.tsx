import React from "react";
import { Img, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import type { ImageAnimation } from "../types/script";
import { getKenBurnsInStyle, getKenBurnsOutStyle } from "../animations/image/ken-burns";
import { getParallaxStyle } from "../animations/image/parallax";
import { getZoomPulseStyle } from "../animations/image/zoom-pulse";
import { getSlideRevealStyle } from "../animations/image/slide-reveal";

type AnimatedImageProps = {
  src: string;
  animation: ImageAnimation;
};

function resolveImageSrc(src: string): string {
  if (
    src.startsWith("http://") ||
    src.startsWith("https://") ||
    src.startsWith("data:") ||
    src.startsWith("/api/") ||
    src.startsWith("/generated/")
  ) {
    return src;
  }

  if (src.startsWith("generated/")) {
    return staticFile(src);
  }

  return staticFile(`generated/${src}`);
}

export const AnimatedImage: React.FC<AnimatedImageProps> = ({
  src,
  animation,
}) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();

  let style: React.CSSProperties;

  switch (animation) {
    case "ken-burns-in":
      style = getKenBurnsInStyle(frame, durationInFrames);
      break;
    case "ken-burns-out":
      style = getKenBurnsOutStyle(frame, durationInFrames);
      break;
    case "parallax":
      style = getParallaxStyle(frame, durationInFrames);
      break;
    case "zoom-pulse":
      style = getZoomPulseStyle(frame, durationInFrames);
      break;
    case "slide-reveal":
      style = getSlideRevealStyle(frame, fps);
      break;
    case "static":
    default:
      style = { transform: "scale(1.02)" };
      break;
  }

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        overflow: "hidden",
        position: "absolute",
        top: 0,
        left: 0,
      }}
    >
      <Img
        src={resolveImageSrc(src)}
        style={{
          width: "100%",
          height: "100%",
          objectFit: "cover",
          ...style,
        }}
      />
    </div>
  );
};
