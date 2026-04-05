import React from "react";
import type { SceneBlueprint } from "../types/scene";
import { TitleScene } from "./layouts/TitleScene";
import { TextEmojiScene } from "./layouts/TextEmojiScene";
import { EmojiRainScene } from "./layouts/EmojiRainScene";
import { SplitScene } from "./layouts/SplitScene";
import { MinimalScene } from "./layouts/MinimalScene";
import { ImageScene } from "./layouts/ImageScene";
import { ImageTextScene } from "./layouts/ImageTextScene";
import { CinematicScene } from "./layouts/CinematicScene";

type SceneRendererProps = {
  scene: SceneBlueprint;
};

export const SceneRenderer: React.FC<SceneRendererProps> = ({ scene }) => {
  switch (scene.layout) {
    case "title":
      return <TitleScene scene={scene} />;
    case "image":
      return <ImageScene scene={scene} />;
    case "image-text":
      return <ImageTextScene scene={scene} />;
    case "cinematic":
      return <CinematicScene scene={scene} />;
    case "text-emoji":
      return <TextEmojiScene scene={scene} />;
    case "emoji-rain":
      return <EmojiRainScene scene={scene} />;
    case "split":
      return <SplitScene scene={scene} />;
    case "minimal":
      return <MinimalScene scene={scene} />;
    default:
      return <ImageScene scene={scene} />;
  }
};
