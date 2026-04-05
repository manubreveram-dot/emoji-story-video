import type { SceneBlueprint, TransitionType } from "../types/scene";
import {
  VIDEO_FPS,
  MIN_SCENE_DURATION,
  MAX_SCENE_DURATION,
  TRANSITION_DURATION,
} from "../config/video";
import { splitSentences } from "./sentence-splitter";
import { analyzeSentiment } from "./sentiment";
import { mapEmojis } from "./emoji-mapper";
import { mapColors } from "./color-mapper";
import { mapAnimations } from "./animation-mapper";

const TRANSITION_CYCLE: TransitionType[] = [
  "fade", "slide", "wipe", "iris", "flip",
];

export function parseTextToScenes(input: string): SceneBlueprint[] {
  const sentences = splitSentences(input);
  if (sentences.length === 0) return [];

  return sentences.map((text, index) => {
    const sentiment = analyzeSentiment(text);
    const emojis = mapEmojis(sentiment, text);
    const palette = mapColors(sentiment);
    const animations = mapAnimations(sentiment, index, sentences.length);

    // Compute duration: base + word count bonus + intensity bonus
    const wordCount = text.split(/\s+/).length;
    const base = 60;
    const wordBonus = wordCount * 10;
    const intensityBonus =
      sentiment.intensity === "high" ? 30 :
      sentiment.intensity === "medium" ? 15 : 0;
    const titleBonus =
      (index === 0 || index === sentences.length - 1) ? 60 : 0;

    const durationInFrames = Math.max(
      MIN_SCENE_DURATION,
      Math.min(MAX_SCENE_DURATION, base + wordBonus + intensityBonus + titleBonus),
    );

    const transitionToNext = TRANSITION_CYCLE[index % TRANSITION_CYCLE.length];

    return {
      text,
      emojis,
      layout: animations.layout,
      textAnimation: animations.textAnimation,
      emojiAnimation: animations.emojiAnimation,
      backgroundAnimation: animations.backgroundAnimation,
      palette,
      durationInFrames,
      transitionToNext,
    };
  });
}

export function computeTotalDuration(scenes: SceneBlueprint[]): number {
  if (scenes.length === 0) return 0;
  const sceneDuration = scenes.reduce((sum, s) => sum + s.durationInFrames, 0);
  const transitionOverlap = Math.max(0, scenes.length - 1) * TRANSITION_DURATION;
  return sceneDuration - transitionOverlap;
}
