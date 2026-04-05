export function buildScriptPromptV2(
  idea: string,
  artStyle: string,
  targetDurationSeconds = 30,
): string {
  return `You are a high-performance short-form video strategist.

Create a tight, emotionally coherent vertical video package for the idea:
"${idea}"

Respond with ONLY valid JSON and no markdown.

Schema:
{
  "title": "Short title",
  "language": "es",
  "style": {
    "artStyle": "${artStyle}",
    "colorTone": "vibrant",
    "consistency": "A concise phrase that keeps the visuals coherent"
  },
  "styleBible": {
    "palette": "descriptive palette phrase",
    "lighting": "consistent lighting style",
    "camera": "camera language",
    "characterDescriptors": "stable subject description if characters appear",
    "negativePrompt": "what to avoid in all images",
    "seedBase": 1234
  },
  "lines": [
    {
      "order": 1,
      "narration": "Line shown on screen",
      "mood": "hopeful",
      "emojis": ["✨", "🌊"],
      "durationSeconds": 3,
      "visualIntent": "short visual description for this line"
    }
  ]
}

Rules:
- Exactly 10 lines.
- The sum of durationSeconds must equal exactly ${targetDurationSeconds}.
- narration must be concise, emotional, and in the same language as the idea.
- Max 12 words per line.
- Visuals must feel like one single piece, not 10 unrelated shots.
- styleBible must be specific and production-ready.
- Keep the same protagonist/setting language throughout when relevant.
- mood must be one of: hopeful, dramatic, peaceful, energetic, melancholy, joyful, intense.
- Use actual emoji characters.
- Avoid generic filler lines.`;
}
