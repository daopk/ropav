import type {ComputedRef, MaybeRefOrGetter} from "vue";

import {computed, shallowRef, toValue, watch} from "vue";

let nextId = 0;

/** One node per distinct description, shared by every consumer that asks for that text. */
const nodes = new Map<string, {refCount: number; element: HTMLElement}>();

export interface UseDescriptionReturn {
  /** The id of the description node, or `undefined` when there is no description. */
  describedBy: ComputedRef<string | undefined>;
}

/**
 * Attach a description to a control for assistive technology only, ported from React Aria's
 * `useDescription`.
 *
 * Some behaviour cannot be discovered without being told: a long-press trigger looks like an
 * ordinary button, and nothing on screen says the press has to be held. The text goes into a
 * hidden node appended to the body rather than inside the control, so it is not read as part
 * of the control's own name and does not affect layout.
 *
 * @example
 * ```ts
 * const {describedBy} = useDescription(() => (isLongPress ? "Long press to open menu" : undefined));
 * // <button :aria-describedby="describedBy.value">
 * ```
 */
export const useDescription = (
  description: MaybeRefOrGetter<string | undefined>,
): UseDescriptionReturn => {
  const id = shallowRef<string>();

  const release = (text: string) => {
    const node = nodes.get(text);

    if (!node) return;

    if (--node.refCount === 0) {
      node.element.remove();
      nodes.delete(text);
    }
  };

  watch(
    () => toValue(description),
    (text, _previous, onCleanup) => {
      if (!text) {
        id.value = undefined;

        return;
      }

      let node = nodes.get(text);

      if (!node) {
        const element = document.createElement("div");

        element.id = `ropav-description-${nextId++}`;
        element.style.display = "none";
        element.textContent = text;
        document.body.appendChild(element);
        node = {element, refCount: 0};
        nodes.set(text, node);
      }

      node.refCount++;
      id.value = node.element.id;

      // Also runs when the watcher is stopped, which is what releases the node when the
      // component using it goes away.
      onCleanup(() => release(text));
    },
    {immediate: true},
  );

  return {describedBy: computed(() => id.value)};
};
