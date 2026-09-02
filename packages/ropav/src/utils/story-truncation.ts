import type { CollectionKey } from "../composables/use-collection";

import { onScopeDispose, shallowRef } from "vue";

/**
 * Which of a collection's labels are clipped, for the stories that pair truncation with a tooltip.
 *
 * A tooltip on every option is noise: the ones that fit already say everything they have to say, and
 * a tooltip repeating a label the user can read is one more thing moving under the pointer. So the
 * label reports whether it is actually clipped, and only those get one.
 *
 * `scrollWidth > clientWidth` is the only reliable read of that — CSS truncates without telling
 * anyone, and the width a label wants depends on the font, the container and the text at once, none
 * of which a story can know in advance. A `ResizeObserver` keeps the answer current: the popover is
 * measured the moment it opens, and again whenever it is resized under a label that then fits, or
 * stops fitting.
 *
 * Story-only, so it is deliberately not re-exported from `utils/index.ts`.
 */
export const useClippedLabels = () => {
  const clipped = shallowRef<ReadonlySet<CollectionKey>>(new Set());
  const elements = new Map<CollectionKey, HTMLElement>();

  const read = () => {
    const next = new Set<CollectionKey>();

    for (const [key, element] of elements) {
      if (element.scrollWidth > element.clientWidth) next.add(key);
    }

    // Published only on a real change. `measure` is handed to a template ref inline, so it is a
    // fresh function on every render and runs again on every render — writing unconditionally would
    // render again for the same answer, and again for that one.
    const isUnchanged =
      next.size === clipped.value.size && [...next].every((key) => clipped.value.has(key));

    if (!isUnchanged) clipped.value = next;
  };

  const observer = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(read);

  onScopeDispose(() => observer?.disconnect());

  /**
   * Registers the element carrying `key`'s label, or forgets it when the option unmounts.
   *
   * The element arrives as `unknown` because that is what a template ref hands over — a component
   * ref would be an instance rather than a node, and only a node can be measured.
   */
  const measure = (key: CollectionKey, element: unknown) => {
    const previous = elements.get(key);

    if (previous) observer?.unobserve(previous);

    if (element instanceof HTMLElement) {
      elements.set(key, element);
      observer?.observe(element);
    } else {
      elements.delete(key);
    }

    // Read here as well as from the observer: jsdom has a `ResizeObserver` constructor that never
    // notifies anything, so a story asserted in the fast suite would otherwise see nothing clipped.
    read();
  };

  return { clipped, measure };
};
