import type { ShallowRef } from "vue";

import { onScopeDispose, watch } from "vue";

export interface UseFormattedTextFieldOptions {
  /** Whether a string could still become an acceptable value, half-typed or not. */
  validate: (value: string) => boolean;
  /** Put the text back, for input that has to be undone after the fact. */
  setInputValue: (value: string) => void;
}

/**
 * Keeps unacceptable characters out of a formatted text field, ported from React Aria's
 * `packages/react-aria/src/textfield/useFormattedTextField.ts` (react-aria 3.51.0).
 *
 * The work happens on `beforeinput`, which is the only event that can still be cancelled: by the
 * time `input` fires the text is already in the field and the undo stack has a step in it. What
 * the edit *would* produce is worked out from the input type and the current selection, and the
 * event is cancelled if that result could never become a number.
 *
 * Composition — an IME, or Android autocorrect — cannot be cancelled that way, because the input
 * is deliberately incomplete while it is in progress. That one is handled by remembering the
 * field before composition started and putting it back afterwards if the result is unacceptable.
 *
 * Listeners are attached here rather than declared in a template: `beforeinput` on an element
 * that re-renders in response to its own input is exactly the case where a listener arriving
 * through `v-bind` gets dropped mid-dispatch.
 */
export const useFormattedTextField = (
  element: ShallowRef<HTMLInputElement | null> | (() => HTMLInputElement | null),
  options: UseFormattedTextFieldOptions,
): void => {
  let composition: {
    selectionEnd: number | null;
    selectionStart: number | null;
    value: string;
  } | null = null;

  const onBeforeInput = (event: Event) => {
    const input = event.currentTarget as HTMLInputElement | null;

    if (!input || !(event instanceof InputEvent)) return;

    const start = input.selectionStart ?? 0;
    const end = input.selectionEnd ?? 0;

    let next: string | null = null;

    switch (event.inputType) {
      // Undo and redo replay text that was already accepted once, so there is nothing to check.
      case "historyRedo":
      case "historyUndo":
        return;
      // Enter in a single-line field is how a form gets submitted; it never changes the text.
      case "insertLineBreak":
        return;
      case "deleteByCut":
      case "deleteByDrag":
      case "deleteContent":
        next = input.value.slice(0, start) + input.value.slice(end);
        break;
      case "deleteContentForward":
        // One UTF-16 unit, not one grapheme. A cluster spanning several units would be
        // mispredicted, but no supported locale writes numbers with one.
        next =
          start === end
            ? input.value.slice(0, start) + input.value.slice(end + 1)
            : input.value.slice(0, start) + input.value.slice(end);
        break;
      case "deleteContentBackward":
        next =
          start === end
            ? input.value.slice(0, start - 1) + input.value.slice(start)
            : input.value.slice(0, start) + input.value.slice(end);
        break;
      case "deleteHardLineBackward":
      case "deleteSoftLineBackward":
        next = input.value.slice(start);
        break;
      default:
        if (event.data != null) {
          next = input.value.slice(0, start) + event.data + input.value.slice(end);
        }
        break;
    }

    // An edit whose result cannot be worked out is refused along with one that is unacceptable:
    // letting an unknown input type through would leave text in the field that the field cannot
    // represent.
    if (next === null || !options.validate(next)) event.preventDefault();
  };

  const onCompositionStart = (event: Event) => {
    const input = event.currentTarget as HTMLInputElement | null;

    if (!input) return;

    composition = {
      selectionEnd: input.selectionEnd,
      selectionStart: input.selectionStart,
      value: input.value,
    };
  };

  const onCompositionEnd = (event: Event) => {
    const input = event.currentTarget as HTMLInputElement | null;

    if (!input || !composition) return;
    if (options.validate(input.value)) {
      composition = null;

      return;
    }

    // Written straight onto the element so the caret can be put back in the same breath; the
    // state is told as well, so the next render agrees with what is on screen.
    input.value = composition.value;
    input.setSelectionRange(composition.selectionStart, composition.selectionEnd);
    options.setInputValue(composition.value);

    composition = null;
  };

  const attach = (input: HTMLInputElement) => {
    input.addEventListener("beforeinput", onBeforeInput, false);
    input.addEventListener("compositionstart", onCompositionStart, false);
    input.addEventListener("compositionend", onCompositionEnd, false);
  };

  const detach = (input: HTMLInputElement) => {
    input.removeEventListener("beforeinput", onBeforeInput, false);
    input.removeEventListener("compositionstart", onCompositionStart, false);
    input.removeEventListener("compositionend", onCompositionEnd, false);
  };

  let attached: HTMLInputElement | null = null;

  watch(
    element,
    (input) => {
      if (attached) detach(attached);

      attached = input ?? null;

      if (attached) attach(attached);
    },
    { flush: "post", immediate: true },
  );

  onScopeDispose(() => {
    if (attached) detach(attached);
    attached = null;
  });
};
