export type WizardStepV2 =
  | "idea"
  | "script-lab"
  | "visual-review"
  | "render-download";

export type GenerationPhase = "idle" | "script" | "visuals" | "render";

export type JobStatus = "pending" | "running" | "done" | "error";

export type CostBreakdown = {
  scriptUsd: number;
  imagesUsd: number;
  veoUsd: number;
  renderUsd: number;
  totalUsd: number;
};

export type StyleBible = {
  artStyle: string;
  palette: string;
  lighting: string;
  camera: string;
  characterDescriptors: string;
  negativePrompt: string;
  consistencyNote: string;
  seedBase: number;
};

export type PhraseDraft = {
  id: string;
  index: number;
  text: string;
  durationSeconds: number;
  mood: string;
  emojis: string[];
};

export type ActDraft = {
  id: string;
  index: number;
  title: string;
  summary: string;
  phraseIndexes: number[];
  visualPrompt: string;
};

export type ScriptRequestV2 = {
  idea: string;
  artStyle: string;
  budgetCapUsd: number;
  useVeo: boolean;
  phraseCount: number;
};

export type ScriptDocumentV2 = {
  id: string;
  idea: string;
  title: string;
  targetDurationSeconds: number;
  phraseCount: number;
  budgetCapUsd: number;
  useVeo: boolean;
  estimatedCost: CostBreakdown;
  actualCost?: CostBreakdown;
  styleBible: StyleBible;
  phrases: PhraseDraft[];
  acts: ActDraft[];
  createdAt?: number;
  updatedAt?: number;
  featureFlags?: {
    legacyFallback?: boolean;
    veoEnabled?: boolean;
  };
};

export type GeneratedAssetKind = "image" | "video" | "audio" | "archive" | "manifest";

export type GeneratedAsset = {
  id: string;
  kind: GeneratedAssetKind;
  filename: string;
  contentType: string;
  path?: string;
  url?: string;
  actIndex?: number;
  createdAt?: number;
  expiresAt?: number;
  sizeBytes?: number;
};

export type JobProgressItem = {
  label: string;
  status: JobStatus;
  detail?: string;
};

export type VisualJobRequestV2 = {
  scriptId: string;
  script: ScriptDocumentV2;
  regenerateActIndex?: number;
  budgetCapUsd: number;
  useVeo: boolean;
};

export type VisualPack = {
  jobId: string;
  status: JobStatus;
  message?: string;
  mode?: "economy" | "hybrid";
  consistencyScore?: number;
  progress: JobProgressItem[];
  images: GeneratedAsset[];
  heroVideo?: GeneratedAsset;
  imageZip?: GeneratedAsset;
  manifest?: GeneratedAsset;
  estimatedCost?: CostBreakdown;
  actualCost?: CostBreakdown;
  expiresAt?: number;
};

export type RenderJobRequestV2 = {
  scriptId: string;
  visualJobId: string;
  script: ScriptDocumentV2;
  visuals: VisualPack;
};

export type RenderPack = {
  jobId: string;
  status: JobStatus;
  message?: string;
  progress: JobProgressItem[];
  finalVideo?: GeneratedAsset;
  narrationAudio?: GeneratedAsset;
  imageZip?: GeneratedAsset;
  heroVideo?: GeneratedAsset;
  manifest?: GeneratedAsset;
  estimatedCost?: CostBreakdown;
  actualCost?: CostBreakdown;
  expiresAt?: number;
};
