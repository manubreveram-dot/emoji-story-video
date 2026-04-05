import type { ColorPalette } from "./theme";
import type { ImageAnimation } from "./script";

export type SceneLayout =
  | "title"
  | "text-emoji"
  | "emoji-rain"
  | "split"
  | "minimal"
  | "image"
  | "image-text"
  | "cinematic";

export type TextAnimation =
  | "typewriter"
  | "word-bounce"
  | "fade-up"
  | "scale-in"
  | "slide-in";

export type EmojiAnimation =
  | "bounce"
  | "pulse"
  | "rotate"
  | "float"
  | "rain";

export type BackgroundAnimation =
  | "gradient-shift"
  | "particles"
  | "waves"
  | "none";

export type TransitionType =
  | "fade"
  | "slide"
  | "wipe"
  | "clock-wipe"
  | "flip"
  | "iris";

export type SceneBlueprint = {
  text: string;
  emojis: string[];
  layout: SceneLayout;
  textAnimation: TextAnimation;
  emojiAnimation: EmojiAnimation;
  backgroundAnimation: BackgroundAnimation;
  palette: ColorPalette;
  durationInFrames: number;
  transitionToNext: TransitionType;
  // v2: AI-generated content
  imageUrl?: string;
  narration?: string;
  imageAnimation?: ImageAnimation;
};
