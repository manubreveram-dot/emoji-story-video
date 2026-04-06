import fs from "fs";
import path from "path";
import { bundle } from "@remotion/bundler";
import { renderMedia, selectComposition } from "@remotion/renderer";
import { API_CONFIG } from "../../config/api";
import { createFallbackScriptDocument } from "../../shared/fallback-v2";
import { getSceneTreatment } from "../../shared/video-layout";
import { generateNarrationAudio } from "../../ai/tts-generator";
import type { ImageStyle, Script, ScriptScene } from "../../types/script";
import type {
  ActDraft,
  CostBreakdown,
  GeneratedAsset,
  JobProgressItem,
  RenderPack,
  ScriptDocumentV2,
  VisualPack,
} from "../../types/workflow-v2";
import type {
  PhaseCostEstimate,
  ScriptLineV2,
  ScriptPackageV2,
  StyleBible as PipelineStyleBible,
  VisualPackageV2,
} from "../../ai/v2-types";
import { generateImagePackV2, generateScriptV2 } from "../../ai/pipeline-v2";
import { scriptToScenes } from "../../ai/script-to-scenes";

type CreateScriptOptions = {
  idea: string;
  artStyle?: string;
  costCapUsd?: number;
  useVeo?: boolean;
};

type UpdateScriptOptions = Partial<
  Pick<
    ScriptDocumentV2,
    "title" | "phrases" | "acts" | "styleBible" | "budgetCapUsd" | "useVeo"
  >
>;

type AssetEntry = GeneratedAsset & {
  filePath: string;
};

type ScriptRecord = {
  id: string;
  document: ScriptDocumentV2;
  packageV2: ScriptPackageV2;
  createdAt: number;
  updatedAt: number;
};

type VisualRecord = {
  id: string;
  scriptId: string;
  pack: VisualPack;
  createdAt: number;
  updatedAt: number;
};

type RenderRecord = {
  id: string;
  scriptId: string;
  visualJobId: string;
  pack: RenderPack;
  createdAt: number;
  updatedAt: number;
};

const scriptRecords = new Map<string, ScriptRecord>();
const visualRecords = new Map<string, VisualRecord>();
const renderRecords = new Map<string, RenderRecord>();
const assets = new Map<string, AssetEntry>();

const PUBLIC_GENERATED_ROOT = path.resolve("public", "generated");
const OUTPUT_ROOT = path.resolve("output", "v2");
const BUNDLE_ENTRYPOINT = path.resolve("src", "index.ts");

const ASSET_TTL_MINUTES = API_CONFIG.pipelineV2.assetTtlMinutes;
const ASSET_TTL_MS = ASSET_TTL_MINUTES * 60 * 1000;
const CLEANUP_INTERVAL_MS = 5 * 60 * 1000;

let cleanupStarted = false;

const CRC32_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let index = 0; index < 256; index++) {
    let value = index;
    for (let bit = 0; bit < 8; bit++) {
      value = (value & 1) === 1 ? (0xedb88320 ^ (value >>> 1)) : (value >>> 1);
    }
    table[index] = value >>> 0;
  }
  return table;
})();

function now(): number {
  return Date.now();
}

function logJobEvent(event: string, payload: Record<string, unknown>): void {
  const entry = {
    ts: new Date().toISOString(),
    event,
    ...payload,
  };
  console.log(JSON.stringify(entry));
}

function makeId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function ensureDir(dirPath: string): void {
  fs.mkdirSync(dirPath, { recursive: true });
}

function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function isMissingGeminiKeyError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error);
  return message.includes("GEMINI_API_KEY not set");
}

function getContentType(filePath: string, fallback: string): string {
  switch (path.extname(filePath).toLowerCase()) {
    case ".svg":
      return "image/svg+xml";
    case ".json":
      return "application/json";
    case ".zip":
      return "application/zip";
    case ".mp4":
      return "video/mp4";
    case ".png":
      return "image/png";
    case ".jpg":
    case ".jpeg":
      return "image/jpeg";
    case ".webp":
      return "image/webp";
    default:
      return fallback;
  }
}

function toPosixPath(value: string): string {
  return value.replace(/\\/g, "/");
}

function toCostBreakdown(estimate: PhaseCostEstimate): CostBreakdown {
  return {
    scriptUsd: estimate.scriptUsd,
    imagesUsd: estimate.imagesUsd,
    veoUsd: estimate.veoUsd,
    renderUsd: estimate.renderUsd,
    totalUsd: estimate.totalUsd,
  };
}

function toPipelineStyleBible(styleBible: ScriptDocumentV2["styleBible"]): PipelineStyleBible {
  return {
    artStyle: styleBible.artStyle,
    palette: styleBible.palette,
    lighting: styleBible.lighting,
    camera: styleBible.camera,
    characterDescriptors: styleBible.characterDescriptors,
    negativePrompt: styleBible.negativePrompt,
    seedBase: Math.max(1, Math.round(styleBible.seedBase)),
  };
}

function buildDefaultActsFromPhrases(phrases: ScriptDocumentV2["phrases"]): ActDraft[] {
  const groups = [
    [0, 3],
    [3, 5],
    [5, 8],
    [8, 10],
  ];
  return groups.map(([start, end], index) => {
    const subset = phrases.slice(start, end);
    return {
      id: `act-${index + 1}`,
      index,
      title: `Acto ${index + 1}`,
      summary: subset.map((item) => item.text).join(" "),
      phraseIndexes: subset.map((item) => item.index),
      visualPrompt: subset.map((item) => item.text).join(" "),
    };
  });
}

function scriptPackageToDocument(
  scriptPackage: ScriptPackageV2,
  budgetCapUsd: number,
  useVeo: boolean,
): ScriptDocumentV2 {
  const phrases = scriptPackage.lines.map((line, index) => ({
    id: line.id,
    index,
    text: line.narration,
    durationSeconds: line.durationSeconds,
    mood: line.mood,
    emojis: line.emojis,
  }));

  const lineIndexById = new Map<string, number>();
  scriptPackage.lines.forEach((line, index) => {
    lineIndexById.set(line.id, index);
  });

  const acts = scriptPackage.acts.map((act, index) => ({
    id: act.id,
    index,
    title: act.title,
    summary: act.summary,
    phraseIndexes: act.lineIds
      .map((lineId) => lineIndexById.get(lineId))
      .filter((value): value is number => value !== undefined),
    visualPrompt: act.shotPrompt || act.visualFocus || act.summary,
  }));

  const styleBible: ScriptDocumentV2["styleBible"] = {
    artStyle: scriptPackage.styleBible.artStyle,
    palette: scriptPackage.styleBible.palette,
    lighting: scriptPackage.styleBible.lighting,
    camera: scriptPackage.styleBible.camera,
    characterDescriptors: scriptPackage.styleBible.characterDescriptors,
    negativePrompt: scriptPackage.styleBible.negativePrompt,
    consistencyNote: scriptPackage.style.consistency,
    seedBase: scriptPackage.styleBible.seedBase,
  };

  return {
    id: scriptPackage.id,
    idea: scriptPackage.idea,
    title: scriptPackage.title,
    targetDurationSeconds: scriptPackage.totalDurationSeconds,
    budgetCapUsd,
    useVeo,
    estimatedCost: toCostBreakdown(scriptPackage.costEstimate),
    styleBible,
    phrases,
    acts,
    createdAt: now(),
    updatedAt: now(),
    featureFlags: {
      legacyFallback: true,
      veoEnabled: scriptPackage.costEstimate.veoAllowed,
    },
  };
}

function lineForPhrase(
  phrase: ScriptDocumentV2["phrases"][number],
  act: ActDraft | undefined,
): ScriptLineV2 {
  return {
    id: `line-${phrase.index + 1}`,
    order: phrase.index + 1,
    narration: phrase.text,
    mood: phrase.mood,
    emojis: phrase.emojis,
    durationSeconds: phrase.durationSeconds,
    visualIntent: act?.visualPrompt || phrase.text,
  };
}

function toLegacyScript(document: ScriptDocumentV2): Script {
  const transitionCycle: Array<ScriptScene["transition"]> = [
    "fade",
    "slide",
    "wipe",
    "flip",
  ];

  const scenes = document.phrases.map((phrase, index) => {
    const act = document.acts.find((candidate) =>
      candidate.phraseIndexes.includes(index),
    );
    const treatment = getSceneTreatment(index, document.phrases.length);
    return {
      id: `scene-${index + 1}`,
      order: index + 1,
      narration: phrase.text,
      visualDescription: act?.visualPrompt || phrase.text,
      mood: phrase.mood,
      emojis: phrase.emojis,
      durationSeconds: phrase.durationSeconds,
      layout: treatment.layout,
      imageAnimation: treatment.imageAnimation,
      transition:
        index === document.phrases.length - 1
          ? "fade"
          : transitionCycle[index % transitionCycle.length],
    };
  });

  return {
    title: document.title,
    totalDurationSeconds: document.targetDurationSeconds,
    style: {
      artStyle: document.styleBible.artStyle,
      colorTone: document.styleBible.palette,
      consistency: document.styleBible.consistencyNote,
    },
    scenes,
  };
}

function documentToScriptPackage(document: ScriptDocumentV2): ScriptPackageV2 {
  const acts = document.acts.length > 0
    ? document.acts
    : buildDefaultActsFromPhrases(document.phrases);

  const lines: ScriptLineV2[] = document.phrases.map((phrase) => {
    const act = acts.find((candidate) =>
      candidate.phraseIndexes.includes(phrase.index),
    );
    return lineForPhrase(phrase, act);
  });

  return {
    id: document.id,
    title: document.title,
    idea: document.idea,
    language: "es",
    totalDurationSeconds: document.targetDurationSeconds,
    style: {
      artStyle: document.styleBible.artStyle,
      colorTone: document.styleBible.palette,
      consistency: document.styleBible.consistencyNote,
    },
    styleBible: toPipelineStyleBible(document.styleBible),
    lines,
    acts: acts.map((act) => ({
      id: act.id,
      order: act.index + 1,
      title: act.title,
      lineIds: act.phraseIndexes.map((phraseIndex) => `line-${phraseIndex + 1}`),
      summary: act.summary,
      visualFocus: act.summary,
      shotPrompt: act.visualPrompt,
    })),
    quality: {
      passed: true,
      score: 90,
      issues: [],
      attempts: 1,
    },
    costEstimate: {
      scriptUsd: document.estimatedCost.scriptUsd,
      imagesUsd: document.estimatedCost.imagesUsd,
      veoUsd: document.estimatedCost.veoUsd,
      renderUsd: document.estimatedCost.renderUsd,
      totalUsd: document.estimatedCost.totalUsd,
      capUsd: document.budgetCapUsd,
      withinCap: document.estimatedCost.totalUsd <= document.budgetCapUsd,
      veoAllowed: document.useVeo,
    },
    legacyScript: toLegacyScript(document),
  };
}

function withDownloadUrl(asset: GeneratedAsset): GeneratedAsset {
  return {
    ...asset,
    url: `/api/assets/${asset.id}/download`,
  };
}

function registerAsset(
  input: {
    kind: GeneratedAsset["kind"];
    filename: string;
    contentType: string;
    filePath: string;
    actIndex?: number;
  },
): GeneratedAsset {
  const stats = fs.existsSync(input.filePath)
    ? fs.statSync(input.filePath)
    : undefined;
  const id = makeId("asset");
  const relativeGeneratedPath = input.filePath.startsWith(PUBLIC_GENERATED_ROOT)
    ? toPosixPath(path.relative(PUBLIC_GENERATED_ROOT, input.filePath))
    : undefined;

  const entry: AssetEntry = {
    id,
    kind: input.kind,
    filename: input.filename,
    contentType: input.contentType,
    path: relativeGeneratedPath,
    actIndex: input.actIndex,
    createdAt: now(),
    expiresAt: now() + ASSET_TTL_MS,
    sizeBytes: stats?.size,
    filePath: input.filePath,
  };

  assets.set(id, entry);
  return withDownloadUrl(entry);
}

function writeOfflinePlaceholderImage(
  outputDir: string,
  act: ActDraft,
  actIndex: number,
  title: string,
): string {
  ensureDir(outputDir);
  const filename = `${act.id}.svg`;
  const filePath = path.join(outputDir, filename);
  const palette = ["#1f2937", "#7c3aed", "#f59e0b", "#14b8a6"];
  const accent = palette[actIndex % palette.length];
  const subtitle = `${title} - Acto ${actIndex + 1}`;

  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1920" viewBox="0 0 1080 1920">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0f172a" />
      <stop offset="100%" stop-color="${accent}" />
    </linearGradient>
  </defs>
  <rect width="1080" height="1920" fill="url(#bg)" />
  <circle cx="860" cy="320" r="220" fill="rgba(255,255,255,0.12)" />
  <circle cx="240" cy="1500" r="300" fill="rgba(255,255,255,0.08)" />
  <rect x="96" y="160" width="888" height="1600" rx="56" fill="rgba(15,23,42,0.45)" stroke="rgba(255,255,255,0.2)" />
  <text x="140" y="280" fill="#f8fafc" font-size="44" font-family="Arial, sans-serif">Offline preview</text>
  <text x="140" y="360" fill="#e2e8f0" font-size="64" font-weight="700" font-family="Arial, sans-serif">${escapeXml(
    subtitle,
  )}</text>
  <foreignObject x="140" y="460" width="800" height="360">
    <div xmlns="http://www.w3.org/1999/xhtml" style="font-family: Arial, sans-serif; color: white; font-size: 44px; line-height: 1.3;">
      ${escapeXml(act.summary)}
    </div>
  </foreignObject>
  <foreignObject x="140" y="920" width="800" height="520">
    <div xmlns="http://www.w3.org/1999/xhtml" style="font-family: Arial, sans-serif; color: #e2e8f0; font-size: 34px; line-height: 1.45;">
      ${escapeXml(act.visualPrompt)}
    </div>
  </foreignObject>
  <text x="140" y="1690" fill="#fde68a" font-size="30" font-family="Arial, sans-serif">Generated without Gemini credentials to unblock local desktop debugging.</text>
</svg>`;

  fs.writeFileSync(filePath, svg, "utf8");
  return filename;
}

function createOfflineVisualPackage(
  scriptRecord: ScriptRecord,
  outputDir: string,
): VisualPackageV2 {
  const images = scriptRecord.document.acts.map((act, actIndex) => ({
    actId: act.id,
    filename: writeOfflinePlaceholderImage(
      outputDir,
      act,
      actIndex,
      scriptRecord.document.title,
    ),
    prompt: act.visualPrompt,
    model: "offline-placeholder",
  }));

  return {
    script: scriptRecord.packageV2,
    styleBible: scriptRecord.packageV2.styleBible,
    images,
    heroClip: {
      enabled: false,
      skippedReason: "Offline preview mode enabled because GEMINI_API_KEY is missing.",
    },
    costEstimate: {
      scriptUsd: 0,
      imagesUsd: 0,
      veoUsd: 0,
      renderUsd: 0,
      totalUsd: 0,
      capUsd: scriptRecord.document.budgetCapUsd,
      withinCap: true,
      veoAllowed: false,
      fallbackReason:
        "Offline preview mode enabled because GEMINI_API_KEY is missing.",
    },
  };
}

function crc32(data: Buffer): number {
  let crc = 0xffffffff;
  for (let index = 0; index < data.length; index++) {
    const tableIndex = (crc ^ data[index]) & 0xff;
    crc = (crc >>> 8) ^ CRC32_TABLE[tableIndex];
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function toDosDateTime(timestampMs: number): { dosDate: number; dosTime: number } {
  const date = new Date(timestampMs);
  const year = Math.max(1980, date.getFullYear());
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const hour = date.getHours();
  const minute = date.getMinutes();
  const second = Math.floor(date.getSeconds() / 2);

  const dosDate = ((year - 1980) << 9) | (month << 5) | day;
  const dosTime = (hour << 11) | (minute << 5) | second;
  return { dosDate, dosTime };
}

async function createImagesArchive(
  outputPath: string,
  files: Array<{ absPath: string; name: string }>,
): Promise<void> {
  ensureDir(path.dirname(outputPath));
  const localParts: Buffer[] = [];
  const centralParts: Buffer[] = [];
  let localOffset = 0;

  for (const file of files) {
    const name = file.name.replace(/\\/g, "/");
    const nameBuffer = Buffer.from(name, "utf8");
    const content = fs.readFileSync(file.absPath);
    const stats = fs.statSync(file.absPath);
    const checksum = crc32(content);
    const { dosDate, dosTime } = toDosDateTime(stats.mtimeMs);

    const localHeader = Buffer.alloc(30 + nameBuffer.length);
    localHeader.writeUInt32LE(0x04034b50, 0);
    localHeader.writeUInt16LE(20, 4);
    localHeader.writeUInt16LE(0, 6);
    localHeader.writeUInt16LE(0, 8);
    localHeader.writeUInt16LE(dosTime, 10);
    localHeader.writeUInt16LE(dosDate, 12);
    localHeader.writeUInt32LE(checksum, 14);
    localHeader.writeUInt32LE(content.length, 18);
    localHeader.writeUInt32LE(content.length, 22);
    localHeader.writeUInt16LE(nameBuffer.length, 26);
    localHeader.writeUInt16LE(0, 28);
    nameBuffer.copy(localHeader, 30);

    localParts.push(localHeader, content);

    const centralHeader = Buffer.alloc(46 + nameBuffer.length);
    centralHeader.writeUInt32LE(0x02014b50, 0);
    centralHeader.writeUInt16LE(20, 4);
    centralHeader.writeUInt16LE(20, 6);
    centralHeader.writeUInt16LE(0, 8);
    centralHeader.writeUInt16LE(0, 10);
    centralHeader.writeUInt16LE(dosTime, 12);
    centralHeader.writeUInt16LE(dosDate, 14);
    centralHeader.writeUInt32LE(checksum, 16);
    centralHeader.writeUInt32LE(content.length, 20);
    centralHeader.writeUInt32LE(content.length, 24);
    centralHeader.writeUInt16LE(nameBuffer.length, 28);
    centralHeader.writeUInt16LE(0, 30);
    centralHeader.writeUInt16LE(0, 32);
    centralHeader.writeUInt16LE(0, 34);
    centralHeader.writeUInt16LE(0, 36);
    centralHeader.writeUInt32LE(0, 38);
    centralHeader.writeUInt32LE(localOffset, 42);
    nameBuffer.copy(centralHeader, 46);

    centralParts.push(centralHeader);
    localOffset += localHeader.length + content.length;
  }

  const centralDirectory = Buffer.concat(centralParts);
  const endHeader = Buffer.alloc(22);
  endHeader.writeUInt32LE(0x06054b50, 0);
  endHeader.writeUInt16LE(0, 4);
  endHeader.writeUInt16LE(0, 6);
  endHeader.writeUInt16LE(files.length, 8);
  endHeader.writeUInt16LE(files.length, 10);
  endHeader.writeUInt32LE(centralDirectory.length, 12);
  endHeader.writeUInt32LE(localOffset, 16);
  endHeader.writeUInt16LE(0, 20);

  const archiveBuffer = Buffer.concat([...localParts, centralDirectory, endHeader]);
  fs.writeFileSync(outputPath, archiveBuffer);
}

function writeManifest(
  jobType: "visual" | "render",
  jobId: string,
  payload: unknown,
): GeneratedAsset {
  const manifestDir = path.join(OUTPUT_ROOT, "manifests");
  ensureDir(manifestDir);
  const filename = `${jobType}-${jobId}.manifest.json`;
  const filePath = path.join(manifestDir, filename);
  fs.writeFileSync(filePath, JSON.stringify(payload, null, 2), "utf8");
  return registerAsset({
    kind: "manifest",
    filename,
    contentType: "application/json",
    filePath,
  });
}

function buildVisualProgress(
  status: JobProgressItem["status"],
  detail?: string,
): JobProgressItem[] {
  return [
    {
      label: "Style Bible",
      status: status === "pending" ? "pending" : "done",
    },
    {
      label: "Image pack",
      status,
      detail,
    },
    {
      label: "Veo hero",
      status: "pending",
    },
  ];
}

function createBundleLocation(): Promise<string> {
  return bundle({
    entryPoint: BUNDLE_ENTRYPOINT,
    webpackOverride: (config) => config,
  });
}

function normalizeVisualPack(pack: VisualPack): VisualPack {
  return {
    ...pack,
    images: pack.images.map(withDownloadUrl),
    heroVideo: pack.heroVideo ? withDownloadUrl(pack.heroVideo) : undefined,
    imageZip: pack.imageZip ? withDownloadUrl(pack.imageZip) : undefined,
    manifest: pack.manifest ? withDownloadUrl(pack.manifest) : undefined,
  };
}

function normalizeRenderPack(pack: RenderPack): RenderPack {
  return {
    ...pack,
    finalVideo: pack.finalVideo ? withDownloadUrl(pack.finalVideo) : undefined,
    narrationAudio: pack.narrationAudio
      ? withDownloadUrl(pack.narrationAudio)
      : undefined,
    imageZip: pack.imageZip ? withDownloadUrl(pack.imageZip) : undefined,
    heroVideo: pack.heroVideo ? withDownloadUrl(pack.heroVideo) : undefined,
    manifest: pack.manifest ? withDownloadUrl(pack.manifest) : undefined,
  };
}

export function startCleanupLoop(): void {
  if (cleanupStarted) {
    return;
  }
  cleanupStarted = true;

  const runCleanup = () => {
    const deadline = now();
    for (const [assetId, asset] of assets.entries()) {
      if ((asset.expiresAt ?? 0) > deadline) {
        continue;
      }
      if (fs.existsSync(asset.filePath)) {
        fs.rmSync(asset.filePath, { force: true });
      }
      assets.delete(assetId);
    }

    for (const [id, record] of scriptRecords.entries()) {
      if (record.updatedAt + ASSET_TTL_MS <= deadline) {
        scriptRecords.delete(id);
      }
    }
    for (const [id, record] of visualRecords.entries()) {
      if (record.updatedAt + ASSET_TTL_MS <= deadline) {
        visualRecords.delete(id);
      }
    }
    for (const [id, record] of renderRecords.entries()) {
      if (record.updatedAt + ASSET_TTL_MS <= deadline) {
        renderRecords.delete(id);
      }
    }
  };

  setInterval(runCleanup, CLEANUP_INTERVAL_MS).unref?.();
}

export function getScriptDraft(scriptId: string): ScriptDocumentV2 | undefined {
  return scriptRecords.get(scriptId)?.document;
}

export async function createScriptDraft(
  options: CreateScriptOptions,
): Promise<ScriptDocumentV2> {
  const budgetCapUsd = options.costCapUsd ?? API_CONFIG.costs.capUsdDefault;
  const useVeo = options.useVeo ?? API_CONFIG.veo.enabledDefault;
  let document: ScriptDocumentV2;
  let scriptPackage: ScriptPackageV2;

  try {
    scriptPackage = await generateScriptV2(
      options.idea,
      options.artStyle || "cinematic spiritual realism",
      {
        costCapUsd: budgetCapUsd,
        includeVeo: useVeo,
      },
    );
    document = scriptPackageToDocument(scriptPackage, budgetCapUsd, useVeo);
  } catch (error) {
    if (!isMissingGeminiKeyError(error)) {
      throw error;
    }

    document = createFallbackScriptDocument(
      options.idea,
      options.artStyle || "cinematic spiritual realism",
      budgetCapUsd,
      useVeo,
    );
    scriptPackage = documentToScriptPackage(document);
  }

  const record: ScriptRecord = {
    id: document.id,
    document,
    packageV2: scriptPackage,
    createdAt: now(),
    updatedAt: now(),
  };
  scriptRecords.set(document.id, record);
  logJobEvent("script.v2.created", {
    scriptId: document.id,
    capUsd: budgetCapUsd,
    useVeo,
    estimatedTotalUsd: document.estimatedCost.totalUsd,
    withinCap: document.estimatedCost.totalUsd <= budgetCapUsd,
  });
  return document;
}

export function updateScriptDraft(
  scriptId: string,
  options: UpdateScriptOptions,
): ScriptDocumentV2 {
  const current = scriptRecords.get(scriptId);
  if (!current) {
    throw new Error("Script V2 draft not found.");
  }

  const nextDocument: ScriptDocumentV2 = {
    ...current.document,
    title: options.title ?? current.document.title,
    phrases: options.phrases ?? current.document.phrases,
    acts: options.acts ?? current.document.acts,
    styleBible: options.styleBible ?? current.document.styleBible,
    budgetCapUsd: options.budgetCapUsd ?? current.document.budgetCapUsd,
    useVeo: options.useVeo ?? current.document.useVeo,
    updatedAt: now(),
  };

  const nextPackage = documentToScriptPackage(nextDocument);
  scriptRecords.set(scriptId, {
    ...current,
    document: nextDocument,
    packageV2: nextPackage,
    updatedAt: now(),
  });
  return nextDocument;
}

export function getVisualJob(jobId: string): VisualPack | undefined {
  const record = visualRecords.get(jobId);
  if (!record) {
    return undefined;
  }
  return normalizeVisualPack(record.pack);
}

export async function createVisualJob(
  scriptId: string,
  regenerateActIndex?: number,
): Promise<VisualPack> {
  const scriptRecord = scriptRecords.get(scriptId);
  if (!scriptRecord) {
    throw new Error("Script V2 draft not found.");
  }

  const jobId = makeId("visual");
  const initialPack: VisualPack = {
    jobId,
    status: "pending",
    message:
      regenerateActIndex === undefined
        ? "Visual job queued."
        : `Regeneration requested for act ${regenerateActIndex + 1}.`,
    mode: "economy",
    consistencyScore: 0,
    progress: buildVisualProgress("pending"),
    images: [],
    estimatedCost: scriptRecord.document.estimatedCost,
  };

  visualRecords.set(jobId, {
    id: jobId,
    scriptId,
    pack: initialPack,
    createdAt: now(),
    updatedAt: now(),
  });
  logJobEvent("visual.v2.queued", {
    jobId,
    scriptId,
    regenerateActIndex,
  });

  void runVisualJob(jobId);
  return initialPack;
}

async function runVisualJob(jobId: string): Promise<void> {
  const visualRecord = visualRecords.get(jobId);
  if (!visualRecord) {
    return;
  }
  const scriptRecord = scriptRecords.get(visualRecord.scriptId);
  if (!scriptRecord) {
    visualRecord.pack.status = "error";
    visualRecord.pack.message = "Script draft no longer exists.";
    visualRecord.updatedAt = now();
    return;
  }

  visualRecord.pack.status = "running";
  visualRecord.pack.progress = buildVisualProgress("running", "0/4");
  visualRecord.pack.message = "Generating 4 consistent visuals...";
  visualRecord.updatedAt = now();
  logJobEvent("visual.v2.started", {
    jobId,
    scriptId: visualRecord.scriptId,
  });

  try {
    const outputDir = path.join(PUBLIC_GENERATED_ROOT, "v2", jobId);
    ensureDir(outputDir);

    let visualPackage: VisualPackageV2;
    try {
      visualPackage = await generateImagePackV2(
        scriptRecord.packageV2,
        {
          outputDir,
          costCapUsd: scriptRecord.document.budgetCapUsd,
          useVeo: scriptRecord.document.useVeo,
        },
      );
    } catch (error) {
      if (!isMissingGeminiKeyError(error)) {
        throw error;
      }

      visualPackage = createOfflineVisualPackage(scriptRecord, outputDir);
    }

    const imageAssets = visualPackage.images.map((image, index) =>
      registerAsset({
        kind: "image",
        filename: image.filename,
        contentType: getContentType(
          path.join(outputDir, image.filename),
          "image/png",
        ),
        filePath: path.join(outputDir, image.filename),
        actIndex: index,
      }),
    );

    let heroVideo: GeneratedAsset | undefined;
    if (visualPackage.heroClip.enabled && visualPackage.heroClip.filename) {
      const heroPath = path.join(outputDir, visualPackage.heroClip.filename);
      if (fs.existsSync(heroPath)) {
        heroVideo = registerAsset({
          kind: "video",
          filename: visualPackage.heroClip.filename,
          contentType: "video/mp4",
          filePath: heroPath,
        });
      }
    }

    const archivePath = path.join(OUTPUT_ROOT, "archives", `${jobId}-images.zip`);
    await createImagesArchive(
      archivePath,
      imageAssets.map((asset) => ({
        absPath: (assets.get(asset.id) as AssetEntry).filePath,
        name: asset.filename,
      })),
    );
    const imageZip = registerAsset({
      kind: "archive",
      filename: `${jobId}-images.zip`,
      contentType: "application/zip",
      filePath: archivePath,
    });

    const manifest = writeManifest("visual", jobId, {
      scriptId: scriptRecord.document.id,
      visualJobId: jobId,
      createdAt: now(),
      images: imageAssets.map((asset) => asset.id),
      heroVideo: heroVideo?.id,
      imageZip: imageZip.id,
      costEstimate: visualPackage.costEstimate,
    });

    visualRecord.pack = {
      ...visualRecord.pack,
      status: "done",
      message: "Visual pack ready.",
      mode: heroVideo ? "hybrid" : "economy",
      consistencyScore: imageAssets.length === 4 ? 92 : 75,
      progress: [
        { label: "Style Bible", status: "done" },
        { label: "Image pack", status: "done", detail: `${imageAssets.length}/4` },
        {
          label: "Veo hero",
          status: heroVideo ? "done" : "pending",
          detail: heroVideo ? "Generated" : visualPackage.heroClip.skippedReason,
        },
      ],
      images: imageAssets,
      heroVideo,
      imageZip,
      manifest,
      estimatedCost: scriptRecord.document.estimatedCost,
      actualCost: toCostBreakdown(visualPackage.costEstimate),
      expiresAt: now() + ASSET_TTL_MS,
    };
    visualRecord.updatedAt = now();
    logJobEvent("visual.v2.done", {
      jobId,
      scriptId: visualRecord.scriptId,
      mode: visualRecord.pack.mode,
      imageCount: imageAssets.length,
      estimatedTotalUsd: visualRecord.pack.estimatedCost?.totalUsd,
      actualTotalUsd: visualRecord.pack.actualCost?.totalUsd,
      fallbackReason: visualPackage.costEstimate.fallbackReason,
    });
  } catch (error) {
    visualRecord.pack.status = "error";
    visualRecord.pack.message =
      error instanceof Error ? error.message : "Visual generation failed.";
    visualRecord.pack.progress = [
      { label: "Style Bible", status: "done" },
      { label: "Image pack", status: "error" },
      { label: "Veo hero", status: "pending" },
    ];
    visualRecord.updatedAt = now();
    logJobEvent("visual.v2.error", {
      jobId,
      scriptId: visualRecord.scriptId,
      error: visualRecord.pack.message,
    });
  }
}

export function getRenderJob(jobId: string): RenderPack | undefined {
  const record = renderRecords.get(jobId);
  if (!record) {
    return undefined;
  }
  return normalizeRenderPack(record.pack);
}

export async function createRenderJob(
  scriptId: string,
  visualJobId: string,
): Promise<RenderPack> {
  const scriptRecord = scriptRecords.get(scriptId);
  if (!scriptRecord) {
    throw new Error("Script V2 draft not found.");
  }

  const visualRecord = visualRecords.get(visualJobId);
  if (!visualRecord || visualRecord.pack.status !== "done") {
    throw new Error("Visual job is not ready.");
  }

  const jobId = makeId("render");
  const initialPack: RenderPack = {
    jobId,
    status: "pending",
    message: "Render job queued.",
    progress: [
      { label: "Collect assets", status: "pending" },
      { label: "Narration", status: "pending" },
      { label: "Compose Remotion", status: "pending" },
      { label: "Export MP4", status: "pending" },
    ],
    imageZip: visualRecord.pack.imageZip,
    heroVideo: visualRecord.pack.heroVideo,
    estimatedCost: scriptRecord.document.estimatedCost,
  };

  renderRecords.set(jobId, {
    id: jobId,
    scriptId,
    visualJobId,
    pack: initialPack,
    createdAt: now(),
    updatedAt: now(),
  });
  logJobEvent("render.v2.queued", {
    jobId,
    scriptId,
    visualJobId,
  });

  void runRenderJob(jobId);
  return initialPack;
}

async function runRenderJob(jobId: string): Promise<void> {
  const renderRecord = renderRecords.get(jobId);
  if (!renderRecord) {
    return;
  }
  const scriptRecord = scriptRecords.get(renderRecord.scriptId);
  const visualRecord = visualRecords.get(renderRecord.visualJobId);
  if (!scriptRecord || !visualRecord || visualRecord.pack.status !== "done") {
    renderRecord.pack.status = "error";
    renderRecord.pack.message = "Missing prerequisites for render.";
    renderRecord.updatedAt = now();
    return;
  }

  renderRecord.pack.status = "running";
  renderRecord.pack.progress = [
    { label: "Collect assets", status: "running" },
    { label: "Narration", status: "pending" },
    { label: "Compose Remotion", status: "pending" },
    { label: "Export MP4", status: "pending" },
  ];
  renderRecord.pack.message = "Preparing render...";
  renderRecord.updatedAt = now();
  logJobEvent("render.v2.started", {
    jobId,
    scriptId: renderRecord.scriptId,
    visualJobId: renderRecord.visualJobId,
  });

  try {
    const legacyScript = toLegacyScript(scriptRecord.document);
    const imageByActIndex = new Map<number, string>();
    visualRecord.pack.images.forEach((imageAsset, index) => {
      imageByActIndex.set(imageAsset.actIndex ?? index, imageAsset.path || "");
    });

    const imagePaths = scriptRecord.document.phrases.map((_, phraseIndex) => {
      const actIndex = scriptRecord.document.acts.findIndex((act) =>
        act.phraseIndexes.includes(phraseIndex),
      );
      return imageByActIndex.get(actIndex >= 0 ? actIndex : 0) ?? "";
    });

    const scenes = scriptToScenes(legacyScript, imagePaths);
    let narrationAudio: GeneratedAsset | undefined;

    renderRecord.pack.progress = [
      { label: "Collect assets", status: "done" },
      { label: "Narration", status: "running" },
      { label: "Compose Remotion", status: "running" },
      { label: "Export MP4", status: "pending" },
    ];
    renderRecord.pack.message = "Preparing narration...";
    renderRecord.updatedAt = now();

    try {
      const narrationDir = path.join(PUBLIC_GENERATED_ROOT, "renders", jobId);
      const narrationResult = await generateNarrationAudio(
        scriptRecord.document,
        narrationDir,
      );

      if (narrationResult) {
        narrationAudio = registerAsset({
          kind: "audio",
          filename: narrationResult.filename,
          contentType: narrationResult.contentType,
          filePath: narrationResult.filePath,
        });
        logJobEvent("audio.v2.done", {
          jobId,
          scriptId: renderRecord.scriptId,
          model: narrationResult.model,
          assetId: narrationAudio.id,
        });
      } else {
        logJobEvent("audio.v2.skipped", {
          jobId,
          scriptId: renderRecord.scriptId,
          reason: "TTS disabled or missing Gemini API key.",
        });
      }
    } catch (error) {
      logJobEvent("audio.v2.error", {
        jobId,
        scriptId: renderRecord.scriptId,
        error: error instanceof Error ? error.message : String(error),
      });
    }

    const bundleLocation = await createBundleLocation();
    renderRecord.pack.progress = [
      { label: "Collect assets", status: "done" },
      {
        label: "Narration",
        status: narrationAudio ? "done" : "pending",
        detail: narrationAudio ? "Gemini TTS ready" : "Skipped",
      },
      { label: "Compose Remotion", status: "running" },
      { label: "Export MP4", status: "pending" },
    ];
    renderRecord.pack.message = "Bundling composition...";
    renderRecord.updatedAt = now();

    const composition = await selectComposition({
      serveUrl: bundleLocation,
      id: "EmojiStoryVideo",
      inputProps: {
        scenes,
        audioUrl: narrationAudio?.path,
      },
    });

    const outputDir = path.join(OUTPUT_ROOT, "renders", jobId);
    ensureDir(outputDir);
    const outputFile = path.join(outputDir, "final.mp4");

    renderRecord.pack.progress = [
      { label: "Collect assets", status: "done" },
      {
        label: "Narration",
        status: narrationAudio ? "done" : "pending",
        detail: narrationAudio ? "Gemini TTS ready" : "Skipped",
      },
      { label: "Compose Remotion", status: "done" },
      { label: "Export MP4", status: "running" },
    ];
    renderRecord.pack.message = "Rendering MP4...";
    renderRecord.updatedAt = now();

    await renderMedia({
      composition,
      serveUrl: bundleLocation,
      codec: "h264",
      outputLocation: outputFile,
      inputProps: {
        scenes,
        audioUrl: narrationAudio?.path,
      },
      crf: 20,
    });

    const finalVideo = registerAsset({
      kind: "video",
      filename: `story-${jobId}.mp4`,
      contentType: "video/mp4",
      filePath: outputFile,
    });

    const actualCost: CostBreakdown = {
      scriptUsd: scriptRecord.document.estimatedCost.scriptUsd,
      imagesUsd: visualRecord.pack.actualCost?.imagesUsd ?? scriptRecord.document.estimatedCost.imagesUsd,
      veoUsd: visualRecord.pack.actualCost?.veoUsd ?? 0,
      renderUsd: scriptRecord.document.estimatedCost.renderUsd,
      totalUsd:
        scriptRecord.document.estimatedCost.scriptUsd +
        (visualRecord.pack.actualCost?.imagesUsd ?? scriptRecord.document.estimatedCost.imagesUsd) +
        (visualRecord.pack.actualCost?.veoUsd ?? 0) +
        scriptRecord.document.estimatedCost.renderUsd,
    };

    const manifest = writeManifest("render", jobId, {
      scriptId: scriptRecord.document.id,
      visualJobId: visualRecord.id,
      renderJobId: jobId,
      createdAt: now(),
      finalVideo: finalVideo.id,
      narrationAudio: narrationAudio?.id,
      imageZip: visualRecord.pack.imageZip?.id,
      heroVideo: visualRecord.pack.heroVideo?.id,
      cost: actualCost,
    });

    renderRecord.pack = {
      ...renderRecord.pack,
      status: "done",
      message: "Render complete. Files ready to download.",
      progress: [
        { label: "Collect assets", status: "done" },
        {
          label: "Narration",
          status: narrationAudio ? "done" : "pending",
          detail: narrationAudio ? "Gemini TTS ready" : "Skipped",
        },
        { label: "Compose Remotion", status: "done" },
        { label: "Export MP4", status: "done" },
      ],
      finalVideo,
      narrationAudio,
      imageZip: visualRecord.pack.imageZip,
      heroVideo: visualRecord.pack.heroVideo,
      manifest,
      estimatedCost: scriptRecord.document.estimatedCost,
      actualCost,
      expiresAt: now() + ASSET_TTL_MS,
    };
    renderRecord.updatedAt = now();
    logJobEvent("render.v2.done", {
      jobId,
      scriptId: renderRecord.scriptId,
      visualJobId: renderRecord.visualJobId,
      estimatedTotalUsd: renderRecord.pack.estimatedCost?.totalUsd,
      actualTotalUsd: renderRecord.pack.actualCost?.totalUsd,
      finalVideoAssetId: finalVideo.id,
    });
  } catch (error) {
    renderRecord.pack.status = "error";
    renderRecord.pack.message =
      error instanceof Error ? error.message : "Render failed.";
    renderRecord.pack.progress = [
      { label: "Collect assets", status: "done" },
      {
        label: "Narration",
        status: renderRecord.pack.narrationAudio ? "done" : "pending",
      },
      { label: "Compose Remotion", status: "error" },
      { label: "Export MP4", status: "pending" },
    ];
    renderRecord.updatedAt = now();
    logJobEvent("render.v2.error", {
      jobId,
      scriptId: renderRecord.scriptId,
      visualJobId: renderRecord.visualJobId,
      error: renderRecord.pack.message,
    });
  }
}

export function getAsset(assetId: string): GeneratedAsset | undefined {
  const asset = assets.get(assetId);
  if (!asset) {
    return undefined;
  }
  if ((asset.expiresAt ?? 0) <= now()) {
    return undefined;
  }
  return withDownloadUrl(asset);
}

export function getAssetFilePath(assetId: string): string | undefined {
  const asset = assets.get(assetId);
  if (!asset) {
    return undefined;
  }
  if ((asset.expiresAt ?? 0) <= now()) {
    return undefined;
  }
  return asset.filePath;
}
