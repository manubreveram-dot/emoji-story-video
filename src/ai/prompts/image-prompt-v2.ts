import type { StyleBible, VisualActV2 } from "../v2-types";
import type { ImageStyle } from "../../types/script";

export function buildImagePromptV2(
  act: VisualActV2,
  style: ImageStyle,
  styleBible: StyleBible,
): string {
  return [
    `Master art style: ${style.artStyle}.`,
    `Global consistency: ${style.consistency}.`,
    `Color tone: ${style.colorTone}.`,
    `Palette: ${styleBible.palette}.`,
    `Lighting: ${styleBible.lighting}.`,
    `Camera language: ${styleBible.camera}.`,
    `Character anchor: ${styleBible.characterDescriptors}.`,
    `Negative prompt: ${styleBible.negativePrompt}.`,
    "",
    `Act title: ${act.title}.`,
    `Act summary: ${act.summary}.`,
    `Visual focus: ${act.visualFocus}.`,
    `Shot prompt: ${act.shotPrompt}.`,
    "",
    "Create a premium vertical keyframe for a short-form video.",
    "Portrait aspect ratio 9:16.",
    "No text, no subtitles, no letters, no watermark.",
    "Keep the same character, environment and visual language as previous acts.",
  ].join("\n");
}

export function buildVeoPromptEnglish(
  act: VisualActV2,
  styleBible: StyleBible,
  translatedSummary: string,
): string {
  return [
    `Create a cinematic 9:16 hero motion shot for Act ${act.order}.`,
    `Use the reference image as the main visual anchor.`,
    `Visual style anchor: ${styleBible.characterDescriptors}.`,
    `Palette: ${styleBible.palette}.`,
    `Lighting: ${styleBible.lighting}.`,
    `Camera: ${styleBible.camera}.`,
    `Character consistency: ${styleBible.characterDescriptors}.`,
    `Scene intent: ${translatedSummary}.`,
    "Subtle camera drift, elegant motion, no abrupt cuts, no text overlay.",
  ].join(" ");
}
