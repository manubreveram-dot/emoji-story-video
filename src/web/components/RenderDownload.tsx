import React from "react";
import { Player } from "@remotion/player";
import { StoryVideo } from "../../compositions/StoryVideo";
import { computeTotalDuration } from "../../ai/parser";
import { VIDEO_FPS, VIDEO_HEIGHT, VIDEO_WIDTH } from "../../config/video";
import type { SceneBlueprint } from "../../types/scene";
import type { GeneratedAsset, RenderPack, ScriptDocumentV2, VisualPack } from "../../types/workflow-v2";
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
  script,
  visuals,
  renderPack,
  previewScenes,
  isPolling,
  onBack,
  onRender,
}) => {
  const totalDuration = computeTotalDuration(previewScenes);
  const hasPreview = previewScenes.length > 0;

  return (
    <div className="wizard-grid">
      <section className="panel span-2">
        <div className="panel-header">
          <div>
            <p className="eyebrow">Render & Download</p>
            <h2>Preview final y assets descargables</h2>
            <p className="muted-copy">
              El mp4 final, las 4 imagenes y el clip hero se descargan desde esta pantalla.
            </p>
          </div>
          <div className="wizard-badge">
            TTL 1h
          </div>
        </div>

        <div className="render-stage">
          {hasPreview ? (
            <Player
              component={StoryVideo}
              inputProps={{ scenes: previewScenes }}
              durationInFrames={Math.max(totalDuration, VIDEO_FPS)}
              compositionWidth={VIDEO_WIDTH}
              compositionHeight={VIDEO_HEIGHT}
              fps={VIDEO_FPS}
              style={{ width: 360, height: 640 }}
              controls
              loop
            />
          ) : (
            <div className="visual-empty render-empty">
              <span>No hay preview disponible aun.</span>
            </div>
          )}

          <div className="download-card">
            <p className="eyebrow">Downloads</p>
            <h3>{renderPack?.status ?? "idle"}</h3>
            <div className="button-stack">
              <a
                className={`download-link ${downloadUrl(renderPack?.finalVideo) ? "" : "download-link-disabled"}`}
                href={downloadUrl(renderPack?.finalVideo)}
              >
                Descargar MP4 final
              </a>
              <a
                className={`download-link ${downloadUrl(renderPack?.imageZip) ? "" : "download-link-disabled"}`}
                href={downloadUrl(renderPack?.imageZip)}
              >
                Descargar ZIP imagenes
              </a>
              <a
                className={`download-link ${downloadUrl(renderPack?.heroVideo ?? visuals?.heroVideo) ? "" : "download-link-disabled"}`}
                href={downloadUrl(renderPack?.heroVideo ?? visuals?.heroVideo)}
              >
                Descargar clip Veo
              </a>
            </div>
            <p className="muted-copy">
              Costo real: US$ {renderPack?.actualCost?.totalUsd.toFixed(2) ?? visuals?.actualCost?.totalUsd.toFixed(2) ?? script.estimatedCost.totalUsd.toFixed(2)}
            </p>
          </div>
        </div>
      </section>

      <aside className="panel">
        <JobProgressList
          title="Render pipeline"
          items={
            renderPack?.progress ?? [
              { label: "Collect assets", status: visuals?.status === "done" ? "done" : "pending" },
              { label: "Compose Remotion", status: "pending" },
              { label: "Export MP4", status: "pending" },
            ]
          }
        />

        <div className="button-stack">
          <button type="button" className="ghost-button" onClick={onBack}>
            Volver a visuales
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
