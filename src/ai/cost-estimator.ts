import { API_CONFIG } from "../config/api";
import type { PhaseCostEstimate } from "./v2-types";

export function estimatePipelineCost(options?: {
  imageCount?: number;
  veoSeconds?: number;
  includeVeo?: boolean;
  capUsd?: number;
}): PhaseCostEstimate {
  const imageCount = options?.imageCount ?? 4;
  const veoSeconds = options?.veoSeconds ?? API_CONFIG.veo.clipSeconds;
  const includeVeo = options?.includeVeo ?? API_CONFIG.veo.enabledDefault;
  const capUsd = options?.capUsd ?? API_CONFIG.costs.capUsdDefault;

  const scriptUsd = API_CONFIG.costs.scriptUsdEstimate;
  const imagesUsd = imageCount * API_CONFIG.costs.imageUsdEstimateEach;
  const baseWithoutVeo = scriptUsd + imagesUsd + API_CONFIG.costs.renderUsdEstimate;
  const requestedVeoUsd = includeVeo
    ? veoSeconds * API_CONFIG.costs.veoUsdEstimatePerSecond
    : 0;
  const renderUsd = API_CONFIG.costs.renderUsdEstimate;
  let veoUsd = requestedVeoUsd;
  let veoAllowed = includeVeo;
  let fallbackReason: string | undefined;

  if (includeVeo && baseWithoutVeo + requestedVeoUsd > capUsd) {
    veoUsd = 0;
    veoAllowed = false;
    fallbackReason = `Estimated cost with Veo ${(baseWithoutVeo + requestedVeoUsd).toFixed(2)} exceeds cap ${capUsd.toFixed(2)}. Economy mode enabled.`;
  }

  const totalUsd = scriptUsd + imagesUsd + veoUsd + renderUsd;
  const withinCap = totalUsd <= capUsd;

  if (!withinCap && !fallbackReason) {
    fallbackReason = `Estimated cost ${totalUsd.toFixed(2)} exceeds cap ${capUsd.toFixed(2)} even without Veo.`;
  }

  return {
    scriptUsd,
    imagesUsd,
    veoUsd,
    renderUsd,
    totalUsd,
    capUsd,
    withinCap,
    veoAllowed,
    fallbackReason,
  };
}

export function mergeCostEstimate(
  baseEstimate: PhaseCostEstimate,
  patch: Partial<PhaseCostEstimate>,
): PhaseCostEstimate {
  const merged = {
    ...baseEstimate,
    ...patch,
  };

  merged.totalUsd =
    merged.scriptUsd + merged.imagesUsd + merged.veoUsd + merged.renderUsd;
  merged.withinCap = merged.totalUsd <= merged.capUsd;
  if (!merged.withinCap && merged.veoAllowed) {
    merged.veoAllowed = false;
  }
  if (!merged.veoAllowed && merged.veoUsd > 0) {
    merged.veoUsd = 0;
    merged.totalUsd =
      merged.scriptUsd + merged.imagesUsd + merged.veoUsd + merged.renderUsd;
    merged.withinCap = merged.totalUsd <= merged.capUsd;
  }

  return merged;
}
