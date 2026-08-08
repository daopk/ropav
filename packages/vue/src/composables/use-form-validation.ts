import type {FormValidationState, ValidatableElement} from "./use-form-validation-state";
import type {MaybeRefOrGetter, Ref} from "vue";

import {onScopeDispose, toValue, watch, watchEffect} from "vue";

import {getNativeValidation} from "./use-form-validation-state";
import {setInteractionModality} from "./use-interaction-states";

export interface UseFormValidationOptions {
  /** Called instead of focusing the element when a failed submit lands on this field. */
  focus?: () => void;
  /**
   * Whether leaving the field reveals its errors. Text fields want this; a toggle does not,
   * since focus merely passing through is no reason to turn it red.
   * @default false
   */
  commitOnBlur?: MaybeRefOrGetter<boolean | undefined>;
}

/** First control in the form the browser considers invalid, in document order. */
const firstInvalidElement = (form: HTMLFormElement): ValidatableElement | null => {
  for (const element of Array.from(form.elements)) {
    const candidate = element as ValidatableElement;

    if (candidate.validity?.valid === false) return candidate;
  }

  return null;
};

/**
 * Connect a field's validation state to the real input it renders, ported from React Aria's
 * `packages/react-aria/src/form/useFormValidation.ts` (react-aria 3.51.0).
 *
 * Two halves. A post-flush effect mirrors the field's own verdict onto the input through
 * `setCustomValidity`, which is what makes the browser refuse to submit and jump to the
 * field. Listeners on the input then turn the browser's answer back into state: `invalid`
 * reveals the error, `change` commits, and a form reset clears it.
 *
 * The listeners are attached imperatively rather than declared in a template. Vapor removes
 * and re-adds every `on*` that arrives through `v-bind` on each render, which drops handlers
 * mid-dispatch — and a validating input re-renders on exactly the events it is listening for.
 *
 * @example
 * ```ts
 * const inputEl = shallowRef<HTMLInputElement | null>(null);
 * useFormValidation(inputEl, validation);
 * ```
 */
export const useFormValidation = (
  element: Ref<ValidatableElement | null | undefined>,
  state: FormValidationState,
  options: UseFormValidationOptions = {},
): void => {
  // Post-flush on purpose, twice over: the element must already carry the bindings of this
  // render before its validity is read, and this has to land before the commit the state
  // queues on `nextTick`, so a commit never reads a stale verdict.
  watchEffect(
    () => {
      if (state.validationBehavior.value !== "native") return;

      const input = element.value;

      if (!input || input.disabled) return;

      const {isInvalid, validationErrors} = state.realtimeValidation.value;

      input.setCustomValidity(isInvalid ? validationErrors.join(" ") || "Invalid value." : "");

      // Firefox shows the validation message a second time as a tooltip unless the element
      // carries a title of its own. https://bugzilla.mozilla.org/show_bug.cgi?id=605277
      if (!input.hasAttribute("title")) input.title = "";

      // Only worth reading back while the field itself is happy — otherwise this would read
      // back the custom error just written and call it the browser's own verdict.
      if (!isInvalid) state.updateValidation(getNativeValidation(input));
    },
    {flush: "post"},
  );

  const onInvalid = (event: Event) => {
    // Committing over an error already on screen would clear a server message the user has
    // not actually fixed yet.
    if (!state.displayValidation.value.isInvalid) state.commitValidation();

    const input = element.value;
    const form = input?.form;

    // Only the first offending field takes focus, so a failed submit lands at the top of the
    // problem rather than the bottom.
    if (!event.defaultPrevented && input && form && firstInvalidElement(form) === input) {
      if (options.focus) options.focus();
      else input.focus();

      // The move came from a submit rather than a pointer, so the ring has to be asked for.
      setInteractionModality("keyboard");
    }

    // The browser's own bubble is replaced by the field's `FieldError`.
    event.preventDefault();
  };

  const onChange = () => {
    state.commitValidation();
  };

  const onBlur = () => {
    if (toValue(options.commitOnBlur)) state.commitValidation();
  };

  const onReset = (event: Event) => {
    // A reset the caller cancelled leaves the values alone, so the errors stay too.
    if (!event.defaultPrevented) state.resetValidation();
  };

  let attached: {form: HTMLFormElement | null; input: ValidatableElement} | null = null;

  const detach = () => {
    if (!attached) return;

    attached.input.removeEventListener("invalid", onInvalid);
    attached.input.removeEventListener("change", onChange);
    attached.input.removeEventListener("blur", onBlur);
    attached.form?.removeEventListener("reset", onReset);
    attached = null;
  };

  // Watching the form as well as the element: a field may be rendered conditionally, and
  // `form` can be repointed at any time through the attribute of the same name.
  watch(
    [() => element.value, () => element.value?.form ?? null],
    ([input, form]) => {
      detach();

      if (!input) return;

      input.addEventListener("invalid", onInvalid);
      input.addEventListener("change", onChange);
      input.addEventListener("blur", onBlur);
      form?.addEventListener("reset", onReset);
      attached = {form, input};
    },
    {flush: "post", immediate: true},
  );

  onScopeDispose(detach, true);
};

/**
 * Keep a group's registry of item inputs in step with one item's element.
 *
 * A checkbox group has no native constraint of its own, so it works out its validity by
 * reading the inputs of its items. Each item hands its element over for as long as it lives.
 *
 * @example
 * ```ts
 * useValidationInput(inputEl, group?.registerInput);
 * ```
 */
export const useValidationInput = (
  element: Ref<HTMLInputElement | null | undefined>,
  register: ((input: HTMLInputElement) => () => void) | null | undefined,
): void => {
  if (!register) return;

  let unregister: (() => void) | undefined;

  watch(
    () => element.value,
    (input) => {
      unregister?.();
      unregister = input ? register(input) : undefined;
    },
    {flush: "post", immediate: true},
  );

  onScopeDispose(() => {
    unregister?.();
    unregister = undefined;
  }, true);
};
