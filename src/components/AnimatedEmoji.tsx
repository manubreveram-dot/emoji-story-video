import React from "react";
import { useCurrentFrame, useVideoConfig } from "remotion";
import type { EmojiAnimation } from "../types/scene";
import { getEmojiBounceStyle } from "../animations/emoji/bounce";
import { getEmojiPulseStyle } from "../animations/emoji/pulse";
import { getEmojiRotateStyle } from "../animations/emoji/rotate";
import { getEmojiFloatStyle } from "../animations/emoji/float";

type AnimatedEmojiProps = {
  emoji: string;
  animation: EmojiAnimation;
  size?: number;
  delay?: number;
};

export const AnimatedEmoji: React.FC<AnimatedEmojiProps> = ({
  emoji,
  animation,
  size = 120,
  delay = 0,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  let style: React.CSSProperties;

  switch (animation) {
    case "bounce":
      style = getEmojiBounceStyle(frame, fps, delay);
      break;
    case "pulse":
      style = getEmojiPulseStyle(frame, fps, delay);
      break;
    case "rotate":
      style = getEmojiRotateStyle(frame, fps, delay);
      break;
    case "float":
    default:
      style = getEmojiFloatStyle(frame, fps, delay);
      break;
  }

  return (
    <div
      style={{
        fontSize: size,
        lineHeight: 1,
        textAlign: "center",
        ...style,
      }}
    >
      {emoji}
    </div>
  );
};
