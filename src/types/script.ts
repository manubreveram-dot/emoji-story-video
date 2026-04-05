import type { TransitionType } from "./scene";

export type ImageAnimation =
  | "ken-burns-in"
  | "ken-burns-out"
  | "parallax"
  | "zoom-pulse"
  | "slide-reveal"
  | "static";

export type SceneLayoutV2 =
  | "title"
  | "image"
  | "image-text"
  | "cinematic"
  | "text-emoji"
  | "emoji-rain"
  | "split"
  | "minimal";

export type ImageStyle = {
  artStyle: string;
  colorTone: string;
  consistency: string;
};

export type ScriptScene = {
  id: string;
  order: number;
  narration: string;
  visualDescription: string;
  mood: string;
  emojis: string[];
  durationSeconds: number;
  layout: SceneLayoutV2;
  imageAnimation: ImageAnimation;
  transition: TransitionType;
};

export type Script = {
  title: string;
  totalDurationSeconds: number;
  style: ImageStyle;
  scenes: ScriptScene[];
};
