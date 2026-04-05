import type { ImageStyle, ScriptScene } from "../../types/script";

export function buildImagePrompt(
  scene: ScriptScene,
  style: ImageStyle,
): string {
  return [
    `Art style: ${style.artStyle}.`,
    `Color tone: ${style.colorTone}.`,
    `Visual consistency: ${style.consistency}.`,
    ``,
    `Scene description: ${scene.visualDescription}`,
    ``,
    `Mood: ${scene.mood}.`,
    `Vertical format (9:16 aspect ratio), cinematic lighting.`,
    `No text, no letters, no words in the image.`,
    `High quality, detailed, professional illustration.`,
  ].join("\n");
}
