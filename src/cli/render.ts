import { bundle } from "@remotion/bundler";
import { renderMedia, selectComposition } from "@remotion/renderer";
import path from "path";
import { parseTextToScenes } from "../ai/parser";

async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.log("Usage: npx tsx src/cli/render.ts \"Your text here\" [--output path.mp4] [--quality draft|production]");
    process.exit(1);
  }

  // Parse arguments
  let text = "";
  let outputPath = path.resolve("output", "video.mp4");
  let quality: "draft" | "production" = "production";

  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--output" && args[i + 1]) {
      outputPath = path.resolve(args[i + 1]);
      i++;
    } else if (args[i] === "--quality" && args[i + 1]) {
      quality = args[i + 1] as "draft" | "production";
      i++;
    } else if (!args[i].startsWith("--")) {
      text = args[i];
    }
  }

  if (!text) {
    console.error("Error: No text provided");
    process.exit(1);
  }

  console.log(`Parsing text: "${text}"`);
  const scenes = parseTextToScenes(text);
  console.log(`Generated ${scenes.length} scene(s)`);

  console.log("Bundling Remotion project...");
  const bundleLocation = await bundle({
    entryPoint: path.resolve("src", "index.ts"),
    webpackOverride: (config) => config,
  });

  console.log("Selecting composition...");
  const composition = await selectComposition({
    serveUrl: bundleLocation,
    id: "EmojiStoryVideo",
    inputProps: { scenes },
  });

  const crf = quality === "draft" ? 28 : 18;
  const scale = quality === "draft" ? 0.5 : 1;

  console.log(`Rendering ${quality} quality (${composition.durationInFrames} frames, ${scale}x scale)...`);

  await renderMedia({
    composition,
    serveUrl: bundleLocation,
    codec: "h264",
    outputLocation: outputPath,
    inputProps: { scenes },
    crf,
    scale,
    onProgress: ({ progress }) => {
      const pct = Math.round(progress * 100);
      process.stdout.write(`\rRendering: ${"#".repeat(Math.floor(pct / 2))}${".".repeat(50 - Math.floor(pct / 2))} ${pct}%`);
    },
  });

  console.log(`\nDone! Video saved to: ${outputPath}`);
}

main().catch((err) => {
  console.error("Render failed:", err);
  process.exit(1);
});
