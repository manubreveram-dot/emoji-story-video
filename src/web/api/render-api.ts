import "dotenv/config";
import express from "express";
import cors from "cors";
import fs from "fs";
import path from "path";
import { generateScript } from "../../ai/script-generator";
import { generateAllImages } from "../../ai/image-generator";
import type { Script } from "../../types/script";
import type { ImageGenerationProgress } from "../../ai/image-generator";

const app = express();
app.use(cors());
app.use(express.json());

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
