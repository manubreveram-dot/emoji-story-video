import type { StyleBible, VisualActV2 } from "../v2-types";
import type { ImageStyle } from "../../types/script";

function normalizeText(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

function clipWords(value: string, maxWords: number): string {
  const words = normalizeText(value).split(" ").filter(Boolean);
  if (words.length <= maxWords) {
    return words.join(" ");
  }
  return `${words.slice(0, maxWords).join(" ")}...`;
}

function uniqueCompact(values: string[], maxItems: number, maxWords: number): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const value of values) {
    const normalized = normalizeText(value);
    if (!normalized) continue;
    const key = normalized.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(clipWords(normalized, maxWords));
    if (result.length >= maxItems) break;
  }
  return result;
}

function extractBeat(summary: string): string {
  const segments = summary
    .split(/[|.]/)
    .map((segment) => segment.trim())
    .filter(Boolean);
  return uniqueCompact(segments, 2, 14).join(" | ");
}

function compactVisualPrompt(value: string): string {
  const cleaned = normalizeText(value.replace(/\|/g, ". ").replace(/,+/g, ","));
  return clipWords(cleaned, 46);
}

export function buildImagePromptV2(
  act: VisualActV2,
  style: ImageStyle,
  styleBible: StyleBible,
): string {
  const beat = extractBeat(act.summary);
  const visualPrompt = compactVisualPrompt(act.shotPrompt || act.visualFocus);

  return [
    "Genera una imagen fotografica vertical 9:16 con calidad editorial premium.",
    "Ejecuta todo en espanol y evita cualquier texto impreso dentro de la imagen.",
    "",
    "Contexto visual global:",
    `- Direccion: ${style.artStyle}.`,
    `- Regla de coherencia: ${style.consistency}.`,
    `- Tono cromatico: ${style.colorTone}.`,
    `- Paleta: ${styleBible.palette}.`,
    `- Iluminacion: ${styleBible.lighting}.`,
    `- Camara: ${styleBible.camera}.`,
    `- Protagonista estable: ${styleBible.characterDescriptors}.`,
    `- Prohibiciones: ${styleBible.negativePrompt}.`,
    "",
    "Story beat del acto:",
    `- Acto: ${act.title}.`,
    `- Beat narrativo: ${beat}.`,
    `- Foco visual: ${clipWords(normalizeText(act.visualFocus), 28)}.`,
    `- Prompt fotografico: ${visualPrompt}.`,
    "",
    "Objetivo estetico obligatorio:",
    "- Aspecto realista, piel natural, texturas organicas y microdetalle creible.",
    "- Una sola accion protagonista, composicion limpia y lectura instantanea tipo hook.",
    "- Luz fisica coherente, profundidad cinematografica y color grading sobrio.",
    "- Imagen sin letras, sin caligrafia, sin subtitulos, sin pergaminos legibles, sin carteles.",
    "- NO representar el guion como texto escrito; expresar el concepto con accion visual.",
    "- Mantener continuidad del sujeto y entorno frente a los otros actos.",
  ].join("\n");
}

export function buildVeoPromptEnglish(
  act: VisualActV2,
  styleBible: StyleBible,
  translatedSummary: string,
): string {
  return [
    `Create a cinematic 9:16 hero motion shot for Act ${act.order}.`,
    "Use the reference image as the main visual anchor.",
    `Visual style anchor: ${styleBible.characterDescriptors}.`,
    `Palette: ${styleBible.palette}.`,
    `Lighting: ${styleBible.lighting}.`,
    `Camera: ${styleBible.camera}.`,
    `Character consistency: ${styleBible.characterDescriptors}.`,
    `Scene intent: ${translatedSummary}.`,
    "Subtle camera drift, elegant motion, no abrupt cuts, no text overlay.",
  ].join(" ");
}
