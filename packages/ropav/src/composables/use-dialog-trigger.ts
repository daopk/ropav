import type {PressResponder} from "./press-responder";
import type {OverlayTriggerState} from "./use-overlay-trigger-state";
import type {ComputedRef, MaybeRefOrGetter} from "vue";

import {computed, shallowRef} from "vue";

import {useId} from "./use-id";
import {useOverlayTrigger} from "./use-overlay-trigger";
import {usePress} from "./use-press";

export interface UseDialogTriggerOptions {
  isDisabled?: MaybeRefOrGetter<boolean | undefined>;
}

export interface UseDialogTriggerReturn {
  /** Hand to `providePressResponder`, so the trigger element picks all of this up. */
  responder: PressResponder;
  /** The trigger's id, which the dialog is labelled by when nothing inside names it. */
  triggerId: ComputedRef<string>;
  /** The id the dialog carries, which the trigger's `aria-controls` points at. */
  overlayId: ComputedRef<string>;
  /** The trigger element, which the overlay is positioned against. */
  triggerElement: ComputedRef<HTMLElement | null>;
}

/**
 * Turn any pressable into a trigger for a dialog, ported from React Aria's `DialogTrigger`.
 *
 * Much smaller than the menu equivalent, because a dialog has none of the menu's timing: it opens
 * on the press however that press arrived, and there is no direction to carry into it. What it
 * does have is a labelling fallback — a dialog with no heading is named by the thing that opened
 * it, which is why the trigger's id is published rather than kept private.
 *
 * No `aria-haspopup` is set. ARIA 1.1 allows `"dialog"`, but screen readers announce most values
 * as "menu", so `useOverlayTrigger` only sets it for a menu and a listbox.
 *
 * @example
 * ```ts
 * const state = useOverlayTriggerState({isOpen: () => props.isOpen});
 * const trigger = useDialogTrigger({isDisabled: () => props.isDisabled}, state);
 *
 * providePressResponder(trigger.responder);
 * ```
 */
export const useDialogTrigger = (
  options: UseDialogTriggerOptions,
  state: OverlayTriggerState,
): UseDialogTriggerReturn => {
  const triggerId = useId();
  const element = shallowRef<HTMLElement | null>(null);

  const {overlayId, triggerAttributes} = useOverlayTrigger({type: "dialog"}, state);

  const press = usePress({
    isDisabled: options.isDisabled,
    // Held pressed for as long as the overlay is open, so the trigger reads as the thing the
    // overlay belongs to rather than flicking back the moment the pointer lifts.
    isPressed: () => state.isOpen.value,
    onPress: () => state.toggle(),
  });

  const responder: PressResponder = {
    attrs: computed(() => ({...triggerAttributes.value, id: triggerId.value})),
    handlers: computed(() => press.handlers),
    isPressed: press.isPressed,
    registerElement: (next) => {
      element.value = next;
    },
  };

  return {
    overlayId,
    responder,
    triggerElement: computed(() => element.value),
    triggerId,
  };
};
