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
    const summary = actLines.map((line) => line.narration).join(" | ");
    const visualFocus = actLines
      .map((line) => line.visualIntent)
      .join(", ");

    return {
      id: `act-${index + 1}`,
      order: index + 1,
      title: `Act ${index + 1}`,
      lineIds,
      summary,
      visualFocus,
      shotPrompt: visualFocus,
    };
  });
}

export function remapActs(
  lines: ScriptLineV2[],
  groups: Array<[number, number]>,
): VisualActV2[] {
  return buildDefaultActs(lines, groups);
}
