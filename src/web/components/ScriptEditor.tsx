import React from "react";
import type { Script, ScriptScene } from "../../types/script";

type ScriptEditorProps = {
  script: Script;
  onUpdateScene: (index: number, scene: ScriptScene) => void;
  onRegenerate: () => void;
  onApprove: () => void;
  onPreviewWithoutImages: () => void;
  onBack: () => void;
  isLoading: boolean;
};

export const ScriptEditor: React.FC<ScriptEditorProps> = ({
  script,
  onUpdateScene,
  onRegenerate,
  onApprove,
  onPreviewWithoutImages,
  onBack,
  isLoading,
}) => {
  const totalSeconds = script.scenes.reduce((sum, s) => sum + s.durationSeconds, 0);

  return (
    <div style={{ maxWidth: 700, margin: "0 auto", padding: "20px" }}>
      <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 4 }}>
        {script.title}
      </h2>
      <p style={{ color: "#888", fontSize: 13, marginBottom: 24 }}>
        {script.style.artStyle} / {script.style.colorTone}
      </p>

      {/* Timeline bar */}
      <div style={{ display: "flex", gap: 2, marginBottom: 24, height: 8, borderRadius: 4, overflow: "hidden" }}>
        {script.scenes.map((scene, i) => {
          const widthPercent = (scene.durationSeconds / 60) * 100;
          const colors = ["#FF6B6B", "#FFE66D", "#4ECDC4", "#A78BFA", "#F472B6", "#FBBF24", "#34D399", "#60A5FA", "#E879F9", "#FB923C"];
          return (
            <div
              key={i}
              style={{
                width: `${widthPercent}%`,
                backgroundColor: colors[i % colors.length],
                opacity: 0.7,
              }}
              title={`Scene ${i + 1}: ${scene.durationSeconds}s`}
            />
          );
        })}
      </div>

      {/* Scene list */}
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {script.scenes.map((scene, i) => (
          <div
            key={scene.id}
            style={{
              padding: "16px",
              borderRadius: 12,
              backgroundColor: "#1a1a2e",
              border: "1px solid #2a2a3e",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
              <span style={{ fontSize: 12, color: "#888" }}>
                {i + 1}. {scene.layout} ({scene.durationSeconds}s)
              </span>
              <span style={{ fontSize: 14 }}>
                {scene.emojis.slice(0, 3).join(" ")}
              </span>
            </div>

            <input
              value={scene.narration}
              onChange={(e) => onUpdateScene(i, { ...scene, narration: e.target.value })}
              style={{
                width: "100%",
                padding: "8px 12px",
                borderRadius: 8,
                border: "1px solid #333",
                backgroundColor: "#0a0a1a",
                color: "#e0e0e0",
                fontSize: 15,
                fontWeight: 600,
                outline: "none",
                marginBottom: 6,
              }}
            />
            <div style={{ fontSize: 12, color: "#666", lineHeight: 1.4 }}>
              {scene.visualDescription.slice(0, 100)}...
            </div>
            <div style={{ fontSize: 11, color: "#555", marginTop: 4 }}>
              {scene.mood} / {scene.imageAnimation} / {scene.transition}
            </div>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 24 }}>
        <div style={{ color: "#888", fontSize: 14 }}>
          Total: <strong style={{ color: totalSeconds === 60 ? "#4ECDC4" : "#FF6B6B" }}>{totalSeconds}s</strong> | Scenes: {script.scenes.length}
        </div>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          <button onClick={onBack} style={btnStyle("#333", "#aaa")}>
            Back
          </button>
          <button onClick={onRegenerate} disabled={isLoading} style={btnStyle("#333", "#FFE66D")}>
            {isLoading ? "Regenerating..." : "Regenerate"}
          </button>
          <button onClick={onPreviewWithoutImages} disabled={isLoading} style={btnStyle("#7C4DFF", "#fff")}>
            Preview (no images)
          </button>
          <button onClick={onApprove} disabled={isLoading} style={btnStyle("#4ECDC4", "#000")}>
            Generate Images {"->"}
          </button>
        </div>
      </div>
    </div>
  );
};

function btnStyle(bg: string, color: string): React.CSSProperties {
  return {
    padding: "10px 20px",
    borderRadius: 10,
    border: "none",
    backgroundColor: bg,
    color,
    fontSize: 14,
    fontWeight: 600,
    cursor: "pointer",
  };
}
