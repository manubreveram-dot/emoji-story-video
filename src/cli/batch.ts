import { bundle } from "@remotion/bundler";
import { renderMedia, selectComposition } from "@remotion/renderer";
import path from "path";
import fs from "fs";
import { parseTextToScenes } from "../ai/parser";

type BatchEntry = {
  text: string;
  output?: string;
};

async function main() {
  const inputFile = process.argv[2];

  if (!inputFile) {
    console.log("Usage: npx tsx src/cli/batch.ts ./batch-input.json");
    console.log("\nJSON format:");
    console.log('[{ "text": "Hello!", "output": "hello.mp4" }]');
    process.exit(1);
  }

  const raw = fs.readFileSync(path.resolve(inputFile), "utf-8");
  const entries: BatchEntry[] = JSON.parse(raw);
  console.log(`Loaded ${entries.length} entries from ${inputFile}`);

  console.log("Bundling Remotion project...");
  const bundleLocation = await bundle({
    entryPoint: path.resolve("src", "index.ts"),
    webpackOverride: (config) => config,
  });

  for (let i = 0; i < entries.length; i++) {
    const entry = entries[i];
    const outputPath = path.resolve("output", entry.output || `video-${i + 1}.mp4`);
    console.log(`\n[${i + 1}/${entries.length}] "${entry.text}"`);

    const scenes = parseTextToScenes(entry.text);
    console.log(`  ${scenes.length} scene(s)`);

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
        process.stdout.write(`\r  Rendering: ${pct}%`);
      },
    });

    console.log(`\n  Saved: ${outputPath}`);
  }

  console.log("\nBatch complete!");
}

main().catch((err) => {
  console.error("Batch render failed:", err);
  process.exit(1);
});
