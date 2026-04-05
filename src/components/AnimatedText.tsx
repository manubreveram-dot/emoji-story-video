import React from "react";
import { useCurrentFrame, useVideoConfig } from "remotion";
import type { TextAnimation } from "../types/scene";
import { getTypewriterStyle } from "../animations/text/typewriter";
import { getWordBounceStyles } from "../animations/text/word-bounce";
import { getFadeUpStyle } from "../animations/text/fade-up";
import { getScaleInStyles } from "../animations/text/scale-in";
import { getSlideInStyles } from "../animations/text/slide-in";

type AnimatedTextProps = {
  text: string;
  animation: TextAnimation;
  color: string;
  fontSize?: number;
  fontWeight?: string;
  delay?: number;
};

export const AnimatedText: React.FC<AnimatedTextProps> = ({
  text,
  animation,
  color,
  fontSize = 64,
  fontWeight = "700",
  delay = 0,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const localFrame = frame - delay;

  const baseStyle: React.CSSProperties = {
    color,
    fontSize,
    fontWeight,
    textAlign: "center",
    lineHeight: 1.3,
    padding: "0 40px",
  };

  if (animation === "typewriter") {
    const { visibleText, showCursor } = getTypewriterStyle(localFrame, fps, text);
    return (
      <div style={baseStyle}>
        {visibleText}
        <span style={{ opacity: showCursor ? 1 : 0 }}>|</span>
      </div>
    );
  }

  if (animation === "fade-up") {
    const style = getFadeUpStyle(localFrame, fps);
    return <div style={{ ...baseStyle, ...style }}>{text}</div>;
  }

  // Word-based animations
  let wordStyles: Array<{ word: string; style: React.CSSProperties }>;

  if (animation === "word-bounce") {
    wordStyles = getWordBounceStyles(localFrame, fps, text);
  } else if (animation === "scale-in") {
    wordStyles = getScaleInStyles(localFrame, fps, text);
  } else {
    wordStyles = getSlideInStyles(localFrame, fps, text);
  }

  return (
    <div style={{ ...baseStyle, display: "flex", flexWrap: "wrap", justifyContent: "center" }}>
      {wordStyles.map(({ word, style }, i) => (
        <span key={i} style={style}>
          {word}
        </span>
      ))}
    </div>
  );
};
