import React from "react";
import { Player } from "@remotion/player";
import { StoryVideo } from "../../compositions/StoryVideo";
import { computeTotalDuration } from "../../ai/parser";
import { VIDEO_FPS, VIDEO_WIDTH, VIDEO_HEIGHT } from "../../config/video";
import type { SceneBlueprint } from "../../types/scene";

type PreviewPlayerProps = {
  scenes: SceneBlueprint[];
  onBack: () => void;
  onExport: () => void;
};

export const PreviewPlayer: React.FC<PreviewPlayerProps> = ({
  scenes,
  onBack,
  onExport,
}) => {
  const totalDuration = computeTotalDuration(scenes);
  const durationSeconds = (totalDuration / VIDEO_FPS).toFixed(1);

  return (
    <div
      style={{
        display: "flex",
        gap: 32,
        padding: "20px",
        maxWidth: 1100,
        margin: "0 auto",
        flexWrap: "wrap",
        justifyContent: "center",
      }}
    >
      {/* Player */}
      <div>
        <div
          style={{
            borderRadius: 16,
            overflow: "hidden",
            boxShadow: "0 20px 60px rgba(0, 0, 0, 0.5)",
          }}
        >
          <Player
            component={StoryVideo}
            inputProps={{ scenes }}
            durationInFrames={Math.max(totalDuration, VIDEO_FPS)}
            compositionWidth={VIDEO_WIDTH}
            compositionHeight={VIDEO_HEIGHT}
            fps={VIDEO_FPS}
            style={{ width: 360, height: 640 }}
            controls
            autoPlay
            loop
          />
        </div>
        <div style={{ textAlign: "center", marginTop: 12, color: "#666", fontSize: 13 }}>
          {durationSeconds}s / {scenes.length} scenes / {totalDuration} frames
        </div>
      </div>

      {/* Scene list */}
      <div style={{ flex: 1, minWidth: 300, maxWidth: 400 }}>
        <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 16 }}>
          Scene Breakdown
        </h3>

        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {scenes.map((scene, i) => (
            <div
              key={i}
              style={{
                padding: "12px 14px",
                borderRadius: 10,
                backgroundColor: "#1a1a2e",
                border: "1px solid #2a2a3e",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12 }}>
                <span style={{ color: "#888" }}>
                  {i + 1}. {scene.layout}
                  {scene.imageUrl ? " (img)" : ""}
                </span>
                <span>{scene.emojis.slice(0, 3).join(" ")}</span>
              </div>
              <div style={{ color: "#ccc", fontSize: 14, marginTop: 4 }}>
                {scene.text}
              </div>
            </div>
          ))}
        </div>

        <div style={{ display: "flex", gap: 12, marginTop: 24 }}>
          <button onClick={onBack} style={btnStyle("#333", "#aaa")}>
            Edit Script
          </button>
          <button onClick={onExport} style={btnStyle("#4ECDC4", "#000")}>
            Export MP4
          </button>
        </div>
      </div>
    </div>
  );
};

function btnStyle(bg: string, color: string): React.CSSProperties {
  return {
    padding: "12px 24px",
    borderRadius: 10,
    border: "none",
    backgroundColor: bg,
    color,
    fontSize: 14,
    fontWeight: 600,
    cursor: "pointer",
    flex: 1,
  };
}
