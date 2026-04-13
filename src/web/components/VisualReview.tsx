import React from "react";
import type {
  GeneratedAsset,
  ScriptDocumentV2,
  VisualPack,
} from "../../types/workflow-v2";
import { DISTOPIAN_VISUAL_PRESETS } from "../../shared/channel-preset";
import { JobProgressList } from "./JobProgressList";

type VisualReviewProps = {
  script: ScriptDocumentV2;
  visuals: VisualPack | null;
  isPolling: boolean;
  onBack: () => void;
  onGenerate: () => void;
  onRegenerateAct: (actIndex: number) => void;
  onProceed: () => void;
  onActPromptChange: (actIndex: number, value: string) => void;
  onApplyPromptPreset: (actIndex: number, preset: string) => void;
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
  onActPromptChange,
  onApplyPromptPreset,
}) => {
  const imagesByAct = new Map<number, GeneratedAsset>();
  visuals?.images.forEach((asset, index) => {
    imagesByAct.set(asset.actIndex ?? index, asset);
  });

  const isGenerating =
    isPolling || visuals?.status === "running" || visuals?.status === "pending";
  const visualStatusLabel =
    visuals?.status === "running"
      ? "en curso"
      : visuals?.status === "done"
        ? "listo"
        : visuals?.status === "error"
          ? "error"
          : visuals?.status === "pending"
            ? "pendiente"
            : "Sin iniciar";

  return (
    <div className="wizard-grid">
      <section className="panel span-2 panel-light">
        <div className="panel-header">
          <div>
            <p className="eyebrow">Bloques de prompt visual</p>
            <h2>Refina cada foto para que se vea real y fiel a tu historia.</h2>
            <p className="muted-copy">
              Todo en espanol. Cada prompt debe responder al texto de su acto.
            </p>
          </div>
          <div className="consistency-stack">
            <span className="wizard-badge">
              Consistencia: {visuals?.consistencyScore?.toFixed(0) ?? "--"}%
            </span>
          </div>
        </div>

        <div className="visual-grid">
          {script.acts.map((act, index) => {
            const asset = imagesByAct.get(index);
            const src = asset ? assetUrl(asset) : undefined;

            return (
              <article key={act.id} className="visual-card visual-card-light editor-card">
                <div className="visual-preview">
                  {src ? (
                    <img src={src} alt={act.title} />
                  ) : (
                    <div className="visual-empty">
                      <span>{isGenerating ? "Generando imagen..." : "Sin imagen aun"}</span>
                    </div>
                  )}
                </div>

                <div className="visual-copy">
                  <div className="visual-copy-top">
                    <strong>Acto {index + 1}</strong>
                    <span>{act.title}</span>
                  </div>
                  <p>{act.summary}</p>
                </div>

                <label className="field">
                  <span>Prompt visual final (espanol)</span>
                  <textarea
                    rows={6}
                    value={act.visualPrompt}
                    onChange={(event) => onActPromptChange(index, event.target.value)}
                    placeholder="Describe escena fotografica real: sujeto, accion, lugar, luz, lente, profundidad y textura."
                  />
                </label>

                <div className="chip-row">
                  {DISTOPIAN_VISUAL_PRESETS.map((preset) => (
                    <button
                      key={preset.label}
                      type="button"
                      className="chip-button"
                      disabled={isGenerating}
                      onClick={() => onApplyPromptPreset(index, preset.value)}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>

                <button
                  type="button"
                  className="ghost-button"
                  disabled={isGenerating}
                  onClick={() => onRegenerateAct(index)}
                >
                  Regenerar solo este acto
                </button>
              </article>
            );
          })}
        </div>
      </section>

      <aside className="panel panel-light">
        <div className="summary-card">
          <p className="eyebrow">Estado visual</p>
          <h3>{visualStatusLabel}</h3>
          <p className="muted-copy">
            {visuals?.message ?? "Aun no se genero el paquete visual."}
          </p>
        </div>

        <JobProgressList
          title="Generacion de imagenes"
          items={
            visuals?.progress ?? [
              { label: "Guia visual", status: "pending" },
              { label: "Paquete de imagenes", status: "pending" },
              { label: "Clip hero", status: "pending" },
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
            onClick={onGenerate}
          >
            {isGenerating ? "Generando..." : "Generar imagenes"}
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
