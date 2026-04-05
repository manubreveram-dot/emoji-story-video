import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  root: path.resolve(__dirname),
  envDir: path.resolve(__dirname, "../.."),
  build: {
    outDir: path.resolve(__dirname, "../../dist/web"),
    emptyOutDir: true,
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, ".."),
    },
  },
  server: {
    port: 5173,
    proxy: {
      "/api": {
        target: "http://localhost:3001",
        changeOrigin: true,
      },
      "/generated": {
        target: "http://localhost:3001",
        changeOrigin: true,
      },
    },
  },
});
