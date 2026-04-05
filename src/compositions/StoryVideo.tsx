import React from "react";
import { AbsoluteFill } from "remotion";
import { TransitionSeries, linearTiming } from "@remotion/transitions";
import type { SceneBlueprint } from "../types/scene";
import { TRANSITION_DURATION } from "../config/video";
import { SceneRenderer } from "../scenes/SceneRenderer";
import { getTransitionPresentation } from "../animations/transitions";

type StoryVideoProps = {
  scenes: SceneBlueprint[];
};

export const StoryVideo: React.FC<StoryVideoProps> = ({ scenes }) => {
  if (scenes.length === 0) {
    return (
      <AbsoluteFill
        style={{
          backgroundColor: "#1a1a2e",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#fff",
          fontSize: 48,
        }}
      >
        Enter text to generate video
      </AbsoluteFill>
    );
  }

  return (
    <AbsoluteFill>
      <TransitionSeries>
        {scenes.map((scene, index) => (
          <React.Fragment key={index}>
            <TransitionSeries.Sequence durationInFrames={scene.durationInFrames}>
              <SceneRenderer scene={scene} />
            </TransitionSeries.Sequence>
            {index < scenes.length - 1 && (
              <TransitionSeries.Transition
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                presentation={getTransitionPresentation(scene.transitionToNext) as any}
                timing={linearTiming({ durationInFrames: TRANSITION_DURATION })}
              />
            )}
          </React.Fragment>
        ))}
      </TransitionSeries>
    </AbsoluteFill>
  );
};
