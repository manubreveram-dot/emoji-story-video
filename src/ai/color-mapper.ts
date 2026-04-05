import type { ColorPalette } from "../types/theme";
import { COLOR_PALETTES } from "./dictionaries/color-palettes";
import { DEFAULT_PALETTE } from "../config/defaults";
import type { SentimentResult } from "./sentiment";

export function mapColors(sentiment: SentimentResult): ColorPalette {
  const { dominantCategory, score } = sentiment;

  // Category-based mapping first
  const categoryMap: Record<string, string> = {
    celebration: "energetic",
    sports: "energetic",
    love: "romantic",
    nature: "calm",
    health: "calm",
    sadness: "melancholy",
    anger: "dark",
    farewell: "melancholy",
  };

  const mapped = categoryMap[dominantCategory];
  if (mapped && COLOR_PALETTES[mapped]) {
    return COLOR_PALETTES[mapped];
  }

  // Fall through to score-based
  if (score > 0.3) return COLOR_PALETTES.joyful;
  if (score > 0) return COLOR_PALETTES.calm;
  if (score === 0) return COLOR_PALETTES.neutral;
  if (score > -0.3) return COLOR_PALETTES.melancholy;
  return COLOR_PALETTES.dark;
}
