import type {
  ActDraft,
  CostBreakdown,
  PhraseDraft,
  ScriptDocumentV2,
  StyleBible,
} from "../types/workflow-v2";

const DEFAULT_DURATION_SECONDS = 30;
const DEFAULT_LINE_DURATION = 3;
const DEFAULT_ESTIMATED_COST: CostBreakdown = {
  scriptUsd: 0,
  imagesUsd: 0,
  veoUsd: 0,
  renderUsd: 0,
  totalUsd: 0,
};

const MOOD_CYCLE = [
  "hopeful",
  "peaceful",
  "energetic",
  "dramatic",
  "hopeful",
  "peaceful",
  "energetic",
  "dramatic",
  "hopeful",
  "peaceful",
] as const;

const EMOJI_CYCLE = [
  ["✨", "🌙"],
  ["🫶", "🌿"],
  ["🔥", "🚀"],
  ["⚡", "🌊"],
  ["🌤️", "💫"],
  ["🕊️", "🌱"],
  ["🎯", "🧭"],
  ["🌌", "🪐"],
  ["🌞", "💛"],
  ["🎬", "⭐"],
] as const;

const ACT_GROUPS: Array<[number, number]> = [
  [0, 3],
  [3, 5],
  [5, 8],
  [8, 10],
];

function cleanIdea(idea: string): string {
  const normalized = idea.replace(/\s+/g, " ").trim();
  return normalized || "una historia breve sobre cambio interior";
}

function toTitle(idea: string): string {
  const cleaned = cleanIdea(idea);
  const compact = cleaned.replace(/[.!?]+$/g, "");
  if (compact.length <= 48) {
    return compact.charAt(0).toUpperCase() + compact.slice(1);
  }

  return `${compact.slice(0, 45).trimEnd()}...`;
}

function buildStyleBible(artStyle: string, idea: string): StyleBible {
  const cleaned = cleanIdea(idea);

  return {
    artStyle: artStyle.trim() || "cinematic spiritual realism",
    palette: "amber glow, deep indigo shadows, warm skin tones",
    lighting: "soft cinematic rim light with subtle volumetric haze",
    camera: "slow dolly shots, intimate closeups, confident framing",
    characterDescriptors:
      `Same main character across all scenes, grounded expression, subtle emotion, inspired by: ${cleaned}.`,
    negativePrompt:
      "blurry face, extra fingers, duplicated limbs, low contrast, noisy background, random text, broken anatomy",
    consistencyNote:
      "Keep the same protagonist, wardrobe mood, camera language and color palette across all four acts.",
    seedBase: 1084,
  };
}

function buildPhraseText(idea: string, index: number): string {
  const cleaned = cleanIdea(idea);
  const prompts = [
    `Todo empieza con ${cleaned}.`,
    "La primera senal aparece cuando el ruido baja y la intencion se enfoca.",
    "El personaje entiende que avanzar tambien exige dejar atras lo que distrae.",
    "Cada pequeno gesto cambia la energia de la historia y marca el ritmo.",
    "La tension sube, pero la direccion interior se vuelve mas clara.",
    "Entonces aparece una decision simple que reorganiza todo el camino.",
    "La accion se vuelve constante, serena y mucho mas consciente.",
    "Lo que parecia caotico empieza a revelar una forma reconocible.",
    "La historia encuentra su centro y transforma la duda en impulso.",
    "Al final, queda una imagen limpia: seguir adelante con claridad y presencia.",
  ];

  return prompts[index] ?? prompts[prompts.length - 1];
}

function buildPhrases(idea: string): PhraseDraft[] {
  return Array.from({ length: 10 }, (_, index) => ({
    id: `phrase-${index + 1}`,
    index,
    text: buildPhraseText(idea, index),
    durationSeconds: DEFAULT_LINE_DURATION,
    mood: MOOD_CYCLE[index] ?? "hopeful",
    emojis: [...(EMOJI_CYCLE[index] ?? ["✨"])],
  }));
}

function summarizePhrases(phrases: PhraseDraft[]): string {
  return phrases.map((phrase) => phrase.text).join(" ");
}

function buildActs(phrases: PhraseDraft[]): ActDraft[] {
  return ACT_GROUPS.map(([start, end], index) => {
    const subset = phrases.slice(start, end);
    const beat = index + 1;

    return {
      id: `act-${beat}`,
      index,
      title: `Acto ${beat}`,
      summary: summarizePhrases(subset),
      phraseIndexes: subset.map((phrase) => phrase.index),
      visualPrompt: [
        `Vertical cinematic frame for act ${beat}.`,
        subset.map((phrase) => phrase.text).join(" "),
        `Keep continuity with the same protagonist, ${subset[0]?.mood ?? "hopeful"} mood and strong image-first storytelling.`,
      ].join(" "),
    };
  });
}

export function createFallbackScriptDocument(
  idea: string,
  artStyle: string,
  budgetCapUsd: number,
  useVeo: boolean,
): ScriptDocumentV2 {
  const cleanedIdea = cleanIdea(idea);
  const phrases = buildPhrases(cleanedIdea);
  const title = toTitle(cleanedIdea);

  return {
    id: `script-fallback-${Date.now()}`,
    idea: cleanedIdea,
    title,
    targetDurationSeconds: DEFAULT_DURATION_SECONDS,
    budgetCapUsd,
    useVeo,
    estimatedCost: DEFAULT_ESTIMATED_COST,
    styleBible: buildStyleBible(artStyle, cleanedIdea),
    phrases,
    acts: buildActs(phrases),
    createdAt: Date.now(),
    updatedAt: Date.now(),
    featureFlags: {
      legacyFallback: true,
      veoEnabled: false,
    },
  };
}
