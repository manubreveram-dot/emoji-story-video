import "dotenv/config";
import { bundle } from "@remotion/bundler";
import { renderMedia, selectComposition } from "@remotion/renderer";
import path from "path";
import { generateScript } from "../ai/script-generator";
import { generateAllImages } from "../ai/image-generator";
import { scriptToScenes } from "../ai/script-to-scenes";
import { computeTotalDuration } from "../ai/parser";

async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.log(
      'Usage: npx tsx src/cli/generate.ts "Your video idea" [--style "3d digital art"] [--output path.mp4]',
    );
    process.exit(1);
  }

  let idea = "";
  let artStyle = "3d digital art";
  let outputPath = path.resolve("output", "story.mp4");

  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--style" && args[i + 1]) {
      artStyle = args[i + 1];
      i++;
    } else if (args[i] === "--output" && args[i + 1]) {
      outputPath = path.resolve(args[i + 1]);
      i++;
    } else if (!args[i].startsWith("--")) {
      idea = args[i];
    }
  }

  if (!idea) {
    console.error("Error: No idea provided");
    process.exit(1);
  }

  // Step 1: Generate script
  console.log(`\n[1/4] Generating script for: "${idea}"`);
  const script = await generateScript(idea, artStyle);
  console.log(`  Title: "${script.title}"`);
  console.log(`  Scenes: ${script.scenes.length}`);
  console.log(`  Duration: ${script.totalDurationSeconds}s`);

  // Step 2: Generate images
  console.log(`\n[2/4] Generating ${script.scenes.length} images with Gemini...`);
  const outputDir = path.resolve("public", "generated");
  const imagePaths = await generateAllImages(
    script.scenes,
    script.style,
    outputDir,
    (progress) => {
      const done = progress.filter((p) => p.status === "done").length;
      const total = progress.length;
      process.stdout.write(`\r  Progress: ${done}/${total} images`);
    },
  );
  console.log("\n  Images generated!");

  // Step 3: Build scenes
  console.log("\n[3/4] Composing video...");
  const scenes = scriptToScenes(script, imagePaths);
  const totalDuration = computeTotalDuration(scenes);
  console.log(`  Total frames: ${totalDuration}`);

  // Step 4: Render
  console.log("\n[4/4] Rendering MP4...");
  const bundleLocation = await bundle({
    entryPoint: path.resolve("src", "index.ts"),
    webpackOverride: (config) => config,
  });

  const composition = await selectComposition({
    serveUrl: bundleLocation,
    id: "EmojiStoryVideo",
    inputProps: { scenes },
  });

  await renderMedia({
    composition,
    serveUrl: bundleLocation,
    codec: "h264",
    outputLocation: outputPath,
    inputProps: { scenes },
    crf: 18,
    onProgress: ({ progress }) => {
      const pct = Math.round(progress * 100);
      process.stdout.write(
        `\r  Rendering: ${"#".repeat(Math.floor(pct / 2))}${".".repeat(50 - Math.floor(pct / 2))} ${pct}%`,
      );
    },
  });

  console.log(`\n\nDone! Video saved to: ${outputPath}`);
}

main().catch((err) => {
  console.error("Generate failed:", err);
  process.exit(1);
});
