const DEFAULT_IMAGE_MODELS = [
  "imagen-4.0-fast-generate-001",
  "gemini-2.0-flash-preview-image-generation",
  "gemini-2.5-flash-image",
];

const DEFAULT_V2_ACT_GROUPS = ["1-3", "4-5", "6-8", "9-10"];

function getBrowserEnv(name: string): string | undefined {
  try {
    const viteEnv = (
      import.meta as unknown as { env?: Record<string, string | undefined> }
    ).env;
    if (!viteEnv) {
      return undefined;
    }

    const exactValue = viteEnv[name];
    if (exactValue && exactValue.trim()) {
      return exactValue.trim();
    }

    const prefixedValue = viteEnv[`VITE_${name}`];
    if (prefixedValue && prefixedValue.trim()) {
      return prefixedValue.trim();
    }
  } catch {
    // Not running in a Vite/browser context.
  }

  return undefined;
}

function getNodeEnv(name: string): string | undefined {
  if (typeof process === "undefined" || !process.env) {
    return undefined;
  }

  const value = process.env[name];
  return value && value.trim() ? value.trim() : undefined;
}

function getEnvValue(name: string): string | undefined {
  return getBrowserEnv(name) ?? getNodeEnv(name);
}

function parseCsvList(rawValue: string | undefined): string[] {
  if (!rawValue) {
    return [];
  }

  return rawValue
    .split(",")
    .map((value) => value.trim())
    .filter((value) => value.length > 0);
}

function getNumberEnv(name: string, fallback: number): number {
  const rawValue = getEnvValue(name);
  if (!rawValue) {
    return fallback;
  }

  const parsed = Number(rawValue);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function getBooleanEnv(name: string, fallback: boolean): boolean {
  const rawValue = getEnvValue(name);
  if (!rawValue) {
    return fallback;
  }

  return ["1", "true", "yes", "on"].includes(rawValue.toLowerCase());
}

function getApiKey(): string {
  const browserKey = getBrowserEnv("GEMINI_API_KEY");
  if (browserKey) {
    return browserKey;
  }

  const nodeKey = getNodeEnv("GEMINI_API_KEY");
  if (nodeKey) {
    return nodeKey;
  }

  return "";
}

function getImageModels(): string[] {
  const configuredModels = parseCsvList(getEnvValue("GEMINI_IMAGE_MODELS"));
  if (configuredModels.length > 0) {
    return configuredModels;
  }

  const singleModel = getEnvValue("GEMINI_IMAGE_MODEL");
  if (singleModel) {
    return [singleModel];
  }

  return DEFAULT_IMAGE_MODELS;
}

function getActGroups(): string[] {
  const configuredGroups = parseCsvList(getEnvValue("V2_ACT_GROUPS"));
  return configuredGroups.length > 0 ? configuredGroups : DEFAULT_V2_ACT_GROUPS;
}

export const API_CONFIG = {
  gemini: {
    get apiKey(): string {
      return getApiKey();
    },
    scriptModel: "gemini-2.5-flash",
    scriptModelV2: "gemini-2.5-flash-lite",
    translationModel: "gemini-2.5-flash-lite",
    get imageModels(): string[] {
      return getImageModels();
    },
    imagePackModel: "imagen-4.0-fast-generate-001",
    get imageModel(): string {
      return getImageModels()[0] ?? DEFAULT_IMAGE_MODELS[0];
    },
  },
  tts: {
    get enabledDefault(): boolean {
      return getBooleanEnv("TTS_ENABLED_DEFAULT", true);
    },
    get model(): string {
      return getEnvValue("TTS_MODEL") ?? "gemini-2.5-flash-preview-tts";
    },
    get languageCode(): string {
      return getEnvValue("TTS_LANGUAGE_CODE") ?? "es-US";
    },
    get voiceName(): string {
      return getEnvValue("TTS_VOICE_NAME") ?? "Kore";
    },
  },
  veo: {
    get enabledDefault(): boolean {
      return getBooleanEnv("VEO_ENABLED_DEFAULT", true);
    },
    get model(): string {
      return getEnvValue("VEO_MODEL") ?? "veo-3.0-fast-generate-preview";
    },
    get clipSeconds(): number {
      return getNumberEnv("VEO_CLIP_SECONDS", 4);
    },
    resolution: "720p" as const,
    aspectRatio: "9:16" as const,
    get vertexEnabled(): boolean {
      return getBooleanEnv("GOOGLE_GENAI_USE_VERTEXAI", false);
    },
    get project(): string {
      return getEnvValue("GOOGLE_CLOUD_PROJECT") ?? "";
    },
    get location(): string {
      return getEnvValue("GOOGLE_CLOUD_LOCATION") ?? "us-central1";
    },
  },
  costs: {
    get capUsdDefault(): number {
      return getNumberEnv("COST_CAP_USD_DEFAULT", 0.5);
    },
    get scriptUsdEstimate(): number {
      return getNumberEnv("SCRIPT_PHASE_USD_ESTIMATE", 0.01);
    },
    get imageUsdEstimateEach(): number {
      return getNumberEnv("IMAGE_PHASE_USD_ESTIMATE_EACH", 0.02);
    },
    get veoUsdEstimatePerSecond(): number {
      return getNumberEnv("VEO_PHASE_USD_ESTIMATE_PER_SECOND", 0.1);
    },
    get renderUsdEstimate(): number {
      return getNumberEnv("RENDER_PHASE_USD_ESTIMATE", 0.01);
    },
  },
  pipelineV2: {
    targetLineCount: 10,
    targetDurationSeconds: 30,
    get actGroups(): string[] {
      return getActGroups();
    },
    get assetTtlMinutes(): number {
      return getNumberEnv("ASSET_TTL_MINUTES", 60);
    },
  },
};
