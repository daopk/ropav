import type { PressResponder } from "../../composables/press-responder";
import type { UseTextFieldOptions, UseTextFieldReturn } from "../../composables/use-text-field";
import type { ComputedRef, MaybeRefOrGetter } from "vue";

import { computed, toValue } from "vue";

import { usePress } from "../../composables/use-press";
import { useTextField } from "../../composables/use-text-field";

export interface UseSearchFieldOptions extends Omit<UseTextFieldOptions, "type"> {
  /** Kind of control the browser should offer. @default "search" */
  type?: UseTextFieldOptions["type"];
  /**
   * Called when the search is submitted from the keyboard.
   *
   * A getter, because the handler's mere presence decides what Enter does and a component
   * forwarding its own optional prop has to be able to report that it went away.
   */
  onSubmit?: MaybeRefOrGetter<((value: string) => void) | undefined>;
  /** Called when the value is cleared, by the button or by Escape. */
  onClear?: () => void;
}

export interface UseSearchFieldReturn extends UseTextFieldReturn {
  /** Whether there is nothing to clear, which is what hides the clear button. */
  isEmpty: ComputedRef<boolean>;
  /**
   * The press the clear button consumes. Handed down rather than built into the button, so the
   * clear button stays an ordinary close button.
   */
  clearButtonResponder: PressResponder;
  /** Empty the field, as Escape and the clear button both do. */
  clear: () => void;
}

/**
 * Behaviour and accessibility for a search field, ported from React Aria's
 * `packages/react-aria/src/searchfield/useSearchField.ts` (react-aria 3.51.0).
 *
 * React keeps the value in a `useSearchFieldState` of its own and feeds it into `useTextField`.
 * Here `useTextField` already owns the value, so there is one composable rather than two and
 * the field has a single source of truth for its text.
 *
 * @example
 * ```ts
 * const field = useSearchField({value: () => props.value, onChange: (v) => emit("change", v)});
 *
 * provideTextFieldControlContext(field);
 * providePressResponder(field.clearButtonResponder);
 * ```
 */
export const useSearchField = (options: UseSearchFieldOptions = {}): UseSearchFieldReturn => {
  const field = useTextField({
    ...options,
    onKeydown: (event) => {
      // Ahead of the caller's own handler, matching the order react-aria merges them in: a
      // parent listening for Escape must not see the one that only cleared this field.
      onShortcut(event);
      options.onKeydown?.(event);
    },
    type: () => toValue(options.type) ?? "search",
  });

  const isDisabled = computed(() => field.isDisabled.value || field.isReadOnly.value);

  const isEmpty = computed(() => field.value.value === "");

  const clear = () => {
    field.setValue("");
    options.onClear?.();
  };

  const onShortcut = (event: KeyboardEvent) => {
    if (isDisabled.value) return;

    if (event.key === "Enter") {
      const onSubmit = toValue(options.onSubmit);

      // Without a submit handler the keystroke belongs to the form, which submits on Enter in
      // a single-line field of its own accord.
      if (!onSubmit) return;

      event.preventDefault();
      onSubmit(field.value.value);

      return;
    }

    if (event.key !== "Escape") return;

    // The element is checked as well as the state, for a caller that wrote the value onto the
    // control directly. An already empty field lets Escape through, so a dialog around it can
    // still close on the first press.
    const control = field.element.value;

    if (isEmpty.value && (!control || control.value === "")) return;

    event.preventDefault();
    clear();
  };

  // Pressed rather than clicked: the field takes focus back on the way *down*, so that touching
  // the clear button never takes focus off the input and folds the on-screen keyboard away.
  const { handlers, isPressed } = usePress({
    isDisabled,
    onPress: clear,
    onPressStart: () => field.element.value?.focus(),
    preventFocusOnPress: true,
  });

  const clearButtonResponder: PressResponder = {
    attrs: computed(() => ({
      "aria-label": "Clear search",
      "data-disabled": isDisabled.value ? "true" : undefined,
      disabled: isDisabled.value || undefined,
      // Out of the tab order on purpose: Escape does the same job from the keyboard, and a stop
      // that only appears once there is text would shift the tab order as the user types. Left
      // off once disabled, because `disabled` already takes the button out and react-aria drops
      // it for the same reason — measured against its DOM.
      tabindex: isDisabled.value ? undefined : -1,
    })),
    handlers: computed(() => handlers),
    isPressed,
    registerElement: () => {
      // The responder acts on the field's own control, so it has no use for the button.
    },
  };

  return {
    ...field,
    clear,
    clearButtonResponder,
    isEmpty,
  };
};
