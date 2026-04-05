import { KEYWORD_CATEGORIES } from "./dictionaries/keywords";

export type SentimentResult = {
  score: number;
  dominantCategory: string;
  matchedCategories: string[];
  intensity: "low" | "medium" | "high";
};

export function analyzeSentiment(text: string): SentimentResult {
  const lower = text.toLowerCase();
  const tokens = lower.split(/[\s,;:'"()\[\]{}]+/).filter((t) => t.length > 1);

  const categoryMatches: Record<string, { count: number; valence: number; weight: number }> = {};

  for (const token of tokens) {
    for (const category of KEYWORD_CATEGORIES) {
      const matched = category.keywords.some((kw) => {
        if (kw.includes(" ")) {
          return lower.includes(kw);
        }
        return token === kw;
      });

      if (matched) {
        if (!categoryMatches[category.name]) {
          categoryMatches[category.name] = {
            count: 0,
            valence: category.valence,
            weight: category.weight,
          };
        }
        categoryMatches[category.name].count++;
      }
    }
  }

  // Also check multi-word keywords against the full text
  for (const category of KEYWORD_CATEGORIES) {
    for (const kw of category.keywords) {
      if (kw.includes(" ") && lower.includes(kw)) {
        if (!categoryMatches[category.name]) {
          categoryMatches[category.name] = {
            count: 0,
            valence: category.valence,
            weight: category.weight,
          };
        }
        categoryMatches[category.name].count++;
      }
    }
  }

  const matchedCategories = Object.keys(categoryMatches);

  if (matchedCategories.length === 0) {
    return {
      score: 0,
      dominantCategory: "neutral",
      matchedCategories: [],
      intensity: "low",
    };
  }

  // Compute aggregate score
  let weightedSum = 0;
  let totalMatches = 0;
  for (const cat of matchedCategories) {
    const m = categoryMatches[cat];
    weightedSum += m.valence * m.weight * m.count;
    totalMatches += m.count;
  }
  const score = Math.max(-1, Math.min(1, weightedSum / Math.max(totalMatches, 1)));

  // Find dominant category
  let dominant = matchedCategories[0];
  let maxScore = 0;
  for (const cat of matchedCategories) {
    const s = categoryMatches[cat].count * categoryMatches[cat].weight;
    if (s > maxScore) {
      maxScore = s;
      dominant = cat;
    }
  }

  // Compute intensity
  const dominantCat = KEYWORD_CATEGORIES.find((c) => c.name === dominant);
  let intensityScore =
    dominantCat?.intensity === "high" ? 0.8 :
    dominantCat?.intensity === "medium" ? 0.5 : 0.2;

  // Boost for exclamation marks (max +0.3)
  const exclamations = (text.match(/!/g) || []).length;
  intensityScore += Math.min(exclamations * 0.1, 0.3);

  // Boost for ALL CAPS words (max +0.3)
  const words = text.split(/\s+/);
  const capsWords = words.filter((w) => w.length > 1 && w === w.toUpperCase() && /[A-Z]/.test(w));
  intensityScore += Math.min(capsWords.length * 0.15, 0.3);

  const intensity: "low" | "medium" | "high" =
    intensityScore >= 0.7 ? "high" :
    intensityScore >= 0.4 ? "medium" : "low";

  return { score, dominantCategory: dominant, matchedCategories, intensity };
}
