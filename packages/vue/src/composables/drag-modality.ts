import {getInteractionModality} from "./use-interaction-states";

/**
 * How a drag was started, which decides both the wording of every announcement and which keys
 * or gestures end it.
 */
export type DragModality = "keyboard" | "touch" | "virtual";

/**
 * How the drag currently in flight is being driven.
 *
 * Ported from React Aria's `getDragModality`/`mapModality` in `dnd/utils.ts`. Not reactive on
 * purpose, like the modality tracker it reads: call it inside the handler that needs it, so the
 * answer is the one true at that moment rather than one a render captured.
 *
 * "Virtual" means a screen reader's synthetic click rather than a real pointer, and it is the
 * fallback rather than a special case — anything that is not the keyboard is driven by something
 * that cannot express a native drag, so it gets the click-to-drop flow. A coarse pointer narrows
 * that to touch, which is announced differently ("double tap" rather than "click").
 *
 * One narrowing against React Aria: its modality can also be `null` or `"virtual"`, neither of
 * which this package's tracker ever produces — `InteractionModality` here is only
 * `"keyboard" | "pointer"`, initialized to `"keyboard"`. Both of those unreachable inputs map to
 * `"virtual"` upstream, which is exactly where `"pointer"` lands, so every reachable answer is
 * the same one React Aria gives.
 */
export const getDragModality = (): DragModality => {
  if (getInteractionModality() === "keyboard") return "keyboard";

  const isCoarse =
    typeof window !== "undefined" &&
    typeof window.matchMedia === "function" &&
    window.matchMedia("(pointer: coarse)").matches;

  return isCoarse ? "touch" : "virtual";
};
