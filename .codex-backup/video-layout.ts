import type { ImageAnimation, ScriptScene } from "../types/script";

type SceneTreatment = {
  layout: ScriptScene["layout"];
  imageAnimation: ImageAnimation;
};

const IMAGE_ANIMATIONS: ImageAnimation[] = [
  "ken-burns-in",
  "parallax",
  "zoom-pulse",
  "ken-burns-out",
];

export function getSceneTreatment(
  index: number,
  totalScenes: number,
): SceneTreatment {
  const isFirst = index === 0;
  const isLast = index === totalScenes - 1;

  if (isFirst) {
    return {
      layout: "image",
      imageAnimation: "ken-burns-in",
    };
  }

  if (isLast) {
    return {
      layout: "cinematic",
      imageAnimation: "ken-burns-out",
    };
  }

  if (index % 5 === 2) {
    return {
      layout: "text-emoji",
      imageAnimation: IMAGE_ANIMATIONS[index % IMAGE_ANIMATIONS.length],
    };
  }

  if (index % 3 === 0) {
    return {
      layout: "cinematic",
      imageAnimation: IMAGE_ANIMATIONS[index % IMAGE_ANIMATIONS.length],
    };
  }

  return {
    layout: index % 2 === 0 ? "image" : "image-text",
    imageAnimation: IMAGE_ANIMATIONS[index % IMAGE_ANIMATIONS.length],
  };
}
