const DEFAULT_IMAGE_MODELS = [
  "imagen-4.0-fast-generate-001",
  "gemini-2.0-flash-preview-image-generation",
  "gemini-2.5-flash-image",
];

function getBrowserEnv(name: string): string | undefined {
  try {
    const viteEnv = (import.meta as unknown as { env?: Record<string, string | undefined> }).env;
    if (!viteEnv) return undefined;

    const exactValue = viteEnv[name];
    if (exactValue && exactValue.trim()) return exactValue.trim();

    const prefixedValue = viteEnv[`VITE_${name}`];
    if (prefixedValue && prefixedValue.trim()) return prefixedValue.trim();
  } catch {
    // Not in a browser/Vite context.
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

export const API_CONFIG = {
  gemini: {
    get apiKey(): string {
      return getApiKey();
    },
    scriptModel: "gemini-2.5-flash",
    get imageModels(): string[] {
      return getImageModels();
    },
    get imageModel(): string {
      return getImageModels()[0] ?? DEFAULT_IMAGE_MODELS[0];
    },
  },
};
