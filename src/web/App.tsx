import React, { useMemo, useState } from "react";
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
import type { ImageGenerationProgress } from "../ai/image-generator";
import { IdeaInput } from "./components/IdeaInput";
import { ScriptEditor } from "./components/ScriptEditor";
import { GenerationProgress } from "./components/GenerationProgress";
import { PreviewPlayer } from "./components/PreviewPlayer";
import { IdeaStudio } from "./components/IdeaStudio";
import { JobProgressList } from "./components/JobProgressList";
import { RenderDownload } from "./components/RenderDownload";
import { ScriptLab } from "./components/ScriptLab";
import { VisualReview } from "./components/VisualReview";
import { WizardShell } from "./components/WizardShell";

loadMontserrat("normal", { weights: ["400", "700"], subsets: ["latin"] });
loadInter("normal", { weights: ["400", "700"], subsets: ["latin"] });

type LegacyStep = "idea" | "script" | "generating" | "preview";

type ViteEnv = ImportMeta & {
  readonly env?: {
    readonly VITE_API_BASE?: string;
    readonly VITE_ENABLE_V2_WIZARD?: string;
  };
};

const env = import.meta as ViteEnv;
const API_BASE = env.env?.VITE_API_BASE
  ? env.env.VITE_API_BASE.replace(/\/$/, "")
  : "";
const ENABLE_V2_WIZARD = env.env?.VITE_ENABLE_V2_WIZARD !== "false";
const DEFAULT_BUDGET_CAP = 0.5;
const DEFAULT_STYLE = "cinematic spiritual realism";
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

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function parseApiResponse<T>(response: Response): Promise<T> {
  const data = (await response.json()) as T & { error?: string; message?: string };
  if (!response.ok) {
    throw new Error(data.error ?? data.message ?? "Unexpected API error");
  }

  return data;
}

function safePromptFromTitle(title: string, fallback: string): string {
  return title.trim() || fallback;
}

function fallbackScriptFromIdea(
  idea: string,
  artStyle: string,
  budgetCapUsd: number,
  useVeo: boolean,
): ScriptDocumentV2 {
  const phrases = Array.from({ length: 10 }, (_, index) => ({
    id: `phrase-${index + 1}`,
    index,
    text:
      index === 0
        ? `Inicio: ${idea}`
        : index === 9
          ? "Cierre con claridad y accion."
          : `Frase ${index + 1} del video en desarrollo.`,
    durationSeconds: 3,
    mood: index % 2 === 0 ? "hopeful" : "peaceful",
    emojis: index % 2 === 0 ? ["✨", "🧭"] : ["🌙", "🕊️"],
  }));

  const acts = [
    { id: "act-1", index: 0, title: "Apertura", summary: "Arranque narrativo", phraseIndexes: [0, 1, 2], visualPrompt: idea },
    { id: "act-2", index: 1, title: "Giro", summary: "Tension y contraste", phraseIndexes: [3, 4], visualPrompt: `Contrast for ${idea}` },
    { id: "act-3", index: 2, title: "Profundidad", summary: "Desarrollo interior", phraseIndexes: [5, 6, 7], visualPrompt: `Inner depth for ${idea}` },
    { id: "act-4", index: 3, title: "Cierre", summary: "Resolucion final", phraseIndexes: [8, 9], visualPrompt: `Closing frame for ${idea}` },
  ];

  return {
    id: `draft-${Date.now()}`,
    idea,
    title: safePromptFromTitle(idea, "Nuevo video"),
    targetDurationSeconds: 30,
    budgetCapUsd,
    useVeo,
    estimatedCost: {
      ...DEFAULT_COST_BREAKDOWN,
      scriptUsd: 0.01,
      imagesUsd: 0.08,
      veoUsd: useVeo ? 0.4 : 0,
      totalUsd: useVeo ? 0.49 : 0.09,
    },
    styleBible: {
      artStyle,
      palette: "warm neutrals + gold accents",
      lighting: "soft cinematic rim light",
      camera: "portrait 50mm close-up",
      characterDescriptors: "same central subject across all acts",
      negativePrompt: "text, letters, watermark, extra limbs, low detail",
      seedBase: 4242,
      consistencyNote: "Match wardrobe, face shape and atmosphere across all blocks.",
    },
    phrases,
    acts,
    featureFlags: {
      legacyFallback: true,
      veoEnabled: useVeo,
    },
  };
}

function parseScriptDocument(payload: unknown, request: ScriptRequestV2): ScriptDocumentV2 {
  if (payload && typeof payload === "object" && "phrases" in payload && "acts" in payload) {
    const document = payload as Partial<ScriptDocumentV2>;
    return {
      id: document.id ?? `script-${Date.now()}`,
      idea: document.idea ?? request.idea,
      title: document.title ?? safePromptFromTitle(request.idea, "Nuevo video"),
      targetDurationSeconds: document.targetDurationSeconds ?? 30,
      budgetCapUsd: document.budgetCapUsd ?? request.budgetCapUsd,
      useVeo: document.useVeo ?? request.useVeo,
      estimatedCost: document.estimatedCost ?? DEFAULT_COST_BREAKDOWN,
      actualCost: document.actualCost,
      styleBible: document.styleBible ?? fallbackScriptFromIdea(request.idea, request.artStyle, request.budgetCapUsd, request.useVeo).styleBible,
      phrases: document.phrases ?? fallbackScriptFromIdea(request.idea, request.artStyle, request.budgetCapUsd, request.useVeo).phrases,
      acts: document.acts ?? fallbackScriptFromIdea(request.idea, request.artStyle, request.budgetCapUsd, request.useVeo).acts,
      createdAt: document.createdAt,
      updatedAt: document.updatedAt,
      featureFlags: document.featureFlags,
    };
  }

  return fallbackScriptFromIdea(
    request.idea,
    request.artStyle,
    request.budgetCapUsd,
    request.useVeo,
  );
}

function toLegacyScript(document: ScriptDocumentV2): Script {
  const scenes: ScriptScene[] = document.phrases.map((phrase, index) => {
    const act =
      document.acts.find((candidate) => candidate.phraseIndexes.includes(index)) ??
      document.acts[Math.min(index, document.acts.length - 1)];

    const layoutCycle: ScriptScene["layout"][] = [
      "title",
      "image-text",
      "cinematic",
      "image",
      "text-emoji",
    ];

    return {
      id: phrase.id || `scene-${index + 1}`,
      order: index + 1,
      narration: phrase.text,
      visualDescription: act?.visualPrompt ?? phrase.text,
      mood: phrase.mood ?? (index % 2 === 0 ? "hopeful" : "peaceful"),
      emojis: phrase.emojis ?? [],
      durationSeconds: phrase.durationSeconds,
      layout:
        index === 0 || index === document.phrases.length - 1
          ? "title"
          : layoutCycle[index % layoutCycle.length],
      imageAnimation: index % 2 === 0 ? "ken-burns-in" : "parallax",
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
    const imagePath = image.url ?? image.path;
    if (imagePath) {
      imageByActIndex.set(image.actIndex ?? index, imagePath);
    }
  });

  const legacyScript = toLegacyScript(document);
  const imagePaths = document.phrases.map((_, phraseIndex) => {
    const actIndex =
      document.acts.findIndex((act) => act.phraseIndexes.includes(phraseIndex));
    return imageByActIndex.get(actIndex >= 0 ? actIndex : 0) ?? "";
  });

  return scriptToScenes(legacyScript, imagePaths);
}

async function pollJsonJob<T extends { status?: string }>(
  path: string,
  isComplete: (payload: T) => boolean,
  maxAttempts = 90,
): Promise<T> {
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const response = await fetch(apiUrl(path));
    const payload = await parseApiResponse<T>(response);
    if (isComplete(payload)) {
      return payload;
    }
    await sleep(2000);
  }

  throw new Error("Timed out waiting for async job completion.");
}

const LegacyExperience: React.FC = () => {
  const [step, setStep] = useState<LegacyStep>("idea");
  const [isLoading, setIsLoading] = useState(false);
  const [script, setScript] = useState<Script | null>(null);
  const [scenes, setScenes] = useState<SceneBlueprint[]>([]);
  const [imageProgress, setImageProgress] = useState<ImageGenerationProgress[]>([]);
  const [idea, setIdea] = useState("");
  const [artStyle, setArtStyle] = useState(DEFAULT_STYLE);
  const [error, setError] = useState<string | null>(null);

  async function handleGenerateScript(newIdea: string, style: string) {
    setIdea(newIdea);
    setArtStyle(style);
    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch(apiUrl("/api/script"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idea: newIdea, artStyle: style }),
      });

      const result = await parseApiResponse<Script>(res);
      setScript(result);
      setStep("script");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate script");
    } finally {
      setIsLoading(false);
    }
  }

  function handleUpdateScene(index: number, updatedScene: ScriptScene) {
    if (!script) return;
    const newScenes = [...script.scenes];
    newScenes[index] = updatedScene;
    setScript({ ...script, scenes: newScenes });
  }

  async function handleApproveScript(skipImages = false) {
    if (!script) return;

    if (skipImages) {
      setScenes(scriptToScenes(script, script.scenes.map(() => "")));
      setStep("preview");
      return;
    }

    setStep("generating");
    setImageProgress(
      script.scenes.map((scene) => ({ sceneId: scene.id, status: "pending" as const })),
    );

    try {
      const startRes = await fetch(apiUrl("/api/images"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ script }),
      });

      const { jobId } = await parseApiResponse<{ jobId: string }>(startRes);
      const job = await pollJsonJob<{
        status: string;
        progress: ImageGenerationProgress[];
        imagePaths: string[];
        error?: string;
      }>(`/api/images/${jobId}`, (payload) => {
        setImageProgress(payload.progress ?? []);
        return payload.status === "done" || payload.status === "error";
      });

      if (job.status === "error") {
        throw new Error(job.error ?? "Image generation failed");
      }

      setScenes(scriptToScenes(script, job.imagePaths));
      setStep("preview");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Image generation failed");
      setStep("script");
    }
  }

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#0a0a1a", color: "#e0e0e0" }}>
      {error ? <div className="legacy-error-banner">{error}</div> : null}
      {step === "idea" ? (
        <IdeaInput onGenerate={handleGenerateScript} isLoading={isLoading} />
      ) : null}
      {step === "script" && script ? (
        <ScriptEditor
          script={script}
          onUpdateScene={handleUpdateScene}
          onRegenerate={() => handleGenerateScript(idea, artStyle)}
          onApprove={() => handleApproveScript(false)}
          onPreviewWithoutImages={() => handleApproveScript(true)}
          onBack={() => setStep("idea")}
          isLoading={isLoading}
        />
      ) : null}
      {step === "generating" ? (
        <GenerationProgress
          progress={imageProgress}
          totalScenes={script?.scenes.length ?? 0}
        />
      ) : null}
      {step === "preview" ? (
        <PreviewPlayer
          scenes={scenes}
          onBack={() => setStep("script")}
          onExport={() => {
            window.alert("Legacy mode does not support web export.");
          }}
        />
      ) : null}
    </div>
  );
};

export const App: React.FC = () => {
  const [legacyMode, setLegacyMode] = useState(!ENABLE_V2_WIZARD);
  const [phase, setPhase] = useState<GenerationPhase>("idle");
  const [step, setStep] = useState<WizardStepV2>("idea");
  const [error, setError] = useState<string | null>(null);
  const [isWorking, setIsWorking] = useState(false);

  const [scriptDocument, setScriptDocument] = useState<ScriptDocumentV2 | null>(null);
  const [visualPack, setVisualPack] = useState<VisualPack | null>(null);
  const [renderPack, setRenderPack] = useState<RenderPack | null>(null);

  const previewScenes = useMemo(
    () => buildPreviewScenes(scriptDocument, visualPack),
    [scriptDocument, visualPack],
  );

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
      setScriptDocument(parseScriptDocument(data, payload));
      setVisualPack(null);
      setRenderPack(null);
      setStep("script-lab");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "No se pudo generar el script lab.",
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
      setScriptDocument({
        ...document,
        ...data,
      });
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

    setIsWorking(true);
    setPhase("visuals");
    setError(null);

    try {
      const payload: VisualJobRequestV2 = {
        scriptId: scriptDocument.id,
        script: scriptDocument,
        regenerateActIndex,
        budgetCapUsd: scriptDocument.budgetCapUsd,
        useVeo: scriptDocument.useVeo,
      };

      const response = await fetch(apiUrl("/api/visuals/v2/jobs"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const startPayload = await parseApiResponse<
        Partial<VisualPack> & { jobId?: string; id?: string }
      >(response);

      const jobId = startPayload.jobId ?? startPayload.id;
      if (!jobId) {
        throw new Error("Visual job did not return a valid job id.");
      }

      const job = await pollJsonJob<VisualPack>(
        `/api/visuals/v2/jobs/${jobId}`,
        (data) => {
          setVisualPack(data);
          return data.status === "done" || data.status === "error";
        },
      );

      setVisualPack(job);
      if (job.status === "error") {
        throw new Error(job.message ?? "Visual generation failed.");
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "No se pudo completar el visual pack.",
      );
    } finally {
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

      const job = await pollJsonJob<RenderPack>(
        `/api/render/v2/jobs/${jobId}`,
        (data) => {
          setRenderPack(data);
          return data.status === "done" || data.status === "error";
        },
      );

      setRenderPack(job);
      if (job.status === "error") {
        throw new Error(job.message ?? "Render failed.");
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "No se pudo renderizar el video final.",
      );
    } finally {
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

  if (legacyMode) {
    return (
      <div>
        <div className="legacy-toggle-banner">
          <span>Legacy mode activado.</span>
          {ENABLE_V2_WIZARD ? (
            <button type="button" onClick={() => setLegacyMode(false)}>
              Cambiar a Wizard V2
            </button>
          ) : null}
        </div>
        <LegacyExperience />
      </div>
    );
  }

  return (
    <WizardShell
      currentStep={step}
      phase={phase}
      title={
        step === "idea"
          ? "Construye un short mas coherente, mas barato y mas rapido."
          : step === "script-lab"
            ? "Edita el guion antes de gastar en visuales."
            : step === "visual-review"
              ? "Revisa consistencia antes del render."
              : "Descarga assets reales desde la web."
      }
      subtitle="Pipeline V2: 10 frases, 4 visuales, 1 hero clip opcional y export web real."
      badge={scriptDocument ? `cap US$ ${scriptDocument.budgetCapUsd.toFixed(2)}` : "mode v2"}
    >
      {ENABLE_V2_WIZARD ? (
        <button
          type="button"
          className="legacy-switch"
          onClick={() => setLegacyMode(true)}
        >
          Abrir modo legacy
        </button>
      ) : null}

      {error ? (
        <div className="error-banner">
          <span>{error}</span>
          <button type="button" onClick={() => setError(null)}>
            Dismiss
          </button>
        </div>
      ) : null}

      {step === "idea" ? (
        <IdeaStudio
          initialIdea={scriptDocument?.idea ?? ""}
          initialStyle={scriptDocument?.styleBible.artStyle ?? DEFAULT_STYLE}
          initialBudgetCapUsd={scriptDocument?.budgetCapUsd ?? DEFAULT_BUDGET_CAP}
          initialUseVeo={scriptDocument?.useVeo ?? true}
          isLoading={isWorking}
          onSubmit={createScriptV2}
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
          title="Live activity"
          items={[
            {
              label: "Script generation",
              status:
                phase === "script"
                  ? "running"
                  : scriptDocument
                    ? "done"
                    : "pending",
            },
            {
              label: "Visual pack",
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
              label: "Render output",
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
