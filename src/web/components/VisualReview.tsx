import React from "react";
import type { GeneratedAsset, ScriptDocumentV2, VisualPack } from "../../types/workflow-v2";
import { JobProgressList } from "./JobProgressList";

type VisualReviewProps = {
  script: ScriptDocumentV2;
  visuals: VisualPack | null;
  isPolling: boolean;
  onBack: () => void;
  onGenerate: () => void;
  onRegenerateAct: (actIndex: number) => void;
  onProceed: () => void;
};

function assetUrl(asset: GeneratedAsset): string | undefined {
  if (asset.url) return asset.url;
  if (asset.path?.startsWith("/")) return asset.path;
  if (asset.path) return `/generated/${asset.path}`;
  return undefined;
}

export const VisualReview: React.FC<VisualReviewProps> = ({
  script,
  visuals,
  isPolling,
  onBack,
  onGenerate,
  onRegenerateAct,
  onProceed,
}) => {
  const imagesByAct = new Map<number, GeneratedAsset>();
  visuals?.images.forEach((asset, index) => {
    imagesByAct.set(asset.actIndex ?? index, asset);
  });
  const isGenerating = isPolling || visuals?.status === "running" || visuals?.status === "pending";

  function handleGenerateClick() {
    console.log("[visual-ui] generate button clicked");
    onGenerate();
  }

  return (
    <div className="wizard-grid">
      <section className="panel span-2">
        <div className="panel-header">
          <div>
            <p className="eyebrow">Visual Review</p>
            <h2>4 visuales consistentes antes del render</h2>
            <p className="muted-copy">
              Regenera solo el bloque que se desalineo; no hace falta rehacer todo.
            </p>
          </div>
          <div className="consistency-stack">
            <span className="wizard-badge">
              Consistencia {visuals?.consistencyScore?.toFixed(0) ?? "--"}%
            </span>
            <span className="muted-copy">
              {visuals?.mode ?? "economy"}
            </span>
          </div>
        </div>

        <div className="visual-grid">
          {script.acts.map((act, index) => {
            const asset = imagesByAct.get(index);
            const src = asset ? assetUrl(asset) : undefined;

            return (
              <article key={act.id} className="visual-card">
                <div className="visual-preview">
                  {src ? (
                    <img src={src} alt={act.title} />
                  ) : (
                    <div className="visual-empty">
                      <span>{isGenerating ? "Generando visual..." : "Sin imagen aun"}</span>
                    </div>
                  )}
                </div>

                <div className="visual-copy">
                  <div className="visual-copy-top">
                    <strong>Acto {index + 1}</strong>
                    <span>{act.title}</span>
                  </div>
                  <p>{act.summary}</p>
                  <small>{act.visualPrompt}</small>
                </div>

                <button
                  type="button"
                  className="ghost-button"
                  disabled={isPolling}
                  onClick={() => onRegenerateAct(index)}
                >
                  Regenerar bloque
                </button>
              </article>
            );
          })}
        </div>
      </section>

      <aside className="panel">
        <div className="summary-card">
          <p className="eyebrow">Visual pack</p>
          <h3>{visuals ? visuals.status : "idle"}</h3>
          <p className="muted-copy">
            {visuals?.message ?? "Todavia no hay job de visuales."}
          </p>
          <p>
            Estimado: US$ {visuals?.estimatedCost?.totalUsd.toFixed(2) ?? script.estimatedCost.totalUsd.toFixed(2)}
          </p>
        </div>

        <JobProgressList
          title="Visual generation"
          items={
            visuals?.progress ?? [
              { label: "Style Bible", status: "pending" },
              { label: "Image pack", status: "pending" },
              { label: "Veo hero", status: "pending" },
            ]
          }
          compact
        />

        <div className="button-stack">
          <button type="button" className="ghost-button" onClick={onBack}>
            Volver al guion
          </button>
          <button
            type="button"
            className="ghost-button"
            disabled={isGenerating}
            onClick={handleGenerateClick}
          >
            {isGenerating ? "Generando..." : "Generar visuales"}
          </button>
          <button
            type="button"
            className="primary-button"
            disabled={visuals?.status !== "done"}
            onClick={onProceed}
          >
            Continuar a render
          </button>
        </div>
      </aside>
    </div>
  );
};
