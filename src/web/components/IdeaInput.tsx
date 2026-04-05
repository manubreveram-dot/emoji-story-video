import React, { useState } from "react";

const ART_STYLES = [
  { id: "3d digital art", label: "3D Digital" },
  { id: "watercolor illustration", label: "Watercolor" },
  { id: "photorealistic", label: "Photo" },
  { id: "anime style", label: "Anime" },
  { id: "minimalist flat design", label: "Minimalist" },
  { id: "comic book style", label: "Comic" },
];

type IdeaInputProps = {
  onGenerate: (idea: string, artStyle: string) => void;
  isLoading: boolean;
};

export const IdeaInput: React.FC<IdeaInputProps> = ({ onGenerate, isLoading }) => {
  const [idea, setIdea] = useState("");
  const [artStyle, setArtStyle] = useState("3d digital art");

  return (
    <div style={{ maxWidth: 600, margin: "0 auto", padding: "40px 20px" }}>
      <h1
        style={{
          fontSize: 36,
          fontWeight: 700,
          textAlign: "center",
          marginBottom: 8,
          background: "linear-gradient(135deg, #FF6B6B, #FFE66D, #4ECDC4)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
        }}
      >
        Emoji Story Video
      </h1>
      <p style={{ textAlign: "center", color: "#888", fontSize: 14, marginBottom: 40 }}>
        AI-powered 60-second story videos
      </p>

      <label style={{ display: "block", marginBottom: 8, color: "#aaa", fontSize: 14 }}>
        Describe your video idea
      </label>
      <textarea
        value={idea}
        onChange={(e) => setIdea(e.target.value)}
        placeholder="E.g: A motivational video about never giving up in life..."
        style={{
          width: "100%",
          height: 140,
          padding: 16,
          borderRadius: 12,
          border: "1px solid #333",
          backgroundColor: "#1a1a2e",
          color: "#e0e0e0",
          fontSize: 16,
          lineHeight: 1.6,
          resize: "vertical",
          outline: "none",
          fontFamily: "inherit",
        }}
      />

      <label style={{ display: "block", marginTop: 24, marginBottom: 12, color: "#aaa", fontSize: 14 }}>
        Visual style
      </label>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        {ART_STYLES.map((s) => (
          <button
            key={s.id}
            onClick={() => setArtStyle(s.id)}
            style={{
              padding: "8px 16px",
              borderRadius: 8,
              border: artStyle === s.id ? "2px solid #4ECDC4" : "1px solid #333",
              backgroundColor: artStyle === s.id ? "rgba(78, 205, 196, 0.15)" : "#1a1a2e",
              color: artStyle === s.id ? "#4ECDC4" : "#888",
              fontSize: 13,
              cursor: "pointer",
              transition: "all 0.2s",
            }}
          >
            {s.label}
          </button>
        ))}
      </div>

      <div style={{ display: "flex", gap: 16, marginTop: 16 }}>
        <div style={{ padding: "8px 14px", borderRadius: 8, backgroundColor: "#1a1a2e", border: "1px solid #2a2a3e" }}>
          <div style={{ fontSize: 11, color: "#666", textTransform: "uppercase" }}>Duration</div>
          <div style={{ fontSize: 16, fontWeight: 600 }}>60s</div>
        </div>
        <div style={{ padding: "8px 14px", borderRadius: 8, backgroundColor: "#1a1a2e", border: "1px solid #2a2a3e" }}>
          <div style={{ fontSize: 11, color: "#666", textTransform: "uppercase" }}>Format</div>
          <div style={{ fontSize: 16, fontWeight: 600 }}>9:16</div>
        </div>
      </div>

      <button
        onClick={() => onGenerate(idea, artStyle)}
        disabled={!idea.trim() || isLoading}
        style={{
          width: "100%",
          marginTop: 32,
          padding: "16px 24px",
          borderRadius: 12,
          border: "none",
          backgroundColor: idea.trim() && !isLoading ? "#4ECDC4" : "#333",
          color: idea.trim() && !isLoading ? "#000" : "#666",
          fontSize: 16,
          fontWeight: 700,
          cursor: idea.trim() && !isLoading ? "pointer" : "not-allowed",
          transition: "all 0.2s",
        }}
      >
        {isLoading ? "Generating script..." : "Generate Script ->"}
      </button>
    </div>
  );
};
