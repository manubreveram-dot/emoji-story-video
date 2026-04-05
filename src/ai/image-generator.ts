import { GoogleGenAI } from "@google/genai";
import fs from "fs";
import path from "path";
import { API_CONFIG } from "../config/api";
import { buildImagePrompt } from "./prompts/image-prompt";
import type { ImageStyle, ScriptScene } from "../types/script";
export { generateImagePackV2, generateHeroClipV2 } from "./pipeline-v2";

export type ImageGenerationProgress = {
  sceneId: string;
  status: "pending" | "generating" | "done" | "error";
  imagePath?: string;
  error?: string;
};

type ImageFailureKind =
  | "quota"
  | "permission"
  | "missing_model"
  | "unsupported"
  | "blocked"
  | "transient"
  | "unknown";

class ImageGenerationError extends Error {
  public readonly code: "fatal" | "partial" | "empty";

  constructor(message: string, code: "fatal" | "partial" | "empty") {
    super(message);
    this.name = "ImageGenerationError";
    this.code = code;
  }
}

function normalizeErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message || error.toString();
  }

  if (typeof error === "string") {
    return error;
  }

  try {
    return JSON.stringify(error);
  } catch {
    return String(error);
  }
}

function classifyImageError(message: string): {
  kind: ImageFailureKind;
  shouldFallback: boolean;
  shouldDisableModel: boolean;
  friendlyMessage: string;
} {
  const lower = message.toLowerCase();
  const has = (pattern: string) => lower.includes(pattern);

  if (
    has("quota exceeded") ||
    has("resource_exhausted") ||
    has('"code":429') ||
    has("retry in") ||
    has("rate limit")
  ) {
    return {
      kind: "quota",
      shouldFallback: true,
      shouldDisableModel: true,
      friendlyMessage:
        "This image model hit quota or rate limits. Switching to the next configured model.",
    };
  }

  if (
    has("unauthorized") ||
    has("permission denied") ||
    has('"code":401') ||
    has('"code":403') ||
    has("billing") ||
    has("access denied")
  ) {
    return {
      kind: "permission",
      shouldFallback: true,
      shouldDisableModel: true,
      friendlyMessage:
        "This image model is not authorized for the current key or project. Switching to the next configured model.",
    };
  }

  if (
    has("model not found") ||
    has("not found") ||
    has("does not exist") ||
    has('"code":404')
  ) {
    return {
      kind: "missing_model",
      shouldFallback: true,
      shouldDisableModel: true,
      friendlyMessage:
        "This image model is not available. Switching to the next configured model.",
    };
  }

  if (
    has("not supported") ||
    has("unsupported") ||
    has("unavailable in") ||
    has("invalid argument") ||
    has("only supports") ||
    has('"code":400')
  ) {
    return {
      kind: "unsupported",
      shouldFallback: true,
      shouldDisableModel: true,
      friendlyMessage:
        "This image model is unsupported in the current setup. Switching to the next configured model.",
    };
  }

  if (has("filtered") || has("rai") || has("safety") || has("blocked")) {
    return {
      kind: "blocked",
      shouldFallback: true,
      shouldDisableModel: false,
      friendlyMessage:
        "The current model blocked this prompt. Trying the next configured model.",
    };
  }

  if (
    has("timeout") ||
    has("timed out") ||
    has("deadline exceeded") ||
    has("internal error") ||
    has("unavailable") ||
    has("socket")
  ) {
    return {
      kind: "transient",
      shouldFallback: true,
      shouldDisableModel: false,
      friendlyMessage:
        "The image request failed transiently. Trying the next configured model.",
    };
  }

  return {
    kind: "unknown",
    shouldFallback: false,
    shouldDisableModel: false,
    friendlyMessage: message,
  };
}

function buildFriendlySummary(
  sceneId: string,
  failures: string[],
  fallbackCount: number,
): string {
  const prefix = `Image generation failed for ${sceneId}.`;
  const detail = failures.length > 0 ? ` ${failures.join(" ")}` : "";
  const summary =
    fallbackCount > 0
      ? ` Tried ${fallbackCount + 1} model(s) from the configured fallback list.`
      : "";

  return `${prefix}${detail}${summary}`.trim();
}

function getConfiguredImageModels(): string[] {
  const models = API_CONFIG.gemini.imageModels
    .map((model) => model.trim())
    .filter((model) => model.length > 0);

  return models.length > 0 ? models : [API_CONFIG.gemini.imageModel];
}

function getImageFileExtension(mimeType?: string): string {
  const normalized = (mimeType ?? "").toLowerCase();

  if (normalized.includes("jpeg") || normalized.includes("jpg")) {
    return "jpg";
  }

  if (normalized.includes("webp")) {
    return "webp";
  }

  return "png";
}

function isModelFailure(err: unknown): boolean {
  const message = normalizeErrorMessage(err).toLowerCase();
  return (
    message.includes("quota exceeded") ||
    message.includes("resource_exhausted") ||
    message.includes('"code":429') ||
    message.includes("unauthorized") ||
    message.includes("permission denied") ||
    message.includes('"code":401') ||
    message.includes('"code":403') ||
    message.includes("model not found") ||
    message.includes("not found") ||
    message.includes('"code":404') ||
    message.includes("not supported") ||
    message.includes("unsupported") ||
    message.includes("billing") ||
    message.includes("invalid argument") ||
    message.includes('"code":400') ||
    message.includes("only supports")
  );
}

async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isImagenModel(model: string): boolean {
  return model.toLowerCase().startsWith("imagen-");
}

function writeImageFile(
  sceneId: string,
  outputDir: string,
  imageDataBase64: string,
  mimeType?: string,
): string {
  const filename = `${sceneId}.${getImageFileExtension(mimeType)}`;
  const filePath = path.join(outputDir, filename);

  fs.mkdirSync(outputDir, { recursive: true });
  fs.writeFileSync(filePath, Buffer.from(imageDataBase64, "base64"));

  return filename;
}

async function generateWithImagenApi(
  scene: ScriptScene,
  prompt: string,
  outputDir: string,
  model: string,
  ai: GoogleGenAI,
): Promise<string> {
  const response = await ai.models.generateImages({
    model,
    prompt,
    config: {
      numberOfImages: 1,
      aspectRatio: "9:16",
    },
  });

  const generatedImage = response.generatedImages?.[0]?.image;
  const imageBytes = generatedImage?.imageBytes;

  if (!imageBytes) {
    const raiReason = response.generatedImages?.[0]?.raiFilteredReason;
    if (raiReason) {
      throw new Error(`Image was filtered by safety controls: ${raiReason}`);
    }

    throw new Error(`Model "${model}" returned no image bytes for scene ${scene.id}`);
  }

  return writeImageFile(
    scene.id,
    outputDir,
    imageBytes,
    generatedImage?.mimeType,
  );
}

async function generateWithGeminiContentApi(
  scene: ScriptScene,
  prompt: string,
  outputDir: string,
  model: string,
  ai: GoogleGenAI,
): Promise<string> {
  const response = await ai.models.generateContent({
    model,
    contents: prompt,
    config: {
      responseModalities: ["TEXT", "IMAGE"],
    },
  });

  const parts = response.candidates?.[0]?.content?.parts ?? [];
  for (const part of parts) {
    const mimeType = part.inlineData?.mimeType;
    const imageData = part.inlineData?.data;
    if (mimeType?.startsWith("image/") && imageData) {
      return writeImageFile(scene.id, outputDir, imageData, mimeType);
    }
  }

  throw new Error(`Model "${model}" returned no inline image data for scene ${scene.id}`);
}

async function generateSceneImageWithModel(
  scene: ScriptScene,
  style: ImageStyle,
  outputDir: string,
  model: string,
  ai: GoogleGenAI,
): Promise<string> {
  const prompt = buildImagePrompt(scene, style);

  console.log(`[image-gen] Scene ${scene.id}: trying model "${model}"`);
  console.log(`[image-gen] Scene ${scene.id}: prompt length ${prompt.length} chars`);

  if (isImagenModel(model)) {
    return generateWithImagenApi(scene, prompt, outputDir, model, ai);
  }

  return generateWithGeminiContentApi(scene, prompt, outputDir, model, ai);
}

async function generateSceneImageWithFallback(
  scene: ScriptScene,
  style: ImageStyle,
  outputDir: string,
  ai: GoogleGenAI,
  preferredModel: string | null,
  disabledModels: Set<string>,
): Promise<{ filename: string; model: string }> {
  const configuredModels = getConfiguredImageModels();
  const orderedModels = [
    ...configuredModels.filter(
      (model) => model === preferredModel && !disabledModels.has(model),
    ),
    ...configuredModels.filter(
      (model) => model !== preferredModel && !disabledModels.has(model),
    ),
  ];

  if (orderedModels.length === 0) {
    throw new ImageGenerationError(
      "No usable image models remain after applying the configured fallback list.",
      "fatal",
    );
  }

  const failures: string[] = [];

  for (const model of orderedModels) {
    try {
      const filename = await generateSceneImageWithModel(
        scene,
        style,
        outputDir,
        model,
        ai,
      );

      return { filename, model };
    } catch (err) {
      const message = normalizeErrorMessage(err);
      const classification = classifyImageError(message);
      failures.push(`${model}: ${classification.friendlyMessage}`);

      if (classification.shouldDisableModel || isModelFailure(err)) {
        disabledModels.add(model);
      }

      if (!classification.shouldFallback) {
        throw new ImageGenerationError(
          buildFriendlySummary(scene.id, failures, failures.length - 1),
          "fatal",
        );
      }
    }
  }

  throw new ImageGenerationError(
    buildFriendlySummary(scene.id, failures, failures.length - 1),
    "empty",
  );
}

export async function generateAllImages(
  scenes: ScriptScene[],
  style: ImageStyle,
  outputDir: string,
  onProgress?: (progress: ImageGenerationProgress[]) => void,
): Promise<string[]> {
  const apiKey = API_CONFIG.gemini.apiKey;
  if (!apiKey) {
    throw new ImageGenerationError("GEMINI_API_KEY not set", "fatal");
  }

  const ai = new GoogleGenAI({ apiKey });
  const progress: ImageGenerationProgress[] = scenes.map((scene) => ({
    sceneId: scene.id,
    status: "pending" as const,
  }));

  const imagePaths: string[] = [];
  const disabledModels = new Set<string>();
  let preferredModel: string | null = null;

  for (let i = 0; i < scenes.length; i++) {
    if (i > 0) {
      console.log(
        `[image-gen] Waiting 8s before next scene to reduce quota pressure...`,
      );
      await sleep(8000);
    }

    progress[i].status = "generating";
    onProgress?.(progress);

    try {
      const result = await generateSceneImageWithFallback(
        scenes[i],
        style,
        outputDir,
        ai,
        preferredModel,
        disabledModels,
      );

      preferredModel = result.model;
      progress[i].status = "done";
      progress[i].imagePath = result.filename;
      imagePaths.push(result.filename);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Unknown image generation error";
      progress[i].status = "error";
      progress[i].error = message;
      imagePaths.push("");

      onProgress?.(progress);

      const completed = progress.filter((item) => item.status === "done").length;
      if (completed === 0) {
        throw err instanceof Error
          ? err
          : new ImageGenerationError(message, "fatal");
      }

      continue;
    }

    onProgress?.(progress);
  }

  const successCount = progress.filter((item) => item.status === "done").length;
  const failedScenes = progress.filter((item) => item.status === "error");

  if (successCount === 0) {
    throw new ImageGenerationError(
      "No images were generated. Check that at least one configured model is available and has quota.",
      "empty",
    );
  }

  if (failedScenes.length > 0) {
    throw new ImageGenerationError(
      `Generated ${successCount}/${scenes.length} images. ${failedScenes.length} scene(s) failed.`,
      "partial",
    );
  }

  return imagePaths;
}
