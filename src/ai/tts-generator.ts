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
    "Genera solo audio de narracion.",
    `Idioma: ${API_CONFIG.tts.languageCode}.`,
    "Direccion de voz: calida, cinematografica, clara y con pausas naturales.",
    `Titulo: ${document.title}.`,
    "Lee este guion con ritmo natural y pausas cortas entre lineas:",
    narration,
  ].join("\n");
}

function normalizeMimeType(contentType: string): string {
  return contentType.split(";")[0]?.trim().toLowerCase() ?? "audio/wav";
}

function parseSampleRate(contentType: string): number {
  const match = contentType.match(/rate=(\d+)/i);
  if (!match) {
    return 24000;
  }
  const parsed = Number(match[1]);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 24000;
}

function resolveExtension(contentType: string): string {
  const normalized = normalizeMimeType(contentType);
  switch (normalized) {
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
    case "audio/l16":
    case "audio/wav":
    default:
      return "wav";
  }
}

function isContainerAudio(contentType: string): boolean {
  const normalized = normalizeMimeType(contentType);
  return [
    "audio/wav",
    "audio/mpeg",
    "audio/ogg",
    "audio/flac",
    "audio/aac",
    "audio/m4a",
  ].includes(normalized);
}

function pcm16ToWav(
  pcmData: Buffer,
  sampleRate: number,
  channelCount: number = 1,
): Buffer {
  const bitsPerSample = 16;
  const blockAlign = (channelCount * bitsPerSample) / 8;
  const byteRate = sampleRate * blockAlign;
  const dataSize = pcmData.length;
  const riffChunkSize = 36 + dataSize;
  const wav = Buffer.alloc(44 + dataSize);

  wav.write("RIFF", 0, "ascii");
  wav.writeUInt32LE(riffChunkSize, 4);
  wav.write("WAVE", 8, "ascii");
  wav.write("fmt ", 12, "ascii");
  wav.writeUInt32LE(16, 16); // PCM fmt chunk size
  wav.writeUInt16LE(1, 20); // PCM format
  wav.writeUInt16LE(channelCount, 22);
  wav.writeUInt32LE(sampleRate, 24);
  wav.writeUInt32LE(byteRate, 28);
  wav.writeUInt16LE(blockAlign, 32);
  wav.writeUInt16LE(bitsPerSample, 34);
  wav.write("data", 36, "ascii");
  wav.writeUInt32LE(dataSize, 40);
  pcmData.copy(wav, 44);
  return wav;
}

function normalizeAudioPayload(input: {
  data: string;
  contentType: string;
}): { contentType: string; payload: Buffer } {
  const payload = Buffer.from(input.data, "base64");
  const normalizedType = normalizeMimeType(input.contentType);

  if (
    normalizedType === "audio/wav" &&
    payload.length >= 12 &&
    payload.toString("ascii", 0, 4) !== "RIFF"
  ) {
    const sampleRate = parseSampleRate(input.contentType);
    return {
      contentType: "audio/wav",
      payload: pcm16ToWav(payload, sampleRate, 1),
    };
  }

  if (isContainerAudio(input.contentType)) {
    return {
      contentType: normalizedType,
      payload,
    };
  }

  const sampleRate = parseSampleRate(input.contentType);
  return {
    contentType: "audio/wav",
    payload: pcm16ToWav(payload, sampleRate, 1),
  };
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

  const normalizedAudio = normalizeAudioPayload(audio);
  ensureDir(outputDir);
  const extension = resolveExtension(normalizedAudio.contentType);
  const filename = `narration.${extension}`;
  const filePath = path.join(outputDir, filename);
  fs.writeFileSync(filePath, normalizedAudio.payload);

  return {
    filename,
    filePath,
    contentType: normalizedAudio.contentType,
    model: API_CONFIG.tts.model,
  };
}
