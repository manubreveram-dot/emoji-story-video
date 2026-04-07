import type { ImageAnimation, SceneLayoutV2 } from "../types/script";

export type SceneTreatment = {
  layout: SceneLayoutV2;
  imageAnimation: ImageAnimation;
};

const LAYOUT_CYCLE: SceneLayoutV2[] = [
  "image",
  "image-text",
  "cinematic",
  "image",
  "image-text",
  "cinematic",
  "image",
  "image-text",
  "cinematic",
  "image",
];

const IMAGE_ANIMATION_CYCLE: ImageAnimation[] = [
  "ken-burns-in",
  "parallax",
  "zoom-pulse",
  "slide-reveal",
  "ken-burns-out",
  "parallax",
  "zoom-pulse",
  "slide-reveal",
  "ken-burns-in",
  "static",
];

export function getSceneTreatment(
  index: number,
  totalScenes: number,
): SceneTreatment {
  if (totalScenes <= 1) {
    return {
      layout: "image",
      imageAnimation: "ken-burns-in",
    };
  }

  if (index <= 0) {
    return {
      layout: "image",
      imageAnimation: "ken-burns-in",
    };
  }

  if (index >= totalScenes - 1) {
    return {
      layout: "cinematic",
      imageAnimation: "ken-burns-out",
    };
  }

  return {
    layout: LAYOUT_CYCLE[index % LAYOUT_CYCLE.length] ?? "image",
    imageAnimation:
      IMAGE_ANIMATION_CYCLE[index % IMAGE_ANIMATION_CYCLE.length] ?? "ken-burns-in",
  };
}
