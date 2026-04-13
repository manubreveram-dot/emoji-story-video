import React, { useEffect, useMemo, useState } from "react";
import { loadFont as loadInter } from "@remotion/google-fonts/Inter";
import { loadFont as loadMontserrat } from "@remotion/google-fonts/Montserrat";
import type { SceneBlueprint } from "../types/scene";
import type { Script, ScriptScene } from "../types/script";
import type {
  ActDraft,
  CostBreakdown,
  GenerationPhase,
  RenderJobRequestV2,
  RenderPack,
  ScriptDocumentV2,
  ScriptRequestV2,
  StyleBible,
  VisualJobRequestV2,
  VisualPack,
  WizardStepV2,
} from "../types/workflow-v2";
import { scriptToScenes } from "../ai/script-to-scenes";
import {
  CHANNEL_NAME,
  DEFAULT_DISTOPIAN_IDEA,
  DEFAULT_DISTOPIAN_STYLE,
} from "../shared/channel-preset";
import { createFallbackScriptDocument } from "../shared/fallback-v2";
import { getSceneTreatment } from "../shared/video-layout";
import { IdeaStudio } from "./components/IdeaStudio";
import { JobProgressList } from "./components/JobProgressList";
import { RenderDownload } from "./components/RenderDownload";
import { ScriptLab } from "./components/ScriptLab";
import { VisualReview } from "./components/VisualReview";
import { WizardShell } from "./components/WizardShell";

loadMontserrat("normal", { weights: ["400", "700"], subsets: ["latin"] });
loadInter("normal", { weights: ["400", "700"], subsets: ["latin"] });

type SavedSession = {
  id: string;
  step: WizardStepV2;
  scriptDocument: ScriptDocumentV2;
  visualPack: VisualPack | null;
  renderPack: RenderPack | null;
  savedAt: number;
};
type RecentSessionSummary = {
  id: string;
  title: string;
  subtitle: string;
  step: WizardStepV2;
  savedAt: number;
  status: "script" | "visuals" | "render";
};

type ViteEnv = ImportMeta & {
  readonly env?: {
    readonly VITE_API_BASE?: string;
  };
};

const env = import.meta as ViteEnv;
const API_BASE = env.env?.VITE_API_BASE
  ? env.env.VITE_API_BASE.replace(/\/$/, "")
  : "";
const DEFAULT_BUDGET_CAP = 0.5;
const DEFAULT_PHRASE_COUNT = 10;
const DEFAULT_STYLE = DEFAULT_DISTOPIAN_STYLE;
const SESSION_STORAGE_KEY = "emoji-story-video:v2:sessions";
const MAX_SAVED_SESSIONS = 8;
const DEFAULT_COST_BREAKDOWN: CostBreakdown = {
  scriptUsd: 0,
  imagesUsd: 0,
  veoUsd: 0,
  renderUsd: 0,
  totalUsd: 0,
};

function apiUrl(path: string): string {
  return `${API_BASE}${path}`;
}

async function parseApiResponse<T>(response: Response): Promise<T> {
  const raw = await response.text();
  const contentType = response.headers.get("content-type") ?? "";
  const expectsJson = contentType.includes("application/json");
  let parsedJson = false;
  let data: T & { error?: string; message?: string };
  try {
    data = raw.length > 0
      ? (JSON.parse(raw) as T & { error?: string; message?: string })
      : ({} as T & { error?: string; message?: string });
    parsedJson = raw.length > 0;
  } catch {
    data = {} as T & { error?: string; message?: string };
  }

  if (response.ok && raw.trim().length > 0 && !parsedJson) {
    throw new Error("La API devolvio una respuesta invalida. Revisa si el backend esta activo.");
  }

  if (!response.ok) {
    const nonJsonMessage = expectsJson
      ? undefined
      : `La API respondio ${response.status}. Revisa los logs del backend.`;
    throw new Error(
      data.error ??
      data.message ??
      nonJsonMessage ??
      (raw.trim() ? raw : "Error inesperado en la API."),
    );
  }

  return data as T;
}

function safePromptFromTitle(title: string, fallback: string): string {
  return title.trim() || fallback;
}

function mergePrompt(basePrompt: string, presetPrompt: string): string {
  const base = basePrompt.trim();
  const preset = presetPrompt.trim();
  if (!preset) {
    return basePrompt;
  }
  if (!base) {
    return preset;
  }
  if (base.toLowerCase().includes(preset.toLowerCase())) {
    return base;
  }
  return `${base}, ${preset}`;
}

function buildVisualProgressPlaceholder(): VisualPack["progress"] {
  return [
    { label: "Guia visual", status: "done" },
    { label: "Paquete de imagenes", status: "running", detail: "0/4" },
    { label: "Clip hero", status: "pending" },
  ];
}

function buildRenderProgressPlaceholder(): RenderPack["progress"] {
  return [
    { label: "Recolectar assets", status: "done" },
    { label: "Componer video", status: "running" },
    { label: "Exportar MP4", status: "pending" },
  ];
}

function inferStepFromSession(session: {
  scriptDocument: ScriptDocumentV2;
  visualPack: VisualPack | null;
  renderPack: RenderPack | null;
}): WizardStepV2 {
  if (session.renderPack) {
    return "render-download";
  }

  if (session.visualPack) {
    return "visual-review";
  }

  return session.scriptDocument ? "script-lab" : "idea";
}

function summarizeSession(session: SavedSession): RecentSessionSummary {
  return {
    id: session.id,
    title: session.scriptDocument.title || safePromptFromTitle(session.scriptDocument.idea, "Video sin titulo"),
    subtitle: session.scriptDocument.idea,
    step: session.step,
    savedAt: session.savedAt,
    status: session.renderPack
      ? "render"
      : session.visualPack
        ? "visuals"
        : "script",
  };
}

function readSavedSessions(): SavedSession[] {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const raw = window.localStorage.getItem(SESSION_STORAGE_KEY);
    if (!raw) {
      return [];
    }

    const parsed = JSON.parse(raw) as SavedSession[];
    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed.filter(
      (session) =>
        session &&
        typeof session === "object" &&
        typeof session.id === "string" &&
        !!session.scriptDocument,
    );
  } catch {
    return [];
  }
}

function writeSavedSessions(sessions: SavedSession[]): void {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(sessions));
}

function parseScriptDocument(payload: unknown, request: ScriptRequestV2): ScriptDocumentV2 {
  const fallbackDocument = createFallbackScriptDocument(
    request.idea,
    request.artStyle,
    request.budgetCapUsd,
    request.useVeo,
    request.phraseCount,
  );

  if (payload && typeof payload === "object" && "phrases" in payload && "acts" in payload) {
    const document = payload as Partial<ScriptDocumentV2>;
    return {
      id: document.id ?? `script-${Date.now()}`,
      idea: document.idea ?? request.idea,
      title: document.title ?? safePromptFromTitle(request.idea, "Nuevo video"),
      targetDurationSeconds: document.targetDurationSeconds ?? 30,
      phraseCount:
        document.phraseCount ??
        document.phrases?.length ??
        request.phraseCount,
      budgetCapUsd: document.budgetCapUsd ?? request.budgetCapUsd,
      useVeo: document.useVeo ?? request.useVeo,
      estimatedCost: document.estimatedCost ?? DEFAULT_COST_BREAKDOWN,
      actualCost: document.actualCost,
      styleBible: document.styleBible ?? fallbackDocument.styleBible,
      phrases: document.phrases ?? fallbackDocument.phrases,
      acts: document.acts ?? fallbackDocument.acts,
      createdAt: document.createdAt,
      updatedAt: document.updatedAt,
      featureFlags: document.featureFlags,
    };
  }

  return createFallbackScriptDocument(
    request.idea,
    request.artStyle,
    request.budgetCapUsd,
    request.useVeo,
    request.phraseCount,
  );
}

function withPhraseCount(document: ScriptDocumentV2): ScriptDocumentV2 {
  const phraseCount = document.phraseCount ?? document.phrases.length;
  if (phraseCount === document.phraseCount) {
    return document;
  }

  return {
    ...document,
    phraseCount,
  };
}

function toPreviewScript(document: ScriptDocumentV2): Script {
  const scenes: ScriptScene[] = document.phrases.map((phrase, index) => {
    const act =
      document.acts.find((candidate) => candidate.phraseIndexes.includes(index)) ??
      document.acts[Math.min(index, document.acts.length - 1)];
    const treatment = getSceneTreatment(index, document.phrases.length);

    return {
      id: phrase.id || `scene-${index + 1}`,
      order: index + 1,
      narration: phrase.text,
      visualDescription: act?.visualPrompt ?? phrase.text,
      mood: phrase.mood ?? (index % 2 === 0 ? "hopeful" : "peaceful"),
      emojis: phrase.emojis ?? [],
      durationSeconds: phrase.durationSeconds,
      layout: treatment.layout,
      imageAnimation: treatment.imageAnimation,
      transition: index % 3 === 0 ? "fade" : index % 3 === 1 ? "slide" : "wipe",
    };
  });

  return {
    title: document.title,
    totalDurationSeconds: document.targetDurationSeconds,
    style: {
      artStyle: document.styleBible.artStyle,
      colorTone: document.styleBible.palette,
      consistency:
        document.styleBible.consistencyNote ?? document.styleBible.characterDescriptors,
    },
    scenes,
  };
}

function buildPreviewScenes(
  document: ScriptDocumentV2 | null,
  visuals: VisualPack | null,
): SceneBlueprint[] {
  if (!document) return [];

  const imageByActIndex = new Map<number, string>();
  visuals?.images.forEach((image, index) => {
    const imagePath = image.path ? `generated/${image.path}` : image.url;
    if (imagePath) {
      imageByActIndex.set(image.actIndex ?? index, imagePath);
    }
  });

  const previewScript = toPreviewScript(document);
  const imagePaths = document.phrases.map((_, phraseIndex) => {
    const actIndex =
      document.acts.findIndex((act) => act.phraseIndexes.includes(phraseIndex));
    return imageByActIndex.get(actIndex >= 0 ? actIndex : 0) ?? "";
  });

  return scriptToScenes(previewScript, imagePaths);
}

export const App: React.FC = () => {
  const [phase, setPhase] = useState<GenerationPhase>("idle");
  const [step, setStep] = useState<WizardStepV2>("idea");
  const [error, setError] = useState<string | null>(null);
  const [isWorking, setIsWorking] = useState(false);
  const [recentSessions, setRecentSessions] = useState<RecentSessionSummary[]>([]);

  const [scriptDocument, setScriptDocument] = useState<ScriptDocumentV2 | null>(null);
  const [visualPack, setVisualPack] = useState<VisualPack | null>(null);
  const [renderPack, setRenderPack] = useState<RenderPack | null>(null);

  const previewScenes = useMemo(
    () => buildPreviewScenes(scriptDocument, visualPack),
    [scriptDocument, visualPack],
  );

  useEffect(() => {
    const savedSessions = readSavedSessions();
    setRecentSessions(savedSessions.map(summarizeSession));
  }, []);

  useEffect(() => {
    if (!scriptDocument) {
      return;
    }

    const nextSession: SavedSession = {
      id: scriptDocument.id,
      step,
      scriptDocument,
      visualPack,
      renderPack,
      savedAt: Date.now(),
    };

    const existing = readSavedSessions().filter((session) => session.id !== nextSession.id);
    const nextSessions = [nextSession, ...existing].slice(0, MAX_SAVED_SESSIONS);
    writeSavedSessions(nextSessions);
    setRecentSessions(nextSessions.map(summarizeSession));
  }, [scriptDocument, visualPack, renderPack, step]);

  useEffect(() => {
    const activeJobId = visualPack?.jobId;
    const activeStatus = visualPack?.status;

    if (!activeJobId || (activeStatus !== "pending" && activeStatus !== "running")) {
      return;
    }

    let cancelled = false;
    let timeoutId: number | undefined;

    setIsWorking(true);
    setPhase("visuals");

    const pollVisualJob = async () => {
      try {
        const response = await fetch(apiUrl(`/api/visuals/v2/jobs/${activeJobId}`));
        const data = await parseApiResponse<VisualPack>(response);

        if (cancelled) {
          return;
        }

        setVisualPack(data);

        if (data.status === "done" || data.status === "error") {
          setIsWorking(false);
          setPhase("idle");

          if (data.status === "error") {
            setError(data.message ?? "No se pudo completar el visual pack.");
          }
          return;
        }
      } catch (err) {
        if (cancelled) {
          return;
        }

        setVisualPack((current) => {
          if (!current || current.jobId !== activeJobId) {
            return current;
          }

          return {
            ...current,
            message: "Seguimos generando visuales. Reintentando sincronizacion...",
          };
        });
      }

      if (!cancelled) {
        timeoutId = window.setTimeout(pollVisualJob, 2000);
      }
    };

    void pollVisualJob();

    return () => {
      cancelled = true;
      if (timeoutId !== undefined) {
        window.clearTimeout(timeoutId);
      }
    };
  }, [visualPack?.jobId, visualPack?.status]);

  useEffect(() => {
    const activeJobId = renderPack?.jobId;
    const activeStatus = renderPack?.status;

    if (!activeJobId || (activeStatus !== "pending" && activeStatus !== "running")) {
      return;
    }

    let cancelled = false;
    let timeoutId: number | undefined;

    setIsWorking(true);
    setPhase("render");

    const pollRenderJob = async () => {
      try {
        const response = await fetch(apiUrl(`/api/render/v2/jobs/${activeJobId}`));
        const data = await parseApiResponse<RenderPack>(response);

        if (cancelled) {
          return;
        }

        setRenderPack(data);

        if (data.status === "done" || data.status === "error") {
          setIsWorking(false);
          setPhase("idle");

          if (data.status === "error") {
            setError(data.message ?? "No se pudo renderizar el video final.");
          }
          return;
        }
      } catch {
        if (cancelled) {
          return;
        }

        setRenderPack((current) => {
          if (!current || current.jobId !== activeJobId) {
            return current;
          }

          return {
            ...current,
            message: "Seguimos renderizando. Reintentando sincronizacion...",
          };
        });
      }

      if (!cancelled) {
        timeoutId = window.setTimeout(pollRenderJob, 2000);
      }
    };

    void pollRenderJob();

    return () => {
      cancelled = true;
      if (timeoutId !== undefined) {
        window.clearTimeout(timeoutId);
      }
    };
  }, [renderPack?.jobId, renderPack?.status]);

  function restoreRecentSession(sessionId: string) {
    const session = readSavedSessions().find((candidate) => candidate.id === sessionId);
    if (!session) {
      return;
    }

    setError(null);
    setScriptDocument(withPhraseCount(session.scriptDocument));
    setVisualPack(session.visualPack);
    setRenderPack(session.renderPack);
    setStep(inferStepFromSession(session));
  }

  function clearRecentSessions() {
    if (typeof window !== "undefined") {
      window.localStorage.removeItem(SESSION_STORAGE_KEY);
    }

    setRecentSessions([]);
  }

  function resetWorkflowFromScratch() {
    setError(null);
    setIsWorking(false);
    setPhase("idle");
    setStep("idea");
    setScriptDocument(null);
    setVisualPack(null);
    setRenderPack(null);
    clearRecentSessions();
  }

  async function createScriptV2(payload: ScriptRequestV2) {
    setIsWorking(true);
    setPhase("script");
    setError(null);

    try {
      const response = await fetch(apiUrl("/api/script/v2"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await parseApiResponse<ScriptDocumentV2>(response);
      setScriptDocument(withPhraseCount(parseScriptDocument(data, payload)));
      setVisualPack(null);
      setRenderPack(null);
      setStep("script-lab");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "No se pudo generar el guion.",
      );
    } finally {
      setIsWorking(false);
      setPhase("idle");
    }
  }

  async function saveScriptDocument(document: ScriptDocumentV2) {
    setIsWorking(true);
    setPhase("script");
    setError(null);

    try {
      const response = await fetch(apiUrl(`/api/script/v2/${document.id}`), {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(document),
      });

      const data = await parseApiResponse<ScriptDocumentV2>(response);
      setScriptDocument(
        withPhraseCount({
          ...document,
          ...data,
        }),
      );
      setVisualPack(null);
      setRenderPack(null);
      setStep("visual-review");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "No se pudo guardar el script editado.",
      );
    } finally {
      setIsWorking(false);
      setPhase("idle");
    }
  }

  async function createVisualJob(regenerateActIndex?: number) {
    if (!scriptDocument) return;

    console.log("[visual-ui] createVisualJob called", {
      scriptId: scriptDocument.id,
      regenerateActIndex,
    });

    setIsWorking(true);
    setPhase("visuals");
    setError(null);

    try {
      const syncResponse = await fetch(apiUrl(`/api/script/v2/${scriptDocument.id}`), {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(scriptDocument),
      });

      const syncedScript = await parseApiResponse<ScriptDocumentV2>(syncResponse);
      const scriptForJob: ScriptDocumentV2 = {
        ...scriptDocument,
        ...syncedScript,
      };
      setScriptDocument(withPhraseCount(scriptForJob));

      const payload: VisualJobRequestV2 = {
        scriptId: scriptForJob.id,
        script: scriptForJob,
        regenerateActIndex,
        budgetCapUsd: scriptForJob.budgetCapUsd,
        useVeo: scriptForJob.useVeo,
      };

      const response = await fetch(apiUrl("/api/visuals/v2/jobs"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      console.log("[visual-ui] visual job response received", {
        status: response.status,
      });

      const startPayload = await parseApiResponse<
        Partial<VisualPack> & { jobId?: string; id?: string; warning?: string }
      >(response);

      const jobId = startPayload.jobId ?? startPayload.id;
      if (!jobId) {
        throw new Error("Visual job did not return a valid job id.");
      }

      setVisualPack({
        jobId,
        status: startPayload.status ?? "running",
        message:
          startPayload.message ??
          startPayload.warning ??
          (regenerateActIndex === undefined
            ? "Generando 4 visuales consistentes..."
            : `Regenerando el acto ${regenerateActIndex + 1}...`),
        mode: startPayload.mode ?? visualPack?.mode ?? "economy",
        consistencyScore: startPayload.consistencyScore ?? visualPack?.consistencyScore ?? 0,
        progress: startPayload.progress ?? buildVisualProgressPlaceholder(),
        images: startPayload.images ?? visualPack?.images ?? [],
        heroVideo: startPayload.heroVideo ?? visualPack?.heroVideo,
        imageZip: startPayload.imageZip ?? visualPack?.imageZip,
        manifest: startPayload.manifest ?? visualPack?.manifest,
        estimatedCost: startPayload.estimatedCost ?? scriptForJob.estimatedCost,
        actualCost: startPayload.actualCost,
        expiresAt: startPayload.expiresAt,
      });
    } catch (err) {
      console.error("[visual-ui] createVisualJob failed", err);
      setError(
        err instanceof Error
          ? err.message
          : "No se pudo completar el visual pack.",
      );
      setIsWorking(false);
      setPhase("idle");
    }
  }

  async function createRenderJob() {
    if (!scriptDocument || !visualPack) return;

    setIsWorking(true);
    setPhase("render");
    setError(null);

    try {
      const payload: RenderJobRequestV2 = {
        scriptId: scriptDocument.id,
        visualJobId: visualPack.jobId,
        script: scriptDocument,
        visuals: visualPack,
      };

      const response = await fetch(apiUrl("/api/render/v2/jobs"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const startPayload = await parseApiResponse<
        Partial<RenderPack> & { jobId?: string; id?: string }
      >(response);

      const jobId = startPayload.jobId ?? startPayload.id;
      if (!jobId) {
        throw new Error("Render job did not return a valid job id.");
      }

      setRenderPack({
        jobId,
        status: startPayload.status ?? "running",
        message: startPayload.message ?? "Preparando render final...",
        progress: startPayload.progress ?? buildRenderProgressPlaceholder(),
        finalVideo: startPayload.finalVideo,
        imageZip: startPayload.imageZip ?? visualPack.imageZip,
        heroVideo: startPayload.heroVideo ?? visualPack.heroVideo,
        manifest: startPayload.manifest,
        estimatedCost: startPayload.estimatedCost ?? scriptDocument.estimatedCost,
        actualCost: startPayload.actualCost,
        expiresAt: startPayload.expiresAt,
      });
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "No se pudo renderizar el video final.",
      );
      setIsWorking(false);
      setPhase("idle");
    }
  }

  function updatePhrase(phraseIndex: number, value: string) {
    setScriptDocument((current) => {
      if (!current) return current;
      const phrases = current.phrases.map((phrase, index) =>
        index === phraseIndex ? { ...phrase, text: value } : phrase,
      );
      return { ...current, phrases };
    });
  }

  function updateAct(actIndex: number, field: keyof ActDraft, value: string) {
    setScriptDocument((current) => {
      if (!current) return current;
      const acts = current.acts.map((act, index) =>
        index === actIndex ? { ...act, [field]: value } : act,
      );
      return { ...current, acts };
    });
  }

  function updateActPrompt(actIndex: number, value: string) {
    setScriptDocument((current) => {
      if (!current) return current;
      const acts = current.acts.map((act, index) =>
        index === actIndex ? { ...act, visualPrompt: value } : act,
      );
      return { ...current, acts };
    });
  }

  function applyActPromptPreset(actIndex: number, preset: string) {
    setScriptDocument((current) => {
      if (!current) return current;
      const acts = current.acts.map((act, index) => {
        if (index !== actIndex) return act;
        return {
          ...act,
          visualPrompt: mergePrompt(act.visualPrompt, preset),
        };
      });
      return { ...current, acts };
    });
  }

  function updateActPhraseIndexes(actIndex: number, rawValue: string) {
    const nextIndexes = rawValue
      .split(",")
      .map((value) => Number(value.trim()) - 1)
      .filter((value) => Number.isFinite(value) && value >= 0);

    setScriptDocument((current) => {
      if (!current) return current;
      const acts = current.acts.map((act, index) =>
        index === actIndex ? { ...act, phraseIndexes: nextIndexes } : act,
      );
      return { ...current, acts };
    });
  }

  function updateStyleBible(field: keyof StyleBible, value: string | number) {
    setScriptDocument((current) => {
      if (!current) return current;
      return {
        ...current,
        styleBible: {
          ...current.styleBible,
          [field]: value,
        },
      };
    });
  }

  return (
    <WizardShell
      currentStep={step}
      phase={phase}
      title={
        step === "idea"
          ? "Define tu historia y prepara un video con direccion cinematografica."
          : step === "script-lab"
            ? "Refina el guion, el suspense y la direccion visual antes de generar."
            : step === "visual-review"
              ? "Ajusta cada foto para que la tension visual se sienta real, oscura y consistente."
              : "Renderiza y descarga la micro historia final."
      }
      subtitle={`${CHANNEL_NAME}. Flujo en 4 pasos con ${scriptDocument?.phraseCount ?? DEFAULT_PHRASE_COUNT} frases editables, prompts visuales y twist final.`}
      onReset={resetWorkflowFromScratch}
    >
      {error ? (
        <div className="error-banner">
          <span>{error}</span>
          <button type="button" onClick={() => setError(null)}>
            Cerrar
          </button>
        </div>
      ) : null}

      {step === "idea" ? (
        <IdeaStudio
          initialIdea={scriptDocument?.idea ?? DEFAULT_DISTOPIAN_IDEA}
          initialStyle={scriptDocument?.styleBible.artStyle ?? DEFAULT_STYLE}
          initialBudgetCapUsd={scriptDocument?.budgetCapUsd ?? DEFAULT_BUDGET_CAP}
          initialUseVeo={scriptDocument?.useVeo ?? true}
          initialPhraseCount={scriptDocument?.phraseCount ?? DEFAULT_PHRASE_COUNT}
          recentSessions={recentSessions}
          isLoading={isWorking}
          onSubmit={createScriptV2}
          onResumeSession={restoreRecentSession}
          onClearSessions={clearRecentSessions}
        />
      ) : null}

      {step === "script-lab" && scriptDocument ? (
        <ScriptLab
          script={scriptDocument}
          isSaving={isWorking}
          onBack={() => setStep("idea")}
          onRegenerate={() =>
            createScriptV2({
              idea: scriptDocument.idea,
              artStyle: scriptDocument.styleBible.artStyle,
              budgetCapUsd: scriptDocument.budgetCapUsd,
              useVeo: scriptDocument.useVeo,
              phraseCount: scriptDocument.phraseCount ?? scriptDocument.phrases.length,
            })
          }
          onProceed={() => saveScriptDocument(scriptDocument)}
          onPhraseChange={updatePhrase}
          onActChange={updateAct}
          onActPhraseIndexesChange={updateActPhraseIndexes}
          onStyleBibleChange={updateStyleBible}
        />
      ) : null}

      {step === "visual-review" && scriptDocument ? (
        <VisualReview
          script={scriptDocument}
          visuals={visualPack}
          isPolling={isWorking && phase === "visuals"}
          onBack={() => setStep("script-lab")}
          onGenerate={() => createVisualJob()}
          onRegenerateAct={(actIndex) => createVisualJob(actIndex)}
          onProceed={() => setStep("render-download")}
          onActPromptChange={updateActPrompt}
          onApplyPromptPreset={applyActPromptPreset}
        />
      ) : null}

      {step === "render-download" && scriptDocument ? (
        <RenderDownload
          script={scriptDocument}
          visuals={visualPack}
          renderPack={renderPack}
          previewScenes={previewScenes}
          isPolling={isWorking && phase === "render"}
          onBack={() => setStep("visual-review")}
          onRender={createRenderJob}
        />
      ) : null}

      {phase !== "idle" ? (
        <JobProgressList
          title="Actividad en vivo"
          items={[
            {
              label: "Generacion de guion",
              status:
                phase === "script"
                  ? "running"
                  : scriptDocument
                    ? "done"
                    : "pending",
            },
            {
              label: "Paquete visual",
              status:
                phase === "visuals"
                  ? "running"
                  : visualPack?.status === "done"
                    ? "done"
                    : visualPack?.status === "error"
                      ? "error"
                      : "pending",
            },
            {
              label: "Salida final",
              status:
                phase === "render"
                  ? "running"
                  : renderPack?.status === "done"
                    ? "done"
                    : renderPack?.status === "error"
                      ? "error"
                      : "pending",
            },
          ]}
          compact
        />
      ) : null}
    </WizardShell>
  );
};
