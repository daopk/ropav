import type { InteractionModality } from "./use-interaction-states";

import { shallowRef } from "vue";

const modality = shallowRef<InteractionModality>("keyboard");

/**
 * The same answer, kept out of the reactive graph.
 *
 * These are two different questions and they need two different answers. "Should a focus ring be
 * painted" may only change when something is pressed or a key is struck — a bare mouse move must
 * not erase a ring that is already there. "How is the user driving the page right now" has to
 * follow the pointer as it moves, because a tooltip decides whether to open on hover by asking it.
 * Answering the second reactively would make every mouse move re-render every focusable thing on
 * the page and drop the ring while doing it, which is why React Aria keeps the same split.
 */
let latestModality: InteractionModality = "keyboard";

/** Number of live consumers, so the document listeners are attached exactly once. */
let consumerCount = 0;

const onGlobalKeydown = (event: KeyboardEvent) => {
  // A modifier chord is a shortcut rather than navigation, so it must not make a
  // subsequent pointer focus look like keyboard focus.
  if (event.metaKey || event.altKey || event.ctrlKey) return;

  latestModality = "keyboard";
  modality.value = "keyboard";
};

const onGlobalPointerdown = () => {
  latestModality = "pointer";
  modality.value = "pointer";
};

/** Tracked without touching the reactive ref, for the reason above. */
const onGlobalPointerMoved = () => {
  latestModality = "pointer";
};

/**
 * Keep the shared modality listeners attached, returning the release.
 *
 * For a component that has to ask how the user is driving the page without otherwise taking part
 * in the interaction lifecycle — a tooltip trigger, which opens on hover only for a real pointer.
 * Without this the answer would be whatever it was when the last interactive component unmounted.
 */
export const retainInteractionModality = (): (() => void) => {
  if (typeof document === "undefined") return () => {};

  if (++consumerCount === 1) {
    // Capture phase, so the modality is already up to date when `focus` fires.
    document.addEventListener("keydown", onGlobalKeydown, true);
    document.addEventListener("pointerdown", onGlobalPointerdown, true);
    document.addEventListener("pointermove", onGlobalPointerMoved, true);
    document.addEventListener("pointerup", onGlobalPointerMoved, true);
  }

  return () => {
    if (--consumerCount === 0) {
      document.removeEventListener("keydown", onGlobalKeydown, true);
      document.removeEventListener("pointerdown", onGlobalPointerdown, true);
      document.removeEventListener("pointermove", onGlobalPointerMoved, true);
      document.removeEventListener("pointerup", onGlobalPointerMoved, true);
    }
  };
};

/**
 * How the user is driving the page right now.
 *
 * Ported from React Aria's `getInteractionModality`. Not reactive on purpose — read it inside an
 * event handler, where the answer is the one that matters.
 */
export const getInteractionModality = (): InteractionModality => latestModality;

/**
 * Whether focus arriving right now is the kind that came from a keyboard.
 *
 * Ported from React Aria's `isFocusVisible`, and reads the same answer React Aria reads — the one
 * that follows the pointer as it moves. Read it inside a handler: a tooltip asks it on focus to
 * tell tabbing to a button apart from clicking it, and only the pointer-following answer knows the
 * user had already reached for the mouse.
 *
 * Not the answer that decides whether a ring is painted. That one lives on `useInteractionStates`
 * and deliberately ignores a bare mouse move, so moving the pointer cannot erase a ring that is
 * already there. The two can disagree, and that is the point.
 */
export const isFocusVisible = (): boolean => latestModality === "keyboard";

/**
 * Declare how the last interaction reached the page.
 *
 * Ported from React Aria's `setInteractionModality`. A component that moves focus itself —
 * a slider label handing focus to its first thumb — has to say that the move came from the
 * keyboard, or the ring it just earned would not be painted.
 */
export const setInteractionModality = (next: InteractionModality): void => {
  latestModality = next;
  modality.value = next;
};

/**
 * The answer that decides whether a ring is painted: moved by a keystroke or a press, never by a
 * bare mouse move. Reactive when read inside a computed.
 */
export const getFocusRingModality = (): InteractionModality => modality.value;
