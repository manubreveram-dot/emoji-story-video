import type { ColorPalette } from "../types/theme";
import type {
  TextAnimation,
  EmojiAnimation,
  BackgroundAnimation,
  SceneLayout,
  TransitionType,
} from "../types/scene";

export const DEFAULT_PALETTE: ColorPalette = {
  name: "neutral",
  background: "#FAFAFA",
  backgroundEnd: "#E0E0E0",
  text: "#212121",
  accent: "#757575",
  particle: "#BDBDBD",
};

export const DEFAULT_TEXT_ANIMATION: TextAnimation = "fade-up";
export const DEFAULT_EMOJI_ANIMATION: EmojiAnimation = "float";
export const DEFAULT_BG_ANIMATION: BackgroundAnimation = "gradient-shift";
export const DEFAULT_LAYOUT: SceneLayout = "text-emoji";
export const DEFAULT_TRANSITION: TransitionType = "fade";
export const DEFAULT_EMOJIS = ["\u2728", "\uD83D\uDCAB", "\uD83C\uDF1F"];
