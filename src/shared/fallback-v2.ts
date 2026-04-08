import { API_CONFIG } from "../config/api";
import type {
  ActDraft,
  CostBreakdown,
  PhraseDraft,
  ScriptDocumentV2,
  StyleBible,
} from "../types/workflow-v2";

const DEFAULT_DURATION_SECONDS = API_CONFIG.pipelineV2.targetDurationSeconds;
const DEFAULT_ESTIMATED_COST: CostBreakdown = {
  scriptUsd: 0,
  imagesUsd: 0,
  veoUsd: 0,
  renderUsd: 0,
  totalUsd: 0,
};

const MOOD_CYCLE = [
  "intense",
  "dramatic",
  "peaceful",
  "hopeful",
  "energetic",
  "joyful",
] as const;

const EMOJI_CYCLE = [
  ["\u2728", "\ud83d\udd25"],
  ["\ud83d\udcaf", "\ud83c\udf19"],
  ["\ud83e\ude77", "\ud83c\udf3f"],
  ["\ud83d\udd31", "\ud83c\udf0a"],
  ["\ud83d\udca5", "\ud83d\ude80"],
  ["\ud83d\udcab", "\ud83e\udde0"],
] as const;

const MID_STORY_TEMPLATES = [
  "El ruido interno cae y aparece una direccion clara.",
  "El protagonista suelta una carga vieja y recupera foco.",
  "Una accion concreta transforma la energia del relato.",
  "La tension sube, pero la decision se vuelve firme.",
  "La disciplina se vuelve habito y cambia el resultado.",
  "La calma domina y el camino se ordena.",
  "El contexto responde cuando la presencia se estabiliza.",
  "Cada gesto confirma la evolucion interna.",
];

function cleanIdea(idea: string): string {
  const normalized = idea.replace(/\s+/g, " ").trim();
  return normalized || "una historia breve sobre transformacion interior";
}

function clampPhraseCount(value?: number): number {
  const next = Math.round(value ?? API_CONFIG.pipelineV2.defaultLineCount);
  return Math.min(
    API_CONFIG.pipelineV2.maxLineCount,
    Math.max(API_CONFIG.pipelineV2.minLineCount, next),
  );
}

function toTitle(idea: string): string {
  const cleaned = cleanIdea(idea);
  const compact = cleaned.replace(/[.!?]+$/g, "");
  if (compact.length <= 52) {
    return compact.charAt(0).toUpperCase() + compact.slice(1);
  }

  return `${compact.slice(0, 49).trimEnd()}...`;
}

function distributeDuration(totalSeconds: number, phraseCount: number): number[] {
  const minPerLine = 2;
  const durations = Array.from({ length: phraseCount }, () => minPerLine);
  let remaining = Math.max(0, totalSeconds - phraseCount * minPerLine);

  for (let index = 0; index < phraseCount; index++) {
    if (remaining <= 0) {
      break;
    }
    const linesLeft = phraseCount - index;
    const bonus = index === phraseCount - 1
      ? remaining
      : Math.max(0, Math.round(remaining / linesLeft));
    durations[index] += bonus;
    remaining -= bonus;
  }

  return durations;
}

function takeIdeaKeywords(idea: string): string[] {
  return cleanIdea(idea)
    .toLowerCase()
    .split(" ")
    .filter((token) => token.length >= 4)
    .slice(0, 8);
}

function takeLeadKeyword(idea: string): string {
  const [first] = takeIdeaKeywords(idea);
  return first ?? "cambio";
}

function buildStyleBible(artStyle: string, idea: string): StyleBible {
  const cleaned = cleanIdea(idea);
  const keywords = takeIdeaKeywords(cleaned).join(", ");

  return {
    artStyle: artStyle.trim() || "realismo fotografico cinematografico",
    palette: `grises cinematograficos, blancos suaves y acentos sutiles alineados con: ${keywords}`,
    lighting: "luz natural modelada, contraste suave y volumen creible",
    camera: "vertical 9:16, encuadre intimo, profundidad real y enfoque selectivo",
    characterDescriptors:
      `Mismo protagonista en todas las escenas, rasgos naturales, expresion coherente y contexto narrativo: ${cleaned}.`,
    negativePrompt:
      "piel plastica, manos deformes, ojos irreales, texto en imagen, watermark, artefactos IA, duplicaciones",
    consistencyNote:
      "Mantener sujeto, atmosfera y direccion visual en cada acto para continuidad completa.",
    seedBase: 1084,
  };
}

function buildPhraseText(idea: string, index: number, phraseCount: number): string {
  const cleaned = cleanIdea(idea);
  const lead = takeLeadKeyword(cleaned);

  if (index === 0) {
    return `Cuando aparece ${lead}, todo cambia en segundos.`;
  }
  if (index === phraseCount - 1) {
    return "Cierre final: calma firme, decision total y camino claro.";
  }

  return MID_STORY_TEMPLATES[(index - 1) % MID_STORY_TEMPLATES.length];
}

function buildPhrases(idea: string, phraseCount: number): PhraseDraft[] {
  const durations = distributeDuration(DEFAULT_DURATION_SECONDS, phraseCount);
  return Array.from({ length: phraseCount }, (_, index) => ({
    id: `phrase-${index + 1}`,
    index,
    text: buildPhraseText(idea, index, phraseCount),
    durationSeconds: durations[index] ?? 3,
    mood: MOOD_CYCLE[index % MOOD_CYCLE.length] ?? "hopeful",
    emojis: [...(EMOJI_CYCLE[index % EMOJI_CYCLE.length] ?? ["\u2728"])],
  }));
}

function summarizePhrases(phrases: PhraseDraft[]): string {
  return phrases.map((phrase) => phrase.text).join(" ");
}

function buildActRanges(phraseCount: number): Array<[number, number]> {
  const ratios = [0, 0.3, 0.5, 0.8, 1];
  const ranges: Array<[number, number]> = [];
  let start = 0;

  for (let index = 0; index < 4; index++) {
    const ratioEnd = ratios[index + 1] ?? 1;
    const maxEnd = Math.max(start, Math.round(phraseCount * ratioEnd));
    const end = index === 3 ? phraseCount : Math.min(phraseCount, maxEnd);
    ranges.push([start, end]);
    start = Math.min(phraseCount, end);
  }

  return ranges;
}

function buildActs(phrases: PhraseDraft[], idea: string): ActDraft[] {
  const ranges = buildActRanges(phrases.length);
  const keywords = takeIdeaKeywords(idea).join(", ");

  return ranges.map(([start, end], index) => {
    const subset = phrases.slice(start, end);
    const beat = index + 1;
    const mood = subset[0]?.mood ?? "hopeful";

    return {
      id: `act-${beat}`,
      index,
      title: `Acto ${beat}`,
      summary: summarizePhrases(subset),
      phraseIndexes: subset.map((phrase) => phrase.index),
      visualPrompt: [
        `Fotografia vertical 9:16 para Acto ${beat}.`,
        `Contexto central: ${keywords}.`,
        subset.map((phrase) => phrase.text).join(" "),
        `Estetica realista cinematografica, continuidad de protagonista, mood ${mood}, cero apariencia IA.`,
      ].join(" "),
    };
  });
}

export function createFallbackScriptDocument(
  idea: string,
  artStyle: string,
  budgetCapUsd: number,
  useVeo: boolean,
  phraseCount?: number,
): ScriptDocumentV2 {
  const cleanedIdea = cleanIdea(idea);
  const nextPhraseCount = clampPhraseCount(phraseCount);
  const phrases = buildPhrases(cleanedIdea, nextPhraseCount);
  const title = toTitle(cleanedIdea);

  return {
    id: `script-fallback-${Date.now()}`,
    idea: cleanedIdea,
    title,
    targetDurationSeconds: DEFAULT_DURATION_SECONDS,
    phraseCount: nextPhraseCount,
    budgetCapUsd,
    useVeo,
    estimatedCost: DEFAULT_ESTIMATED_COST,
    styleBible: buildStyleBible(artStyle, cleanedIdea),
    phrases,
    acts: buildActs(phrases, cleanedIdea),
    createdAt: Date.now(),
    updatedAt: Date.now(),
    featureFlags: {
      legacyFallback: true,
      veoEnabled: false,
    },
  };
}
