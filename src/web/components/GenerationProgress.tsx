import React from "react";
import type { ImageGenerationProgress } from "../../ai/image-generator";

type GenerationProgressProps = {
  progress: ImageGenerationProgress[];
  totalScenes: number;
};

export const GenerationProgress: React.FC<GenerationProgressProps> = ({
  progress,
  totalScenes,
}) => {
  const done = progress.filter((p) => p.status === "done").length;
  const errors = progress.filter((p) => p.status === "error").length;

  return (
    <div style={{ maxWidth: 500, margin: "0 auto", padding: "60px 20px" }}>
      <h2 style={{ fontSize: 24, fontWeight: 700, textAlign: "center", marginBottom: 8 }}>
        Generating images with Gemini...
      </h2>
      <p style={{ textAlign: "center", color: "#888", fontSize: 14, marginBottom: 40 }}>
        {done}/{totalScenes} scenes complete
        {errors > 0 && <span style={{ color: "#FF6B6B" }}> ({errors} errors)</span>}
      </p>

      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {progress.map((p, i) => (
          <div
            key={p.sceneId}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              padding: "12px 16px",
              borderRadius: 10,
              backgroundColor: "#1a1a2e",
              border: "1px solid #2a2a3e",
            }}
          >
            <span style={{ fontSize: 13, color: "#888", minWidth: 80 }}>
              Scene {i + 1}
            </span>

            {/* Progress bar */}
            <div style={{ flex: 1, height: 6, borderRadius: 3, backgroundColor: "#2a2a3e", overflow: "hidden" }}>
              <div
                style={{
                  height: "100%",
                  borderRadius: 3,
                  width: p.status === "done" ? "100%" : p.status === "generating" ? "60%" : "0%",
                  backgroundColor:
                    p.status === "done" ? "#4ECDC4" :
                    p.status === "generating" ? "#FFE66D" :
                    p.status === "error" ? "#FF6B6B" : "#333",
                  transition: "width 0.5s ease",
                }}
              />
            </div>

            <span style={{ fontSize: 12, color: "#666", minWidth: 70, textAlign: "right" }}>
              {p.status === "done" ? "Done" :
               p.status === "generating" ? "Generating..." :
               p.status === "error" ? "Error" : "Waiting"}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};
