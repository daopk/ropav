import type {OverlayTriggerState} from "./use-overlay-trigger-state";
import type {ComputedRef} from "vue";

import {computed} from "vue";

import {useId} from "./use-id";

/** What the trigger opens, which decides how `aria-haspopup` is announced. */
export type OverlayType = "dialog" | "menu" | "listbox" | "tree" | "grid";

export interface UseOverlayTriggerProps {
  type: OverlayType;
}

export interface TriggerAriaAttributes {
  "aria-haspopup": boolean | "listbox" | undefined;
  "aria-expanded": boolean;
  "aria-controls": string | undefined;
}

export interface UseOverlayTriggerReturn {
  /** Attributes the trigger element renders. */
  triggerAttributes: ComputedRef<TriggerAriaAttributes>;
  /** The overlay's id, which the trigger points `aria-controls` at while open. */
  overlayId: ComputedRef<string>;
}

/**
 * Accessibility wiring between a trigger and the overlay it opens, ported from React Aria's
 * `useOverlayTrigger`.
 *
 * `aria-haspopup` is only set for a menu and a listbox: ARIA 1.1 allows more values, but screen
 * readers announce most of them as "menu" anyway, which would be worse than saying nothing.
 *
 * `aria-controls` is present only while the overlay is open, because the element it names does
 * not exist otherwise — an idref pointing at nothing is worse than no idref.
 *
 * @example
 * ```ts
 * const {overlayId, triggerAttributes} = useOverlayTrigger({type: "menu"}, state);
 * // <button v-bind="triggerAttributes.value">
 * ```
 */
export const useOverlayTrigger = (
  props: UseOverlayTriggerProps,
  state: OverlayTriggerState,
): UseOverlayTriggerReturn => {
  const overlayId = useId();

  const hasPopup = computed<boolean | "listbox" | undefined>(() => {
    if (props.type === "menu") return true;
    if (props.type === "listbox") return "listbox";

    return undefined;
  });

  return {
    overlayId,
    triggerAttributes: computed(() => ({
      "aria-controls": state.isOpen.value ? overlayId.value : undefined,
      "aria-expanded": state.isOpen.value,
      "aria-haspopup": hasPopup.value,
    })),
  };
};
