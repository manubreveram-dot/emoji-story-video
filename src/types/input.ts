import { z } from "zod/v4";
import type { SceneBlueprint } from "./scene";

export const VideoInputSchema = z.object({
  scenes: z.array(
    z.object({
      text: z.string(),
      emojis: z.array(z.string()),
      layout: z.enum([
        "title", "text-emoji", "emoji-rain", "split", "minimal",
        "image", "image-text", "cinematic",
      ]),
      textAnimation: z.enum([
        "typewriter", "word-bounce", "fade-up", "scale-in", "slide-in",
      ]),
      emojiAnimation: z.enum(["bounce", "pulse", "rotate", "float", "rain"]),
      backgroundAnimation: z.enum([
        "gradient-shift", "particles", "waves", "none",
      ]),
      palette: z.object({
        name: z.string(),
        background: z.string(),
        backgroundEnd: z.string(),
        text: z.string(),
        accent: z.string(),
        particle: z.string(),
      }),
      durationInFrames: z.number(),
      transitionToNext: z.enum([
        "fade", "slide", "wipe", "clock-wipe", "flip", "iris",
      ]),
      // v2 optional fields
      imageUrl: z.string().optional(),
      narration: z.string().optional(),
      imageAnimation: z.enum([
        "ken-burns-in", "ken-burns-out", "parallax",
        "zoom-pulse", "slide-reveal", "static",
      ]).optional(),
    })
  ),
});

export type VideoInputProps = {
  scenes: SceneBlueprint[];
};
