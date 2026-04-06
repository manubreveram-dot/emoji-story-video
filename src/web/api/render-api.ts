import "dotenv/config";
import express from "express";
import cors from "cors";
import fs from "fs";
import path from "path";
import { generateScript } from "../../ai/script-generator";
import { generateAllImages } from "../../ai/image-generator";
import type { Script } from "../../types/script";
import type { ImageGenerationProgress } from "../../ai/image-generator";
import {
  createRenderJob,
  createScriptDraft,
  createVisualJob,
  getAsset,
  getAssetFilePath,
  getRenderJob,
  getScriptDraft,
  getVisualJob,
  startCleanupLoop,
  updateScriptDraft,
} from "./v2-runtime";

const app = express();
app.use(cors());
app.use(express.json());
startCleanupLoop();

app.get("/health", (_req, res) => {
  res.json({ ok: true });
});

// Store in-progress jobs
const jobs = new Map<
  string,
  {
    status: "generating" | "done" | "error";
    progress: ImageGenerationProgress[];
    imagePaths: string[];
    error?: string;
  }
>();

// POST /api/script - Generate a script from an idea
app.post("/api/script", async (req, res) => {
  const { idea, artStyle } = req.body;
  if (!idea) {
    res.status(400).json({ error: "idea is required" });
    return;
  }

  try {
    const script = await generateScript(idea, artStyle || "3d digital art");
    res.json(script);
  } catch (err) {
    res.status(500).json({
      error: err instanceof Error ? err.message : "Script generation failed",
    });
  }
});

// POST /api/images - Start generating images for a script
app.post("/api/images", async (req, res) => {
  const { script } = req.body as { script: Script };
  if (!script?.scenes) {
    res.status(400).json({ error: "script with scenes is required" });
    return;
  }

  const jobId = `job-${Date.now()}`;
  const outputDir = path.resolve("public", "generated");

  jobs.set(jobId, {
    status: "generating",
    progress: script.scenes.map((s) => ({
      sceneId: s.id,
      status: "pending" as const,
    })),
    imagePaths: [],
  });

  res.json({ jobId });

  // Run image generation in background
  try {
    const imagePaths = await generateAllImages(
      script.scenes,
      script.style,
      outputDir,
      (progress) => {
        const job = jobs.get(jobId);
        if (job) job.progress = progress;
      },
    );

    const job = jobs.get(jobId);
    if (job) {
      job.status = "done";
      job.imagePaths = imagePaths;
    }
  } catch (err) {
    const job = jobs.get(jobId);
    if (job) {
      job.status = "error";
      job.error = err instanceof Error ? err.message : "Image generation failed";
    }
  }
});

// GET /api/images/:jobId - Check image generation progress
app.get("/api/images/:jobId", (req, res) => {
  const job = jobs.get(req.params.jobId);
  if (!job) {
    res.status(404).json({ error: "Job not found" });
    return;
  }
  res.json(job);
});

app.post("/api/script/v2", async (req, res) => {
  const { idea, artStyle, costCapUsd, budgetCapUsd, useVeo } = req.body as {
    idea?: string;
    artStyle?: string;
    costCapUsd?: number;
    budgetCapUsd?: number;
    useVeo?: boolean;
  };

  if (!idea?.trim()) {
    res.status(400).json({ error: "idea is required" });
    return;
  }

  try {
    const draft = await createScriptDraft({
      idea: idea.trim(),
      artStyle,
      costCapUsd: budgetCapUsd ?? costCapUsd,
      useVeo,
    });
    res.status(201).json(draft);
  } catch (error) {
    res.status(500).json({
      error: error instanceof Error ? error.message : "Script V2 generation failed",
    });
  }
});

app.patch("/api/script/v2/:id", (req, res) => {
  try {
    const draft = updateScriptDraft(req.params.id, req.body ?? {});
    res.json(draft);
  } catch (error) {
    res.status(404).json({
      error: error instanceof Error ? error.message : "Script V2 draft not found",
    });
  }
});

app.post("/api/visuals/v2/jobs", async (req, res) => {
  const { scriptId, regenerateActIndex } = req.body as {
    scriptId?: string;
    regenerateActIndex?: number;
  };
  console.log(
    JSON.stringify({
      ts: new Date().toISOString(),
      event: "visual.v2.request.received",
      scriptId,
      regenerateActIndex,
    }),
  );
  if (!scriptId) {
    res.status(400).json({ error: "scriptId is required" });
    return;
  }

  if (!getScriptDraft(scriptId)) {
    res.status(404).json({ error: "Script V2 draft not found" });
    return;
  }

  try {
    const job = await createVisualJob(scriptId, regenerateActIndex);
    res.status(202).json({
      jobId: job.jobId,
      status: job.status,
      warning: job.message,
    });
  } catch (error) {
    res.status(500).json({
      error: error instanceof Error ? error.message : "Visual job creation failed",
    });
  }
});

app.get("/api/visuals/v2/jobs/:jobId", (req, res) => {
  const job = getVisualJob(req.params.jobId);
  if (!job) {
    res.status(404).json({ error: "Visual job not found" });
    return;
  }

  res.json(job);
});

app.post("/api/render/v2/jobs", async (req, res) => {
  const { scriptId, visualJobId } = req.body as {
    scriptId?: string;
    visualJobId?: string;
  };

  if (!scriptId || !visualJobId) {
    res.status(400).json({ error: "scriptId and visualJobId are required" });
    return;
  }

  try {
    const job = await createRenderJob(scriptId, visualJobId);
    res.status(202).json({
      jobId: job.jobId,
      status: job.status,
    });
  } catch (error) {
    res.status(400).json({
      error: error instanceof Error ? error.message : "Render job creation failed",
    });
  }
});

app.get("/api/render/v2/jobs/:jobId", (req, res) => {
  const job = getRenderJob(req.params.jobId);
  if (!job) {
    res.status(404).json({ error: "Render job not found" });
    return;
  }

  res.json(job);
});

app.get("/api/assets/:assetId/download", (req, res) => {
  const asset = getAsset(req.params.assetId);
  if (!asset) {
    res.status(404).json({ error: "Asset not found or expired" });
    return;
  }

  const filePath = getAssetFilePath(req.params.assetId);
  if (!filePath || !fs.existsSync(filePath)) {
    res.status(404).json({ error: "Asset file missing" });
    return;
  }

  res.setHeader("Content-Type", asset.contentType);
  res.download(filePath, asset.filename);
});

// Serve generated images
app.use(
  "/generated",
  express.static(path.resolve("public", "generated")),
);

const webDistDir = path.resolve("dist", "web");
const indexHtmlPath = path.join(webDistDir, "index.html");
const hasWebBuild = fs.existsSync(indexHtmlPath);

if (hasWebBuild) {
  app.use(express.static(webDistDir));
  app.use((req, res, next) => {
    if (req.method !== "GET") {
      next();
      return;
    }

    if (req.path.startsWith("/api") || req.path.startsWith("/generated")) {
      next();
      return;
    }

    res.sendFile(indexHtmlPath);
  });
}

const PORT = Number(process.env.PORT) || 3001;
app.listen(PORT, () => {
  console.log(`API server running on port ${PORT}`);
  if (hasWebBuild) {
    console.log(`Serving web build from ${webDistDir}`);
  } else {
    console.log("Web build not found. Run `npm run build:web` for production.");
  }
  console.log(`  POST /api/script   - Generate script from idea`);
  console.log(`  POST /api/images   - Start image generation`);
  console.log(`  GET  /api/images/:id - Check progress`);
});
