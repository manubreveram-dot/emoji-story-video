import { EMOJI_BANK } from "./dictionaries/emoji-bank";
import { DEFAULT_EMOJIS } from "../config/defaults";
import type { SentimentResult } from "./sentiment";

function simpleHash(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash + char) | 0;
  }
  return Math.abs(hash);
}

export function mapEmojis(
  sentiment: SentimentResult,
  text: string,
): string[] {
  const { matchedCategories, intensity } = sentiment;

  if (matchedCategories.length === 0) {
    return [...DEFAULT_EMOJIS];
  }

  // Take top 2 categories by relevance (they're already sorted by match count)
  const topCategories = matchedCategories.slice(0, 2);

  const count = intensity === "high" ? 3 : intensity === "medium" ? 2 : 1;
  const hash = simpleHash(text);
  const result: string[] = [];

  for (const category of topCategories) {
    const bank = EMOJI_BANK[category];
    if (!bank || bank.length === 0) continue;

    for (let i = 0; i < count; i++) {
      const idx = (hash + i * 7 + topCategories.indexOf(category) * 3) % bank.length;
      const emoji = bank[idx];
      if (!result.includes(emoji)) {
        result.push(emoji);
      }
    }
  }

  return result.length > 0 ? result.slice(0, 5) : [...DEFAULT_EMOJIS];
}
