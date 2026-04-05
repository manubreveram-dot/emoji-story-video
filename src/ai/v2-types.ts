import type { ImageStyle, Script } from "../types/script";

export type StyleBible = {
  artStyle: string;
  palette: string;
  lighting: string;
  camera: string;
  characterDescriptors: string;
  negativePrompt: string;
  seedBase: number;
};

export type ScriptLineV2 = {
  id: string;
  order: number;
  narration: string;
  mood: string;
  emojis: string[];
  durationSeconds: number;
  visualIntent: string;
};

export type VisualActV2 = {
  id: string;
  order: number;
  title: string;
  lineIds: string[];
  summary: string;
  visualFocus: string;
  shotPrompt: string;
};

export type PhaseCostEstimate = {
  scriptUsd: number;
  imagesUsd: number;
  veoUsd: number;
  renderUsd: number;
  totalUsd: number;
  capUsd: number;
  withinCap: boolean;
  veoAllowed: boolean;
  fallbackReason?: string;
};

export type QualityRubricResult = {
  passed: boolean;
  score: number;
  issues: string[];
  attempts: number;
};

export type ScriptPackageV2 = {
  id: string;
  title: string;
  idea: string;
  language: string;
  totalDurationSeconds: number;
  style: ImageStyle;
  styleBible: StyleBible;
  lines: ScriptLineV2[];
  acts: VisualActV2[];
  quality: QualityRubricResult;
  costEstimate: PhaseCostEstimate;
  legacyScript: Script;
};

export type ImageAssetV2 = {
  actId: string;
  filename: string;
  prompt: string;
  model: string;
};

export type VeoClipResultV2 = {
  enabled: boolean;
  skippedReason?: string;
  model?: string;
  operationName?: string;
  filename?: string;
  promptEn?: string;
};

export type VisualPackageV2 = {
  script: ScriptPackageV2;
  styleBible: StyleBible;
  images: ImageAssetV2[];
  heroClip: VeoClipResultV2;
  costEstimate: PhaseCostEstimate;
};

export type GenerateScriptV2Options = {
  costCapUsd?: number;
  actGroups?: Array<[number, number]>;
  includeVeo?: boolean;
};

export type GenerateImagePackV2Options = {
  costCapUsd?: number;
  outputDir: string;
  useVeo?: boolean;
};

export type GenerateHeroClipOptions = {
  outputDir: string;
  costCapUsd?: number;
};
