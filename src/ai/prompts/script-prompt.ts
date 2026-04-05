export function buildScriptPrompt(idea: string, artStyle: string = "3d digital art"): string {
  return `You are a viral short-video scriptwriter. Generate a structured script for a 60-second vertical video about: "${idea}".

Respond ONLY with valid JSON (no markdown, no code blocks, no explanation):
{
  "title": "Short catchy title",
  "totalDurationSeconds": 60,
  "style": {
    "artStyle": "${artStyle}",
    "colorTone": "warm or cool or vibrant or muted (pick the best for the theme)",
    "consistency": "A brief description of the visual style to maintain across all scenes"
  },
  "scenes": [
    {
      "id": "scene-1",
      "order": 1,
      "narration": "Short text shown on screen (max 12 words)",
      "visualDescription": "Detailed image prompt: subject, setting, lighting, composition, mood. Be specific.",
      "mood": "hopeful",
      "emojis": ["emoji1", "emoji2"],
      "durationSeconds": 5,
      "layout": "title",
      "imageAnimation": "ken-burns-in",
      "transition": "fade"
    }
  ]
}

STRICT RULES:
- Scenes durationSeconds MUST sum to EXACTLY 60
- Generate 8-12 scenes
- Scene 1: impactful title (4-5s), layout "title"
- Last scene: call to action or closing (4-5s), layout "title"
- Middle scenes: 4-8 seconds each
- narration: MAX 12 words per scene, powerful and concise
- visualDescription: detailed, specific, consistent art style across all scenes
- Layout variety: use "image", "image-text", "cinematic", "title", "emoji-rain"
- imageAnimation variety: use "ken-burns-in", "ken-burns-out", "parallax", "zoom-pulse", "slide-reveal"
- transition variety: use "fade", "slide", "wipe", "flip"
- emojis: use actual emoji characters like "🔥", "💪", "🌅"
- mood options: "hopeful", "dramatic", "peaceful", "energetic", "melancholy", "joyful", "intense"
- Detect the language of the idea and write narration in the SAME language`;
}
