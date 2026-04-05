import React from "react";

type GlassPanelProps = {
  children: React.ReactNode;
  style?: React.CSSProperties;
};

export const GlassPanel: React.FC<GlassPanelProps> = ({ children, style }) => {
  return (
    <div
      style={{
        backgroundColor: "rgba(255, 255, 255, 0.08)",
        backdropFilter: "blur(16px)",
        WebkitBackdropFilter: "blur(16px)",
        borderRadius: 24,
        border: "1px solid rgba(255, 255, 255, 0.1)",
        boxShadow: "0 30px 60px rgba(0, 0, 0, 0.3)",
        padding: "40px 32px",
        ...style,
      }}
    >
      {children}
    </div>
  );
};
