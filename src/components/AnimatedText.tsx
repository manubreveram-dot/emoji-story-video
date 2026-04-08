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
  textAlign?: React.CSSProperties["textAlign"];
  fontFamily?: string;
  letterSpacing?: number;
  maxWidth?: number;
  textShadow?: string;
  lineHeight?: number;
};

export const AnimatedText: React.FC<AnimatedTextProps> = ({
  text,
  animation,
  color,
  fontSize = 64,
  fontWeight = "700",
  delay = 0,
  textAlign = "center",
  fontFamily = "\"Montserrat\", \"Inter\", sans-serif",
  letterSpacing = 0,
  maxWidth,
  textShadow = "0 6px 20px rgba(0, 0, 0, 0.22)",
  lineHeight = 1.3,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const localFrame = frame - delay;

  const baseStyle: React.CSSProperties = {
    color,
    fontSize,
    fontWeight,
    textAlign,
    lineHeight,
    padding: "0 40px",
    fontFamily,
    letterSpacing,
    textShadow,
    maxWidth,
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
    <div
      style={{
        ...baseStyle,
        display: "flex",
        flexWrap: "wrap",
        justifyContent:
          textAlign === "left"
            ? "flex-start"
            : textAlign === "right"
              ? "flex-end"
              : "center",
      }}
    >
      {wordStyles.map(({ word, style }, i) => (
        <span key={i} style={style}>
          {word}
        </span>
      ))}
    </div>
  );
};
