import React from "react";
import { useCurrentFrame, useVideoConfig, AbsoluteFill } from "remotion";
import { getEmojiRainDrops } from "../animations/emoji/rain";

type EmojiRainProps = {
  emojis: string[];
  count?: number;
};

export const EmojiRain: React.FC<EmojiRainProps> = ({ emojis, count = 15 }) => {
  const frame = useCurrentFrame();
  const { fps, height } = useVideoConfig();

  const drops = getEmojiRainDrops(frame, fps, emojis, count, height);

  return (
    <AbsoluteFill style={{ overflow: "hidden" }}>
      {drops.map((drop, i) => (
        <div key={i} style={drop.style}>
          {drop.emoji}
        </div>
      ))}
    </AbsoluteFill>
  );
};
