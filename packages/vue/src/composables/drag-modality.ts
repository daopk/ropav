import type {InteractionModality} from "./use-interaction-states";
import type {ComputedRef} from "vue";

import {computed} from "vue";

import {getInteractionModality, useInteractionModality} from "./use-interaction-states";

/**
 * How a drag was started, which decides both the wording of every announcement and which keys
 * or gestures end it.
 */
export type DragModality = "keyboard" | "touch" | "virtual";

const mapModality = (modality: InteractionModality): DragModality => {
  if (modality === "keyboard") return "keyboard";

  const isCoarse =
    typeof window !== "undefined" &&
    typeof window.matchMedia === "function" &&
    window.matchMedia("(pointer: coarse)").matches;

  return isCoarse ? "touch" : "virtual";
};

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
 * One narrowing against React Aria, and it is visible in exactly one place. Its modality can also
 * be `null` or `"virtual"`; this package's tracker produces neither — `InteractionModality` here
 * is only `"keyboard" | "pointer"`, initialized to `"keyboard"` so a focus ring is painted before
 * anything has happened. Upstream maps both of those to `"virtual"`, which is also where
 * `"pointer"` lands, so once the user has done *anything* the two agree: a keydown gives
 * `"keyboard"` on both sides, a pointer or a touch gives `"virtual"` on both.
 *
 * They differ only in the window before the first event, where upstream says `"virtual"` ("Click
 * to start dragging") and this says `"keyboard"` ("Press Enter to start dragging"). Narrow in
 * practice — a screen reader's browse-mode arrows fire `keydown`, and a tap fires `pointerdown`,
 * so both settle it before anything is read out — and the wording it lands on still works, since
 * Enter on the control produces the same click. Widening the tracker to a third state would touch
 * every focus ring in the library for this one sentence, so it is recorded instead.
 */
export const getDragModality = (): DragModality => mapModality(getInteractionModality());

/**
 * The drag modality as a reactive ref, for a description rendered into the DOM.
 *
 * The wording of "how to start a drag" differs per modality and lives in an `aria-describedby`
 * node, so it has to be rewritten when the user switches input method — something the plain
 * read above cannot do.
 */
export const useDragModality = (): ComputedRef<DragModality> => {
  const modality = useInteractionModality();

  return computed(() => mapModality(modality.value));
};
