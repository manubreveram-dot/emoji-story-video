import { GoogleGenAI } from "@google/genai";
import fs from "fs";
import path from "path";
import { API_CONFIG } from "../config/api";
import type { ScriptDocumentV2 } from "../types/workflow-v2";

export type NarrationAudioResult = {
  filename: string;
  filePath: string;
  contentType: string;
  model: string;
};

function ensureDir(dirPath: string): void {
  fs.mkdirSync(dirPath, { recursive: true });
}

function buildNarrationPrompt(document: ScriptDocumentV2): string {
  const narration = document.phrases
    .map((phrase, index) => `${index + 1}. ${phrase.text}`)
    .join("\n");

  return [
    "Generate narration audio only.",
    `Language: ${API_CONFIG.tts.languageCode}.`,
    "Voice direction: warm, cinematic, calm and clear.",
    `Title: ${document.title}.`,
    "Read the following script with natural pacing and short pauses between lines:",
    narration,
  ].join("\n");
}

function resolveExtension(contentType: string): string {
  switch (contentType) {
    case "audio/mpeg":
      return "mp3";
    case "audio/ogg":
      return "ogg";
    case "audio/flac":
      return "flac";
    case "audio/aac":
      return "aac";
    case "audio/m4a":
      return "m4a";
    case "audio/wav":
    default:
      return "wav";
  }
}

function extractInlineAudio(
  response: Awaited<ReturnType<GoogleGenAI["models"]["generateContent"]>>,
): { data: string; contentType: string } | null {
  for (const candidate of response.candidates ?? []) {
    for (const part of candidate.content?.parts ?? []) {
      const contentType = part.inlineData?.mimeType;
      const data = part.inlineData?.data;
      if (contentType?.startsWith("audio/") && data) {
        return { data, contentType };
      }
    }
  }

  return null;
}

export async function generateNarrationAudio(
  document: ScriptDocumentV2,
  outputDir: string,
): Promise<NarrationAudioResult | undefined> {
  if (!API_CONFIG.tts.enabledDefault || !API_CONFIG.gemini.apiKey) {
    return undefined;
  }

  const ai = new GoogleGenAI({ apiKey: API_CONFIG.gemini.apiKey });
  const response = await ai.models.generateContent({
    model: API_CONFIG.tts.model,
    contents: buildNarrationPrompt(document),
    config: {
      responseModalities: ["audio"],
      speechConfig: {
        languageCode: API_CONFIG.tts.languageCode,
        voiceConfig: {
          prebuiltVoiceConfig: {
            voiceName: API_CONFIG.tts.voiceName,
          },
        },
      },
    },
  });

  const audio = extractInlineAudio(response);
  if (!audio) {
    throw new Error("Gemini TTS returned no inline audio.");
  }

  ensureDir(outputDir);
  const extension = resolveExtension(audio.contentType);
  const filename = `narration.${extension}`;
  const filePath = path.join(outputDir, filename);
  fs.writeFileSync(filePath, Buffer.from(audio.data, "base64"));

  return {
    filename,
    filePath,
    contentType: audio.contentType,
    model: API_CONFIG.tts.model,
  };
}
