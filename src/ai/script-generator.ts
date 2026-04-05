import { GoogleGenAI } from "@google/genai";
import { API_CONFIG } from "../config/api";
import { buildScriptPrompt } from "./prompts/script-prompt";
import type { Script, ScriptScene } from "../types/script";
export { generateScriptV2 } from "./pipeline-v2";

export async function generateScript(
  idea: string,
  artStyle: string = "3d digital art",
): Promise<Script> {
  const apiKey = API_CONFIG.gemini.apiKey;
  if (!apiKey) {
    throw new Error(
      "GEMINI_API_KEY not set. Get one free at https://ai.google.dev/",
    );
  }

  const ai = new GoogleGenAI({ apiKey });

  const prompt = buildScriptPrompt(idea, artStyle);

  const response = await ai.models.generateContent({
    model: API_CONFIG.gemini.scriptModel,
    contents: prompt,
  });

  const text = response.text ?? "";

  // Extract JSON from response (handle markdown code blocks)
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error("Failed to parse script JSON from Gemini response");
  }

  const script: Script = JSON.parse(jsonMatch[0]);

  // Validate and fix duration
  const totalDuration = script.scenes.reduce(
    (sum, s) => sum + s.durationSeconds,
    0,
  );

  if (totalDuration !== 60) {
    // Redistribute to hit exactly 60s
    const diff = 60 - totalDuration;
    const perScene = diff / script.scenes.length;
    let remaining = diff;

    for (let i = 0; i < script.scenes.length; i++) {
      const adjustment =
        i === script.scenes.length - 1
          ? remaining
          : Math.round(perScene * 10) / 10;
      script.scenes[i].durationSeconds += adjustment;
      script.scenes[i].durationSeconds = Math.max(
        3,
        Math.min(10, Math.round(script.scenes[i].durationSeconds)),
      );
      remaining -= adjustment;
    }

    // Final pass to ensure exact 60
    const finalTotal = script.scenes.reduce(
      (sum, s) => sum + s.durationSeconds,
      0,
    );
    if (finalTotal !== 60) {
      script.scenes[script.scenes.length - 1].durationSeconds += 60 - finalTotal;
    }
  }

  // Ensure IDs and order
  script.scenes = script.scenes.map((scene, i) => ({
    ...scene,
    id: scene.id || `scene-${i + 1}`,
    order: i + 1,
  }));

  script.totalDurationSeconds = 60;

  return script;
}
