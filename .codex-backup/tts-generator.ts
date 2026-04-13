import fs from "fs";
import path from "path";
import { GoogleGenAI } from "@google/genai";
import { API_CONFIG } from "../config/api";
import type { ScriptDocumentV2 } from "../types/workflow-v2";

type NarrationAudioResult = {
  filename: string;
  filePath: string;
  contentType: string;
  model: string;
};

function ensureDir(dirPath: string): void {
  fs.mkdirSync(dirPath, { recursive: true });
}

function buildNarrationPrompt(script: ScriptDocumentV2): string {
  const lines = script.phrases
    .map((phrase) => phrase.text.trim())
    .filter((phrase) => phrase.length > 0)
    .join("\n");

  return [
    "Read the following text exactly as written.",
    "Use a warm, clear Latin American Spanish narration voice.",
    "Pause naturally between lines.",
    "",
    lines,
  ].join("\n");
}

function extractInlineAudioPart(response: {
  candidates?: Array<{
    content?: {
      parts?: Array<{
        inlineData?: {
          mimeType?: string;
          data?: string;
        };
      }>;
    };
  }>;
}): { mimeType: string; data: Buffer } {
  const part = response.candidates
    ?.flatMap((candidate) => candidate.content?.parts ?? [])
    .find((candidatePart) => candidatePart.inlineData?.data);

  const mimeType = part?.inlineData?.mimeType;
  const base64Data = part?.inlineData?.data;

  if (!mimeType || !base64Data) {
    throw new Error("Gemini TTS did not return inline audio data.");
  }

  return {
    mimeType,
    data: Buffer.from(base64Data, "base64"),
  };
}

function getSampleRate(mimeType: string): number {
  const match = mimeType.match(/rate=(\d+)/i);
  return match ? Number.parseInt(match[1], 10) : 24_000;
}

function createWavHeader(
  pcmByteLength: number,
  sampleRate: number,
  channels = 1,
  sampleWidth = 2,
): Buffer {
  const header = Buffer.alloc(44);
  const byteRate = sampleRate * channels * sampleWidth;
  const blockAlign = channels * sampleWidth;

  header.write("RIFF", 0);
  header.writeUInt32LE(36 + pcmByteLength, 4);
  header.write("WAVE", 8);
  header.write("fmt ", 12);
  header.writeUInt32LE(16, 16);
  header.writeUInt16LE(1, 20);
  header.writeUInt16LE(channels, 22);
  header.writeUInt32LE(sampleRate, 24);
  header.writeUInt32LE(byteRate, 28);
  header.writeUInt16LE(blockAlign, 32);
  header.writeUInt16LE(sampleWidth * 8, 34);
  header.write("data", 36);
  header.writeUInt32LE(pcmByteLength, 40);

  return header;
}

export async function generateNarrationAudio(
  script: ScriptDocumentV2,
  outputDir: string,
): Promise<NarrationAudioResult | null> {
  if (!API_CONFIG.tts.enabledDefault) {
    return null;
  }

  const apiKey = API_CONFIG.gemini.apiKey;
  if (!apiKey) {
    return null;
  }

  const ai = new GoogleGenAI({ apiKey });
  const response = await ai.models.generateContent({
    model: API_CONFIG.tts.model,
    contents: buildNarrationPrompt(script),
    config: {
      responseModalities: ["AUDIO"],
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

  const audio = extractInlineAudioPart(response);
  const sampleRate = getSampleRate(audio.mimeType);
  const filename = `narration-${script.id}.wav`;
  const filePath = path.join(outputDir, filename);

  ensureDir(outputDir);
  fs.writeFileSync(filePath, Buffer.concat([
    createWavHeader(audio.data.length, sampleRate),
    audio.data,
  ]));

  return {
    filename,
    filePath,
    contentType: "audio/wav",
    model: API_CONFIG.tts.model,
  };
}
