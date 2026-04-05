import { MAX_SCENES } from "../config/video";

export function splitSentences(input: string): string[] {
  const trimmed = input.trim();
  if (!trimmed) return [];

  // Split on sentence terminators, keeping punctuation with the sentence
  const raw = trimmed
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);

  // If no splits happened (no punctuation), treat the whole input as one sentence
  if (raw.length === 0) return [trimmed];

  // Split long sentences (>60 chars) on commas or conjunctions
  const expanded: string[] = [];
  for (const sentence of raw) {
    if (sentence.length > 60) {
      const parts = sentence
        .split(/,\s*|\s+(?:and|but|or|then|y|pero|o|entonces)\s+/i)
        .map((s) => s.trim())
        .filter((s) => s.length > 0);
      expanded.push(...parts);
    } else {
      expanded.push(sentence);
    }
  }

  // Merge short chunks (<10 chars) with previous
  const merged: string[] = [];
  for (const chunk of expanded) {
    if (chunk.length < 10 && merged.length > 0) {
      merged[merged.length - 1] += " " + chunk;
    } else {
      merged.push(chunk);
    }
  }

  // Cap at MAX_SCENES by merging shortest adjacent pairs
  const result = [...merged];
  while (result.length > MAX_SCENES) {
    let minLen = Infinity;
    let minIdx = 0;
    for (let i = 0; i < result.length - 1; i++) {
      const combined = result[i].length + result[i + 1].length;
      if (combined < minLen) {
        minLen = combined;
        minIdx = i;
      }
    }
    result[minIdx] = result[minIdx] + " " + result[minIdx + 1];
    result.splice(minIdx + 1, 1);
  }

  return result;
}
