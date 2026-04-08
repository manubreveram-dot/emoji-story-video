import React from "react";
import { Player } from "@remotion/player";
import { StoryVideo } from "../../compositions/StoryVideo";
import { computeTotalDuration } from "../../ai/parser";
import { VIDEO_FPS, VIDEO_HEIGHT, VIDEO_WIDTH } from "../../config/video";
import type { SceneBlueprint } from "../../types/scene";
import type {
  GeneratedAsset,
  RenderPack,
  ScriptDocumentV2,
  VisualPack,
} from "../../types/workflow-v2";
import { JobProgressList } from "./JobProgressList";

type RenderDownloadProps = {
  script: ScriptDocumentV2;
  visuals: VisualPack | null;
  renderPack: RenderPack | null;
  previewScenes: SceneBlueprint[];
  isPolling: boolean;
  onBack: () => void;
  onRender: () => void;
};

function downloadUrl(asset: GeneratedAsset | undefined): string | undefined {
  if (!asset) return undefined;
  if (asset.url) return asset.url;
  return asset.id ? `/api/assets/${asset.id}/download` : undefined;
}

export const RenderDownload: React.FC<RenderDownloadProps> = ({
  script: _script,
  visuals,
  renderPack,
  previewScenes,
  isPolling,
  onBack,
  onRender,
}) => {
  const totalDuration = computeTotalDuration(previewScenes);
  const hasPreview = previewScenes.length > 0;
  const narrationReady = Boolean(downloadUrl(renderPack?.narrationAudio));
  const renderStatusLabel =
    renderPack?.status === "running"
      ? "en curso"
      : renderPack?.status === "done"
        ? "listo"
        : renderPack?.status === "error"
          ? "error"
          : renderPack?.status === "pending"
            ? "pendiente"
            : "inactivo";

  return (
    <div className="wizard-grid">
      <section className="panel span-2 panel-light">
        <div className="panel-header">
          <div>
            <p className="eyebrow">Exportacion final</p>
            <h2>Render final y descarga de entregables</h2>
            <p className="muted-copy">
              Revisa preview, exporta MP4 y descarga archivos en un solo paso.
            </p>
          </div>
        </div>

        <div className="render-stage">
          {hasPreview ? (
            <div className="preview-player-shell">
              <Player
                component={StoryVideo}
                inputProps={{
                  scenes: previewScenes,
                  audioUrl: renderPack?.narrationAudio?.path,
                }}
                durationInFrames={Math.max(totalDuration, VIDEO_FPS)}
                compositionWidth={VIDEO_WIDTH}
                compositionHeight={VIDEO_HEIGHT}
                fps={VIDEO_FPS}
                style={{ width: 360, height: 640 }}
                controls
                loop
              />
            </div>
          ) : (
            <div className="visual-empty render-empty">
              <span>No hay preview disponible aun.</span>
            </div>
          )}

          <div className="download-card">
            <p className="eyebrow">Descargas</p>
            <h3>{renderStatusLabel}</h3>
            <p className="muted-copy">
              Narracion: {narrationReady ? "lista" : "pendiente"} | Audio WAV
            </p>

            <div className="button-stack">
              <a
                className={`download-link ${
                  downloadUrl(renderPack?.finalVideo) ? "" : "download-link-disabled"
                }`}
                href={downloadUrl(renderPack?.finalVideo)}
              >
                Descargar MP4 final
              </a>
              <a
                className={`download-link ${
                  downloadUrl(renderPack?.imageZip) ? "" : "download-link-disabled"
                }`}
                href={downloadUrl(renderPack?.imageZip)}
              >
                Descargar ZIP de imagenes
              </a>
              <a
                className={`download-link ${
                  downloadUrl(renderPack?.narrationAudio)
                    ? ""
                    : "download-link-disabled"
                }`}
                href={downloadUrl(renderPack?.narrationAudio)}
              >
                Descargar narracion WAV
              </a>
              <a
                className={`download-link ${
                  downloadUrl(renderPack?.heroVideo ?? visuals?.heroVideo)
                    ? ""
                    : "download-link-disabled"
                }`}
                href={downloadUrl(renderPack?.heroVideo ?? visuals?.heroVideo)}
              >
                Descargar clip hero
              </a>
            </div>
          </div>
        </div>
      </section>

      <aside className="panel panel-light">
        <JobProgressList
          title="Proceso de render"
          items={
            renderPack?.progress ?? [
              {
                label: "Recolectar assets",
                status: visuals?.status === "done" ? "done" : "pending",
              },
              { label: "Narracion", status: "pending" },
              { label: "Componer video", status: "pending" },
              { label: "Exportar MP4", status: "pending" },
            ]
          }
        />

        <div className="button-stack">
          <button type="button" className="ghost-button" onClick={onBack}>
            Volver a fotos
          </button>
          <button
            type="button"
            className="primary-button"
            disabled={isPolling || visuals?.status !== "done"}
            onClick={onRender}
          >
            {isPolling ? "Renderizando..." : "Renderizar y preparar descargas"}
          </button>
        </div>
      </aside>
    </div>
  );
};
