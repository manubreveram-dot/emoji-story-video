import type { SceneBlueprint } from "../types/scene";
import type { Script } from "../types/script";
import { COLOR_PALETTES } from "./dictionaries/color-palettes";
import { VIDEO_FPS } from "../config/video";
import type { ColorPalette } from "../types/theme";
import type {
  TextAnimation,
  EmojiAnimation,
  BackgroundAnimation,
} from "../types/scene";

function mapMoodToPalette(mood: string): ColorPalette {
  const map: Record<string, string> = {
    hopeful: "joyful",
    joyful: "joyful",
    energetic: "energetic",
    dramatic: "dark",
    intense: "dark",
    peaceful: "calm",
    melancholy: "melancholy",
  };
  const key = map[mood] || "neutral";
  return COLOR_PALETTES[key] || COLOR_PALETTES.neutral;
}

function mapMoodToTextAnim(mood: string): TextAnimation {
  const map: Record<string, TextAnimation> = {
    hopeful: "fade-up",
    joyful: "word-bounce",
    energetic: "word-bounce",
    dramatic: "slide-in",
    intense: "scale-in",
    peaceful: "fade-up",
    melancholy: "typewriter",
  };
  return map[mood] || "fade-up";
}

function mapMoodToEmojiAnim(mood: string): EmojiAnimation {
  const map: Record<string, EmojiAnimation> = {
    hopeful: "float",
    joyful: "bounce",
    energetic: "bounce",
    dramatic: "pulse",
    intense: "rotate",
    peaceful: "float",
    melancholy: "float",
  };
  return map[mood] || "float";
}

export function scriptToScenes(
  script: Script,
  imagePaths: string[],
): SceneBlueprint[] {
  return script.scenes.map((scene, i) => {
    const hasImage = imagePaths[i] && imagePaths[i].length > 0;
    const bgAnimation: BackgroundAnimation = hasImage ? "none" : "gradient-shift";

    return {
      text: scene.narration,
      emojis: scene.emojis,
      layout: scene.layout as SceneBlueprint["layout"],
      textAnimation: mapMoodToTextAnim(scene.mood),
      emojiAnimation: mapMoodToEmojiAnim(scene.mood),
      backgroundAnimation: bgAnimation,
      palette: mapMoodToPalette(scene.mood),
      durationInFrames: Math.round(scene.durationSeconds * VIDEO_FPS),
      transitionToNext: scene.transition,
      imageUrl: hasImage ? imagePaths[i] : undefined,
      imageAnimation: scene.imageAnimation,
      narration: scene.narration,
    };
  });
}
