import type {
  SceneLayout,
  TextAnimation,
  EmojiAnimation,
  BackgroundAnimation,
} from "../types/scene";
import type { SentimentResult } from "./sentiment";

export type AnimationMapping = {
  layout: SceneLayout;
  textAnimation: TextAnimation;
  emojiAnimation: EmojiAnimation;
  backgroundAnimation: BackgroundAnimation;
};

export function mapAnimations(
  sentiment: SentimentResult,
  sceneIndex: number,
  totalScenes: number,
): AnimationMapping {
  const { intensity, score, dominantCategory } = sentiment;
  const isPositive = score >= 0;

  // Layout logic
  let layout: SceneLayout;
  if (totalScenes === 1) {
    layout = "title";
  } else if (sceneIndex === 0 || sceneIndex === totalScenes - 1) {
    layout = "title";
  } else if (dominantCategory === "celebration") {
    layout = "emoji-rain";
  } else {
    layout = sceneIndex % 2 === 0 ? "text-emoji" : "split";
  }

  // Animation mapping by intensity + valence
  let textAnimation: TextAnimation;
  let emojiAnimation: EmojiAnimation;
  let backgroundAnimation: BackgroundAnimation;

  if (intensity === "high" && isPositive) {
    textAnimation = "word-bounce";
    emojiAnimation = "bounce";
    backgroundAnimation = "particles";
  } else if (intensity === "high" && !isPositive) {
    textAnimation = "slide-in";
    emojiAnimation = "pulse";
    backgroundAnimation = "particles";
  } else if (intensity === "medium" && isPositive) {
    textAnimation = "fade-up";
    emojiAnimation = "float";
    backgroundAnimation = "gradient-shift";
  } else if (intensity === "medium" && !isPositive) {
    textAnimation = "typewriter";
    emojiAnimation = "rotate";
    backgroundAnimation = "waves";
  } else {
    textAnimation = "fade-up";
    emojiAnimation = "float";
    backgroundAnimation = "gradient-shift";
  }

  return { layout, textAnimation, emojiAnimation, backgroundAnimation };
}
