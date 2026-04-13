import type { ScriptDocumentV2 } from "../types/workflow-v2";

const DEFAULT_COST_BREAKDOWN = {
  scriptUsd: 0,
  imagesUsd: 0,
  veoUsd: 0,
  renderUsd: 0,
  totalUsd: 0,
};

function safePromptFromTitle(title: string, fallback: string): string {
  return title.trim() || fallback;
}

export function createFallbackScriptDocument(
  idea: string,
  artStyle: string,
  budgetCapUsd: number,
  useVeo: boolean,
): ScriptDocumentV2 {
  const phrases = Array.from({ length: 10 }, (_, index) => ({
    id: `phrase-${index + 1}`,
    index,
    text:
      index === 0
        ? `Inicio: ${idea}`
        : index === 9
          ? "Cierre con claridad y accion."
          : `Frase ${index + 1} del video en desarrollo.`,
    durationSeconds: 3,
    mood: index % 2 === 0 ? "hopeful" : "peaceful",
    emojis: index % 2 === 0 ? ["✨", "🧭"] : ["🌙", "🕊️"],
  }));

  const acts = [
    {
      id: "act-1",
      index: 0,
      title: "Apertura",
      summary: "Arranque narrativo",
      phraseIndexes: [0, 1, 2],
      visualPrompt: idea,
    },
    {
      id: "act-2",
      index: 1,
      title: "Giro",
      summary: "Tension y contraste",
      phraseIndexes: [3, 4],
      visualPrompt: `Contrast for ${idea}`,
    },
    {
      id: "act-3",
      index: 2,
      title: "Profundidad",
      summary: "Desarrollo interior",
      phraseIndexes: [5, 6, 7],
      visualPrompt: `Inner depth for ${idea}`,
    },
    {
      id: "act-4",
      index: 3,
      title: "Cierre",
      summary: "Resolucion final",
      phraseIndexes: [8, 9],
      visualPrompt: `Closing frame for ${idea}`,
    },
  ];

  return {
    id: `draft-${Date.now()}`,
    idea,
    title: safePromptFromTitle(idea, "Nuevo video"),
    targetDurationSeconds: 30,
    budgetCapUsd,
    useVeo,
    estimatedCost: {
      ...DEFAULT_COST_BREAKDOWN,
      scriptUsd: 0.01,
      imagesUsd: 0.08,
      veoUsd: useVeo ? 0.4 : 0,
      totalUsd: useVeo ? 0.49 : 0.09,
    },
    styleBible: {
      artStyle,
      palette: "warm neutrals + gold accents",
      lighting: "soft cinematic rim light",
      camera: "portrait 50mm close-up",
      characterDescriptors: "same central subject across all acts",
      negativePrompt: "text, letters, watermark, extra limbs, low detail",
      seedBase: 4242,
      consistencyNote:
        "Match wardrobe, face shape and atmosphere across all blocks.",
    },
    phrases,
    acts,
    featureFlags: {
      legacyFallback: true,
      veoEnabled: useVeo,
    },
  };
}
