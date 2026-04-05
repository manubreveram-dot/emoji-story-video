import { fade } from "@remotion/transitions/fade";
import { slide } from "@remotion/transitions/slide";
import { wipe } from "@remotion/transitions/wipe";
import { flip } from "@remotion/transitions/flip";
import type { TransitionPresentation } from "@remotion/transitions";
import type { TransitionType } from "../types/scene";

// Use only transitions that don't require extra params and share a compatible type
// We cast to a common type since TransitionSeries accepts any TransitionPresentation
export function getTransitionPresentation(
  type: TransitionType,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
): TransitionPresentation<Record<string, unknown>> {
  switch (type) {
    case "slide":
      return slide({ direction: "from-right" }) as TransitionPresentation<Record<string, unknown>>;
    case "wipe":
      return wipe({ direction: "from-left" }) as TransitionPresentation<Record<string, unknown>>;
    case "flip":
      return flip({ direction: "from-right" }) as TransitionPresentation<Record<string, unknown>>;
    case "fade":
    case "clock-wipe":
    case "iris":
    default:
      return fade() as TransitionPresentation<Record<string, unknown>>;
  }
}
