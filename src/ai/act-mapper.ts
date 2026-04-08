import { API_CONFIG } from "../config/api";
import type { ScriptLineV2, VisualActV2 } from "./v2-types";

function parseRange(rangeText: string): [number, number] {
  const [startText, endText] = rangeText.split("-").map((value) => value.trim());
  const start = Number(startText);
  const end = Number(endText ?? startText);

  if (!Number.isFinite(start) || !Number.isFinite(end)) {
    throw new Error(`Invalid act range "${rangeText}"`);
  }

  return [start, end];
}

function normalizeGroups(
  groups?: Array<[number, number]>,
): Array<[number, number]> {
  if (groups && groups.length > 0) {
    return groups;
  }

  return API_CONFIG.pipelineV2.actGroups.map(parseRange);
}

function normalizeInlineText(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

function clipWords(value: string, maxWords: number): string {
  const words = normalizeInlineText(value).split(" ").filter(Boolean);
  if (words.length <= maxWords) {
    return words.join(" ");
  }
  return `${words.slice(0, maxWords).join(" ")}...`;
}

function uniqueCompact(values: string[], maxItems: number, maxWords: number): string[] {
  const seen = new Set<string>();
  const compacted: string[] = [];

  for (const value of values) {
    const normalized = normalizeInlineText(value);
    if (!normalized) {
      continue;
    }
    const lowered = normalized.toLowerCase();
    if (seen.has(lowered)) {
      continue;
    }
    seen.add(lowered);
    compacted.push(clipWords(normalized, maxWords));
    if (compacted.length >= maxItems) {
      break;
    }
  }

  return compacted;
}

function toNarrativeSummary(lines: ScriptLineV2[]): string {
  if (lines.length === 0) {
    return "";
  }

  const headline = lines[0]?.narration ?? "";
  const pivot = lines[Math.floor(lines.length / 2)]?.narration ?? "";
  const closure = lines[lines.length - 1]?.narration ?? "";

  return uniqueCompact([headline, pivot, closure], 3, 14).join(" | ");
}

function toVisualFocus(lines: ScriptLineV2[]): string {
  const visualIntents = lines.map((line) => line.visualIntent);
  const focus = uniqueCompact(visualIntents, 2, 20).join(". ");
  return focus || "protagonista creible, accion clara y luz cinematografica real";
}

function toShotPrompt(actOrder: number, visualFocus: string): string {
  return [
    `Escena fotografica realista para Acto ${actOrder}.`,
    visualFocus,
    "Composicion limpia, sujeto principal claro, profundidad natural, sin letras ni tipografia.",
  ].join(" ");
}

export function buildDefaultActs(
  lines: ScriptLineV2[],
  groups?: Array<[number, number]>,
): VisualActV2[] {
  const normalizedGroups = normalizeGroups(groups);

  return normalizedGroups.map(([start, end], index) => {
    const actLines = lines.filter(
      (line) => line.order >= start && line.order <= end,
    );
    const lineIds = actLines.map((line) => line.id);
    const summary = toNarrativeSummary(actLines);
    const visualFocus = toVisualFocus(actLines);

    return {
      id: `act-${index + 1}`,
      order: index + 1,
      title: `Act ${index + 1}`,
      lineIds,
      summary,
      visualFocus,
      shotPrompt: toShotPrompt(index + 1, visualFocus),
    };
  });
}

export function remapActs(
  lines: ScriptLineV2[],
  groups: Array<[number, number]>,
): VisualActV2[] {
  return buildDefaultActs(lines, groups);
}
