import type { ComputedRef, MaybeRefOrGetter } from "vue";

import { computed } from "vue";

import { useControllableState } from "./use-controllable-state";

/** Which end of a collection receives focus when an overlay opens. */
export type FocusStrategy = "first" | "last";

export interface UseOverlayTriggerStateOptions {
  isOpen?: MaybeRefOrGetter<boolean | undefined>;
  defaultOpen?: boolean;
  onOpenChange?: (isOpen: boolean) => void;
}

export interface OverlayTriggerState {
  isOpen: ComputedRef<boolean>;
  setOpen: (isOpen: boolean) => void;
  open: () => void;
  close: () => void;
  toggle: () => void;
}

/**
 * Open state for an overlay trigger, ported from React Stately's `useOverlayTriggerState`.
 *
 * @example
 * ```ts
 * const state = useOverlayTriggerState({
 *   isOpen: () => props.isOpen,
 *   onOpenChange: (isOpen) => emit("openChange", isOpen),
 * });
 * ```
 */
export const useOverlayTriggerState = (
  options: UseOverlayTriggerStateOptions = {},
): OverlayTriggerState => {
  const { setState, state } = useControllableState<boolean>({
    defaultValue: options.defaultOpen ?? false,
    onValueChange: options.onOpenChange,
    value: options.isOpen,
  });

  return {
    close: () => setState(false),
    isOpen: computed(() => state.value),
    open: () => setState(true),
    setOpen: setState,
    toggle: () => setState(!state.value),
  };
};
