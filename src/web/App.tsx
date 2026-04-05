import React, { useState, useCallback } from "react";
import { loadFont as loadMontserrat } from "@remotion/google-fonts/Montserrat";
import { loadFont as loadInter } from "@remotion/google-fonts/Inter";
import type { Script, ScriptScene } from "../types/script";
import type { SceneBlueprint } from "../types/scene";
import type { ImageGenerationProgress } from "../ai/image-generator";
import { IdeaInput } from "./components/IdeaInput";
import { ScriptEditor } from "./components/ScriptEditor";
import { GenerationProgress } from "./components/GenerationProgress";
import { PreviewPlayer } from "./components/PreviewPlayer";
import { scriptToScenes } from "../ai/script-to-scenes";

loadMontserrat("normal", { weights: ["400", "700"], subsets: ["latin"] });
loadInter("normal", { weights: ["400", "700"], subsets: ["latin"] });

type AppStep = "idea" | "script" | "generating" | "preview";

const viteEnv = import.meta as ImportMeta & {
  readonly env?: {
    readonly VITE_API_BASE?: string;
  };
};

const API_BASE = viteEnv.env?.VITE_API_BASE
  ? viteEnv.env.VITE_API_BASE.replace(/\/$/, "")
  : "";

const apiUrl = (path: string) => `${API_BASE}${path}`;

export const App: React.FC = () => {
  const [step, setStep] = useState<AppStep>("idea");
  const [isLoading, setIsLoading] = useState(false);
  const [script, setScript] = useState<Script | null>(null);
  const [scenes, setScenes] = useState<SceneBlueprint[]>([]);
  const [imageProgress, setImageProgress] = useState<ImageGenerationProgress[]>([]);
  const [idea, setIdea] = useState("");
  const [artStyle, setArtStyle] = useState("");
  const [error, setError] = useState<string | null>(null);

  // Step 1: Generate script via API server
  const handleGenerateScript = useCallback(async (newIdea: string, style: string) => {
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

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to generate script");
      }

      const result: Script = await res.json();
      setScript(result);
      setStep("script");
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to generate script";
      setError(`${message} Ensure the API server is running and try again.`);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleUpdateScene = useCallback(
    (index: number, updatedScene: ScriptScene) => {
      if (!script) return;
      const newScenes = [...script.scenes];
      newScenes[index] = updatedScene;
      setScript({ ...script, scenes: newScenes });
    },
    [script],
  );

  const handleRegenerate = useCallback(async () => {
    if (!idea) return;
    await handleGenerateScript(idea, artStyle);
  }, [idea, artStyle, handleGenerateScript]);

  // Step 2: Generate images via API server, or skip to preview without images
  const handleApproveScript = useCallback(
    async (skipImages: boolean = false) => {
      if (!script) return;

      // Option A: Skip images -> go straight to preview with animated backgrounds
      if (skipImages) {
        const emptyPaths = script.scenes.map(() => "");
        const blueprints = scriptToScenes(script, emptyPaths);
        setScenes(blueprints);
        setStep("preview");
        return;
      }

      // Option B: Generate images via API server
      setStep("generating");
      setError(null);

      const initialProgress: ImageGenerationProgress[] = script.scenes.map((s) => ({
        sceneId: s.id,
        status: "pending" as const,
      }));
      setImageProgress(initialProgress);

      try {
        // Start image generation job
        const startRes = await fetch(apiUrl("/api/images"), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ script }),
        });

        if (!startRes.ok) throw new Error("Failed to start image generation");
        const { jobId } = await startRes.json();

        // Poll for progress
        const poll = async (): Promise<string[]> => {
          const res = await fetch(apiUrl(`/api/images/${jobId}`));
          const job = await res.json();

          setImageProgress(job.progress);

          if (job.status === "done") return job.imagePaths;
          if (job.status === "error") throw new Error(job.error || "Image generation failed");

          await new Promise((r) => setTimeout(r, 2000));
          return poll();
        };

        const imagePaths = await poll();
        const blueprints = scriptToScenes(script, imagePaths);
        setScenes(blueprints);
        setStep("preview");
      } catch (err) {
        const message =
          err instanceof Error
            ? err.message
            : "Failed to generate images.";
        setError(
          `${message} You can use "Preview (no images)" for now, or update the Gemini API key/billing and try again.`,
        );
        setStep("script");
      }
    },
    [script],
  );

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#0a0a1a", color: "#e0e0e0" }}>
      {/* Error banner */}
      {error && (
        <div
          style={{
            padding: "12px 20px",
            backgroundColor: "rgba(255, 107, 107, 0.15)",
            borderBottom: "1px solid rgba(255, 107, 107, 0.3)",
            color: "#FF6B6B",
            fontSize: 14,
            textAlign: "center",
          }}
        >
          {error}
          <button
            onClick={() => setError(null)}
            style={{
              marginLeft: 12,
              background: "none",
              border: "none",
              color: "#FF6B6B",
              cursor: "pointer",
              fontSize: 14,
            }}
          >
            Dismiss
          </button>
        </div>
      )}

      {step === "idea" && (
        <IdeaInput onGenerate={handleGenerateScript} isLoading={isLoading} />
      )}

      {step === "script" && script && (
        <ScriptEditor
          script={script}
          onUpdateScene={handleUpdateScene}
          onRegenerate={handleRegenerate}
          onApprove={() => handleApproveScript(false)}
          onPreviewWithoutImages={() => handleApproveScript(true)}
          onBack={() => setStep("idea")}
          isLoading={isLoading}
        />
      )}

      {step === "generating" && (
        <GenerationProgress
          progress={imageProgress}
          totalScenes={script?.scenes.length || 0}
        />
      )}

      {step === "preview" && (
        <PreviewPlayer
          scenes={scenes}
          onBack={() => setStep("script")}
          onExport={() => {
            alert(
              'Run in terminal:\nnpm run generate -- "your idea here"\n\nThis will generate images + render MP4.',
            );
          }}
        />
      )}
    </div>
  );
};
