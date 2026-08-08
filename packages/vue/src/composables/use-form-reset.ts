import type {MaybeRefOrGetter, Ref} from "vue";

import {onScopeDispose, toValue, watch} from "vue";

/** Form controls that take part in a form reset. */
type ResettableElement = HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement;

/**
 * Put a component's own state back to its default when the surrounding form is reset,
 * ported from React Aria's `useFormReset`.
 *
 * A component that draws its own control keeps the value in reactive state and only mirrors
 * it onto a hidden input. `form.reset()` restores the input's value directly, with no
 * `input` or `change` event to observe, so without this the state and the input disagree
 * from then on.
 *
 * `initialValue` is read when the reset happens rather than when the listener is attached,
 * so a default that changes over the component's life still resets to the current one.
 *
 * @example
 * ```ts
 * const input = useTemplateRef<HTMLInputElement>("input");
 * useFormReset(input, () => props.defaultSelected ?? false, setSelected);
 * ```
 */
export const useFormReset = <T>(
  element: Ref<ResettableElement | null | undefined>,
  initialValue: MaybeRefOrGetter<T>,
  onReset: (value: T) => void,
): void => {
  let attachedForm: HTMLFormElement | null = null;

  const onFormReset = (event: Event) => {
    // A reset that was cancelled leaves the form's values alone, so the state keeps its own.
    if (event.defaultPrevented) return;

    onReset(toValue(initialValue));
  };

  const detach = () => {
    attachedForm?.removeEventListener("reset", onFormReset);
    attachedForm = null;
  };

  // Watching the element rather than attaching once after mount: the control may be rendered
  // conditionally, and `form` can be repointed at any time through the attribute of the same
  // name.
  watch(
    () => element.value?.form ?? null,
    (form) => {
      detach();
      form?.addEventListener("reset", onFormReset);
      attachedForm = form;
    },
    {flush: "post", immediate: true},
  );

  onScopeDispose(detach, true);
};
