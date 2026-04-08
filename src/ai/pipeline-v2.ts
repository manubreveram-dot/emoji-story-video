import { GoogleGenAI, VideoGenerationReferenceType } from "@google/genai";
import fs from "fs";
import path from "path";
import { API_CONFIG } from "../config/api";
import type { ImageStyle, Script, ScriptScene } from "../types/script";
import { getSceneTreatment } from "../shared/video-layout";
import { buildDefaultActs, remapActs } from "./act-mapper";
import { estimatePipelineCost, mergeCostEstimate } from "./cost-estimator";
import { buildImagePromptV2, buildVeoPromptEnglish } from "./prompts/image-prompt-v2";
import { buildScriptPromptV2 } from "./prompts/script-prompt-v2";
import type {
  GenerateHeroClipOptions,
  GenerateImagePackV2Options,
  GenerateScriptV2Options,
  ImageAssetV2,
  PhaseCostEstimate,
  QualityRubricResult,
  ScriptLineV2,
  ScriptPackageV2,
  StyleBible,
  VeoClipResultV2,
  VisualActV2,
  VisualPackageV2,
} from "./v2-types";

type RawScriptV2Response = {
  title: string;
  language: string;
  style: ImageStyle;
  styleBible: Omit<StyleBible, "artStyle">;
  lines: Array<{
    order: number;
    narration: string;
    mood: ScriptScene["mood"];
    emojis: string[];
    durationSeconds: number;
    visualIntent: string;
  }>;
};

function toTextValue(value: unknown, fallback = ""): string {
  if (typeof value === "string") {
    return value.trim();
  }
  if (typeof value === "number" || typeof value === "boolean") {
    return String(value).trim();
  }
  if (Array.isArray(value)) {
    const joined = value
      .map((item) => toTextValue(item, ""))
      .filter((item) => item.length > 0)
      .join(", ");
    return joined.trim() || fallback;
  }
  if (value && typeof value === "object") {
    try {
      return JSON.stringify(value).trim();
    } catch {
      return fallback;
    }
  }
  return fallback;
}

function toSafeSeed(value: unknown, fallback = 1084): number {
  if (typeof value === "number" && Number.isFinite(value)) {
    return Math.max(1, Math.round(value));
  }
  if (typeof value === "string" && value.trim().length > 0) {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) {
      return Math.max(1, Math.round(parsed));
    }
  }
  return fallback;
}

function parseModelJson<T>(text: string): T {
  const trimmed = text.trim();
  if (!trimmed) {
    throw new Error("Gemini devolvio una respuesta vacia.");
  }

  const candidates: string[] = [trimmed];
  const fenced = trimmed.match(/```json\s*([\s\S]*?)```/i)?.[1];
  if (fenced) {
    candidates.push(fenced.trim());
  }
  const firstBrace = trimmed.indexOf("{");
  const lastBrace = trimmed.lastIndexOf("}");
  if (firstBrace >= 0 && lastBrace > firstBrace) {
    candidates.push(trimmed.slice(firstBrace, lastBrace + 1));
  }

  for (const candidate of candidates) {
    try {
      return JSON.parse(candidate) as T;
    } catch {
      // Intentional no-op: try next candidate.
    }
  }

  throw new Error("No fue posible parsear JSON valido desde la respuesta del modelo.");
}

function createGeminiClient(): GoogleGenAI {
  const apiKey = API_CONFIG.gemini.apiKey;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY not set");
  }

  return new GoogleGenAI({ apiKey });
}

function createVertexClient(): GoogleGenAI | null {
  if (
    !API_CONFIG.veo.vertexEnabled ||
    !API_CONFIG.veo.project ||
    !API_CONFIG.veo.location
  ) {
    return null;
  }

  return new GoogleGenAI({
    vertexai: true,
    project: API_CONFIG.veo.project,
    location: API_CONFIG.veo.location,
  });
}

function normalizeDuration(lines: ScriptLineV2[]): ScriptLineV2[] {
  const target = API_CONFIG.pipelineV2.targetDurationSeconds;
  const current = lines.reduce((sum, line) => sum + line.durationSeconds, 0);
  if (current === target) {
    return lines;
  }

  const adjusted = [...lines];
  let remaining = target;
  for (let index = 0; index < adjusted.length; index++) {
    const linesLeft = adjusted.length - index;
    const isLast = index === adjusted.length - 1;
    const normalizedDuration = isLast
      ? remaining
      : Math.max(2, Math.round(remaining / linesLeft));

    adjusted[index] = {
      ...adjusted[index],
      durationSeconds: normalizedDuration,
    };
    remaining -= normalizedDuration;
  }

  return adjusted;
}

function buildQualityRubric(
  lines: ScriptLineV2[],
  styleBible: StyleBible,
  targetLineCount: number,
): QualityRubricResult {
  const issues: string[] = [];

  if (lines.length !== targetLineCount) {
    issues.push(`Se esperaban ${targetLineCount} lineas y llegaron ${lines.length}.`);
  }

  const totalDuration = lines.reduce((sum, line) => sum + line.durationSeconds, 0);
  if (totalDuration !== API_CONFIG.pipelineV2.targetDurationSeconds) {
    issues.push(
      `La duracion total esperada era ${API_CONFIG.pipelineV2.targetDurationSeconds}s y llego ${totalDuration}s.`,
    );
  }

  if (!styleBible.characterDescriptors.trim()) {
    issues.push("La guia visual debe incluir descriptores estables del protagonista.");
  }

  if (!styleBible.negativePrompt.trim()) {
    issues.push("La guia visual debe incluir un negative prompt.");
  }

  const tooLongLines = lines.filter(
    (line) => line.narration.trim().split(/\s+/).length > 12,
  );
  if (tooLongLines.length > 0) {
    issues.push("Hay lineas de narracion con mas de 12 palabras.");
  }

  return {
    passed: issues.length === 0,
    score: Math.max(0, 100 - issues.length * 20),
    issues,
    attempts: 1,
  };
}

function toScriptLines(rawLines: RawScriptV2Response["lines"]): ScriptLineV2[] {
  return rawLines.map((line, index) => ({
    id: `line-${index + 1}`,
    order: index + 1,
    narration: line.narration.trim(),
    mood: line.mood,
    emojis: line.emojis,
    durationSeconds: Math.max(2, Math.round(line.durationSeconds)),
    visualIntent: line.visualIntent.trim(),
  }));
}

function buildDynamicActGroups(lineCount: number): Array<[number, number]> {
  const ratios = [0, 0.3, 0.5, 0.8, 1];
  const groups: Array<[number, number]> = [];
  let start = 1;

  for (let index = 0; index < 4; index++) {
    const ratioEnd = ratios[index + 1] ?? 1;
    const maxEnd = Math.max(start, Math.round(lineCount * ratioEnd));
    const end = index === 3 ? lineCount : Math.min(lineCount, maxEnd);
    groups.push([start, end]);
    start = Math.min(lineCount, end + 1);
  }

  return groups;
}

function toLegacyScript(
  title: string,
  style: ImageStyle,
  lines: ScriptLineV2[],
): Script {
  const transitions: ScriptScene["transition"][] = ["fade", "slide", "wipe", "flip"];

  const scenes: ScriptScene[] = lines.map((line, index) => ({
    ...getSceneTreatment(index, lines.length),
    id: `scene-${index + 1}`,
    order: index + 1,
    narration: line.narration,
    visualDescription: line.visualIntent,
    mood: line.mood,
    emojis: line.emojis,
    durationSeconds: line.durationSeconds,
    transition: transitions[index % transitions.length],
  }));

  return {
    title,
    totalDurationSeconds: API_CONFIG.pipelineV2.targetDurationSeconds,
    style,
    scenes,
  };
}

function toStyleBible(
  artStyle: string,
  rawStyleBible: RawScriptV2Response["styleBible"],
  idea: string,
): StyleBible {
  const ideaKeywords = idea
    .toLowerCase()
    .split(/\s+/)
    .filter((token) => token.length >= 4)
    .slice(0, 8)
    .join(", ") || "historia emotiva en formato vertical";

  const palette = toTextValue(rawStyleBible.palette, "grises neutros y blancos suaves");
  const lighting = toTextValue(rawStyleBible.lighting, "luz natural cinematografica");
  const camera = toTextValue(rawStyleBible.camera, "vertical 9:16 con profundidad real");
  const characterDescriptors = toTextValue(
    rawStyleBible.characterDescriptors,
    "protagonista coherente en todas las escenas",
  );
  const negativePromptBase = toTextValue(
    rawStyleBible.negativePrompt,
    "piel plastica, manos deformes, ojos irreales, texto en imagen, watermark, artefactos IA, caligrafia",
  );
  const requiredNegative =
    "piel plastica, manos deformes, ojos irreales, texto en imagen, watermark, artefactos IA, caligrafia, carteles legibles";
  const normalizedCharacter = characterDescriptors
    .replace(/\|/g, ", ")
    .replace(/\s+/g, " ")
    .trim();

  return {
    artStyle: toTextValue(artStyle, "realismo fotografico cinematografico"),
    palette: `${palette} | contexto visual: ${ideaKeywords}`,
    lighting,
    camera,
    characterDescriptors: normalizedCharacter,
    negativePrompt: negativePromptBase.includes("artefactos")
      ? negativePromptBase
      : `${negativePromptBase}, ${requiredNegative}`,
    seedBase: toSafeSeed(rawStyleBible.seedBase),
  };
}

function buildScriptPackage(
  idea: string,
  payload: RawScriptV2Response,
  attempts: number,
  costEstimate: PhaseCostEstimate,
  targetLineCount: number,
  actGroups?: Array<[number, number]>,
): ScriptPackageV2 {
  const normalizedLines = normalizeDuration(toScriptLines(payload.lines));
  const styleBible = toStyleBible(payload.style.artStyle, payload.styleBible, idea);
  const quality = buildQualityRubric(normalizedLines, styleBible, targetLineCount);
  quality.attempts = attempts;
  const acts = actGroups
    ? remapActs(normalizedLines, actGroups)
    : buildDefaultActs(normalizedLines);
  const legacyScript = toLegacyScript(payload.title, payload.style, normalizedLines);

  return {
    id: `script-v2-${Date.now()}`,
    title: payload.title.trim(),
    idea,
    language: payload.language.trim(),
    totalDurationSeconds: API_CONFIG.pipelineV2.targetDurationSeconds,
    style: payload.style,
    styleBible,
    lines: normalizedLines,
    acts,
    quality,
    costEstimate,
    legacyScript,
  };
}

async function generateScriptAttempt(
  ai: GoogleGenAI,
  idea: string,
  artStyle: string,
  targetLineCount: number,
): Promise<RawScriptV2Response> {
  const response = await ai.models.generateContent({
    model: API_CONFIG.gemini.scriptModelV2,
    contents: buildScriptPromptV2(
      idea,
      artStyle,
      targetLineCount,
      API_CONFIG.pipelineV2.targetDurationSeconds,
    ),
    config: {
      responseMimeType: "application/json",
    },
  });

  return parseModelJson<RawScriptV2Response>(response.text ?? "");
}

export async function generateScriptV2(
  idea: string,
  artStyle = "realismo fotografico cinematografico",
  options?: GenerateScriptV2Options,
): Promise<ScriptPackageV2> {
  const ai = createGeminiClient();
  const targetLineCount = Math.min(
    API_CONFIG.pipelineV2.maxLineCount,
    Math.max(
      API_CONFIG.pipelineV2.minLineCount,
      Math.round(options?.lineCount ?? API_CONFIG.pipelineV2.defaultLineCount),
    ),
  );
  const baseEstimate = estimatePipelineCost({
    includeVeo: options?.includeVeo ?? API_CONFIG.veo.enabledDefault,
    capUsd: options?.costCapUsd,
  });
  const actGroups =
    options?.actGroups && options.actGroups.length > 0
      ? options.actGroups
      : buildDynamicActGroups(targetLineCount);

  let lastPackage: ScriptPackageV2 | null = null;
  for (let attempt = 1; attempt <= 2; attempt++) {
    const payload = await generateScriptAttempt(
      ai,
      idea,
      artStyle,
      targetLineCount,
    );
    const scriptPackage = buildScriptPackage(
      idea,
      payload,
      attempt,
      baseEstimate,
      targetLineCount,
      actGroups,
    );

    lastPackage = scriptPackage;
    if (scriptPackage.quality.passed) {
      return scriptPackage;
    }
  }

  if (!lastPackage) {
    throw new Error("Failed to generate Script V2");
  }

  return lastPackage;
}

async function translatePromptToEnglish(
  ai: GoogleGenAI,
  text: string,
): Promise<string> {
  if (/^[\x00-\x7F\s.,:;!?'"()/-]+$/.test(text)) {
    return text;
  }

  try {
    const response = await ai.models.generateContent({
      model: API_CONFIG.gemini.translationModel,
      contents: `Translate this visual prompt to natural English. Return only the translation:\n${text}`,
    });

    return (response.text ?? text).trim();
  } catch {
    return text;
  }
}

function ensureOutputDir(outputDir: string): void {
  fs.mkdirSync(outputDir, { recursive: true });
}

function writeBase64Asset(
  outputDir: string,
  filename: string,
  data: string,
): string {
  ensureOutputDir(outputDir);
  const filePath = path.join(outputDir, filename);
  fs.writeFileSync(filePath, Buffer.from(data, "base64"));
  return filename;
}

async function generateSingleActImage(
  ai: GoogleGenAI,
  act: VisualActV2,
  scriptPackage: ScriptPackageV2,
  outputDir: string,
): Promise<ImageAssetV2> {
  const prompt = buildImagePromptV2(
    act,
    scriptPackage.style,
    scriptPackage.styleBible,
  );

  const response = await ai.models.generateImages({
    model: API_CONFIG.gemini.imagePackModel,
    prompt,
    config: {
      numberOfImages: 1,
      aspectRatio: "9:16",
      outputMimeType: "image/png",
      includeRaiReason: true,
    },
  });

  const image = response.generatedImages?.[0]?.image;
  if (!image?.imageBytes) {
    const reason = response.generatedImages?.[0]?.raiFilteredReason;
    throw new Error(
      reason
        ? `Image filtered for ${act.id}: ${reason}`
        : `No image bytes returned for ${act.id}`,
    );
  }

  const filename = writeBase64Asset(
    outputDir,
    `${act.id}.png`,
    image.imageBytes,
  );

  return {
    actId: act.id,
    filename,
    prompt,
    model: API_CONFIG.gemini.imagePackModel,
  };
}

export async function generateImagePackV2(
  scriptPackage: ScriptPackageV2,
  options: GenerateImagePackV2Options,
): Promise<VisualPackageV2> {
  const ai = createGeminiClient();
  const useVeo = options.useVeo ?? scriptPackage.costEstimate.veoAllowed;
  const baseEstimate = estimatePipelineCost({
    imageCount: scriptPackage.acts.length,
    includeVeo: useVeo,
    capUsd: options.costCapUsd,
  });

  const images: ImageAssetV2[] = [];
  for (const act of scriptPackage.acts) {
    images.push(
      await generateSingleActImage(ai, act, scriptPackage, options.outputDir),
    );
  }

  const heroClip = useVeo
    ? await generateHeroClipV2(
        scriptPackage,
        images[0] ?? null,
        {
          outputDir: options.outputDir,
          costCapUsd: options.costCapUsd,
        },
      )
    : {
        enabled: false,
        skippedReason: "Veo disabled for this request.",
      };

  const costEstimate = mergeCostEstimate(baseEstimate, {
    veoAllowed: heroClip.enabled,
    fallbackReason: heroClip.skippedReason,
  });

  return {
    script: scriptPackage,
    styleBible: scriptPackage.styleBible,
    images,
    heroClip,
    costEstimate,
  };
}

function hasVertexAccess(): boolean {
  return Boolean(API_CONFIG.veo.project && API_CONFIG.veo.location);
}

async function pollVeoOperation(
  ai: GoogleGenAI,
  operation: Awaited<ReturnType<GoogleGenAI["models"]["generateVideos"]>>,
): Promise<typeof operation> {
  let currentOperation = operation;

  for (let attempt = 0; attempt < 30; attempt++) {
    if (currentOperation.done) {
      return currentOperation;
    }

    await new Promise((resolve) => setTimeout(resolve, 5000));
    currentOperation = await ai.operations.getVideosOperation({
      operation: currentOperation,
    });
  }

  return currentOperation;
}

export async function generateHeroClipV2(
  scriptPackage: ScriptPackageV2,
  firstImage: ImageAssetV2 | null,
  options: GenerateHeroClipOptions,
): Promise<VeoClipResultV2> {
  const estimate = estimatePipelineCost({
    imageCount: scriptPackage.acts.length,
    includeVeo: API_CONFIG.veo.enabledDefault,
    capUsd: options.costCapUsd,
  });

  if (!estimate.veoAllowed) {
    return {
      enabled: false,
      skippedReason: estimate.fallbackReason ?? "Cost cap disabled Veo.",
    };
  }

  if (!firstImage) {
    return {
      enabled: false,
      skippedReason: "No image available for the hero clip reference.",
    };
  }

  if (!hasVertexAccess()) {
    return {
      enabled: false,
      skippedReason: "Vertex AI credentials are not configured.",
    };
  }

  const vertexClient = createVertexClient();
  if (!vertexClient) {
    return {
      enabled: false,
      skippedReason: "Unable to initialize Vertex AI client.",
    };
  }

  const geminiClient = createGeminiClient();
  const firstAct = scriptPackage.acts[0];
  const translatedSummary = await translatePromptToEnglish(
    geminiClient,
    firstAct.summary,
  );
  const promptEn = buildVeoPromptEnglish(
    firstAct,
    scriptPackage.styleBible,
    translatedSummary,
  );

  try {
    const imageBytes = fs.readFileSync(path.join(options.outputDir, firstImage.filename), {
      encoding: "base64",
    });

    let operation = await vertexClient.models.generateVideos({
      model: API_CONFIG.veo.model,
      source: {
        prompt: promptEn,
      },
      config: {
        aspectRatio: API_CONFIG.veo.aspectRatio,
        resolution: API_CONFIG.veo.resolution,
        durationSeconds: API_CONFIG.veo.clipSeconds,
        referenceImages: [
          {
            image: {
              imageBytes,
              mimeType: "image/png",
            },
            referenceType: VideoGenerationReferenceType.ASSET,
          },
        ],
      },
    });

    operation = await pollVeoOperation(vertexClient, operation);
    const generatedVideo = operation.response?.generatedVideos?.[0];
    if (!generatedVideo) {
      return {
        enabled: false,
        skippedReason: "Veo operation completed without a generated video.",
        operationName: operation.name,
        promptEn,
      };
    }

    const filename = "hero-veo.mp4";
    await vertexClient.files.download({
      file: generatedVideo,
      downloadPath: path.join(options.outputDir, filename),
    });

    return {
      enabled: true,
      model: API_CONFIG.veo.model,
      operationName: operation.name,
      filename,
      promptEn,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return {
      enabled: false,
      skippedReason: `Veo fallback activated: ${message}`,
      promptEn,
    };
  }
}
