import React from "react";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { AnimatedText } from "./AnimatedText";
import { AnimatedEmoji } from "./AnimatedEmoji";
import type { EmojiAnimation, TextAnimation } from "../types/scene";

type StoryCaptionProps = {
  text: string;
  emojis: string[];
  textAnimation: TextAnimation;
  emojiAnimation: EmojiAnimation;
  tone: "light" | "dark";
  align?: "left" | "center";
  compact?: boolean;
  showLabel?: boolean;
};

const FALLBACK_EMOJIS = ["✨", "🔥", "🌊", "🌀", "💫", "🌿"];

function splitNarrative(text: string): { hook: string; support: string } {
  const words = text.trim().split(/\s+/).filter(Boolean);
  if (words.length <= 8) {
    return { hook: words.join(" "), support: "" };
  }
  const hook = words.slice(0, 7).join(" ");
  const support = words.slice(7, 18).join(" ");
  return { hook, support };
}

function buildEmojiRail(emojis: string[]): string[] {
  const source = [...emojis, ...FALLBACK_EMOJIS];
  const unique = Array.from(new Set(source.filter(Boolean)));
  return unique.slice(0, 5);
}

export const StoryCaption: React.FC<StoryCaptionProps> = ({
  text,
  emojis,
  textAnimation,
  emojiAnimation,
  tone,
  align = "left",
  compact = false,
  showLabel = true,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const { hook, support } = splitNarrative(text);
  const emojiRail = buildEmojiRail(emojis);
  const entrance = spring({
    frame,
    fps,
    config: {
      damping: 180,
      stiffness: 160,
      mass: 0.65,
    },
  });
  const panelOpacity = interpolate(frame, [0, 12, 24], [0, 0.62, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const panelScale = interpolate(entrance, [0, 1], [0.96, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const isDark = tone === "dark";
  const foreground = isDark ? "#F8FAFC" : "#111827";
  const secondary = isDark ? "rgba(240,244,251,0.88)" : "rgba(51,65,85,0.88)";
  const panelBackground = isDark
    ? "linear-gradient(180deg, rgba(4,6,10,0.08), rgba(4,6,10,0.62))"
    : "linear-gradient(180deg, rgba(255,255,255,0.88), rgba(255,255,255,0.98))";
  const panelBorder = isDark ? "rgba(255,255,255,0.16)" : "rgba(148,163,184,0.36)";

  return (
    <div
      style={{
        borderRadius: compact ? 24 : 30,
        border: `1px solid ${panelBorder}`,
        background: panelBackground,
        backdropFilter: "blur(10px)",
        padding: compact ? "24px 24px 20px" : "32px 30px 26px",
        transform: `translateY(${interpolate(entrance, [0, 1], [18, 0])}px) scale(${panelScale})`,
        opacity: panelOpacity,
        display: "flex",
        flexDirection: "column",
        gap: compact ? 12 : 16,
      }}
    >
      {showLabel ? (
        <span
          style={{
            display: "inline-flex",
            alignSelf: align === "left" ? "flex-start" : "center",
            borderRadius: 999,
            border: `1px solid ${panelBorder}`,
            fontSize: compact ? 16 : 18,
            fontWeight: 620,
            padding: "6px 12px",
            color: secondary,
          }}
        >
          Subtitulo narrativo
        </span>
      ) : null}

      <AnimatedText
        text={hook}
        animation={textAnimation}
        color={foreground}
        fontSize={compact ? 60 : 74}
        fontWeight="800"
        delay={6}
        textAlign={align}
        maxWidth={compact ? 840 : 920}
        lineHeight={1.1}
        textShadow={isDark ? "0 16px 30px rgba(0, 0, 0, 0.28)" : "none"}
      />

      {support ? (
        <AnimatedText
          text={support}
          animation="fade-up"
          color={secondary}
          fontSize={compact ? 36 : 44}
          fontWeight="600"
          delay={16}
          textAlign={align}
          maxWidth={900}
          lineHeight={1.2}
          textShadow="none"
        />
      ) : null}

      <div
        style={{
          display: "flex",
          justifyContent: align === "left" ? "flex-start" : "center",
          gap: compact ? 10 : 12,
          flexWrap: "wrap",
        }}
      >
        {emojiRail.map((emoji, index) => (
          <AnimatedEmoji
            key={`${emoji}-${index}`}
            emoji={emoji}
            animation={emojiAnimation}
            size={compact ? 50 : 56}
            delay={12 + index * 6}
          />
        ))}
      </div>
    </div>
  );
};
