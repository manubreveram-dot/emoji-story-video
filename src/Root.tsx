import React from "react";
import { Composition } from "remotion";
import type { CalculateMetadataFunction } from "remotion";
import { loadFont as loadMontserrat } from "@remotion/google-fonts/Montserrat";
import { loadFont as loadInter } from "@remotion/google-fonts/Inter";
import { StoryVideo } from "./compositions/StoryVideo";
import { VideoInputSchema } from "./types/input";
import type { VideoInputProps } from "./types/input";
import { VIDEO_FPS, VIDEO_WIDTH, VIDEO_HEIGHT } from "./config/video";
import { parseTextToScenes, computeTotalDuration } from "./ai/parser";

// Load fonts globally
loadMontserrat("normal", { weights: ["400", "700"], subsets: ["latin"] });
loadInter("normal", { weights: ["400", "700"], subsets: ["latin"] });

const defaultScenes = parseTextToScenes(
  "Happy birthday! You're amazing! Let's celebrate!",
);

const calculateMetadata: CalculateMetadataFunction<VideoInputProps> = ({
  props,
}) => {
  const duration = computeTotalDuration(props.scenes);
  return {
    durationInFrames: Math.max(duration, VIDEO_FPS),
  };
};

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="EmojiStoryVideo"
        component={StoryVideo}
        durationInFrames={computeTotalDuration(defaultScenes)}
        fps={VIDEO_FPS}
        width={VIDEO_WIDTH}
        height={VIDEO_HEIGHT}
        schema={VideoInputSchema}
        defaultProps={{
          scenes: defaultScenes,
        }}
        calculateMetadata={calculateMetadata}
      />
    </>
  );
};
