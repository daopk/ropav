import type { MaybeRefOrGetter, Ref } from "vue";

import { onScopeDispose, toValue, watch } from "vue";

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
 * `form` is the `id` the caller renders as the control's `form` attribute, for a control that
 * submits to a form it does not sit inside. Pass it wherever that attribute is rendered: it is
 * what moves the listener when a mounted control is repointed.
 *
 * @example
 * ```ts
 * const input = useTemplateRef<HTMLInputElement>("input");
 * useFormReset(input, () => props.defaultSelected ?? false, setSelected, () => props.form);
 * ```
 */
export const useFormReset = <T>(
  element: Ref<ResettableElement | null | undefined>,
  initialValue: MaybeRefOrGetter<T>,
  onReset: (value: T) => void,
  form?: MaybeRefOrGetter<string | undefined>,
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

  /*
   * Watched rather than attached once after mount: the control may be rendered conditionally, and
   * a `form` attribute can repoint a mounted one at another form.
   *
   * `element.form` answers which form owns the control either way, but it is a plain DOM property
   * that tracks nothing, so the caller's `form` id is the dependency that catches a repoint. A
   * control that simply sits inside its form needs no id.
   */
  watch(
    [() => element.value?.form ?? null, () => toValue(form)],
    ([owner]) => {
      detach();
      owner?.addEventListener("reset", onFormReset);
      attachedForm = owner;
    },
    { flush: "post", immediate: true },
  );

  onScopeDispose(detach, true);
};
