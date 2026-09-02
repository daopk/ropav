import type { LayoutInfo } from "../../utils/virtualizer-layout-info";
import type { ComputedRef, ShallowRef } from "vue";

import { computed, watch } from "vue";

import { Size } from "../../utils/virtualizer-geometry";
import { layoutInfoToStyle } from "../../utils/virtualizer-layout-info";

import { useVirtualizerStateContext } from "./virtualizer.context";

export interface UseVirtualizerItemOptions {
  /** The wrapper element, once it is in the DOM. */
  element: ShallowRef<HTMLElement | null>;
  layoutInfo: () => LayoutInfo | null | undefined;
  parentLayoutInfo?: () => LayoutInfo | null | undefined;
}

export interface UseVirtualizerItemReturn {
  /** Where the wrapper sits and how big it is, as the layout worked it out. */
  style: ComputedRef<ReturnType<typeof layoutInfoToStyle> | undefined>;
}

/**
 * What a wrapper around one windowed element does: carry the geometry the layout gave it, and
 * measure what the layout could only estimate.
 *
 * A wrapper still carrying an estimate has no height of its own, so what it reports is what its
 * content came to. React Aria writes the estimate on, clears it to read `scrollHeight`, and writes
 * it back — a forced reflow per element, and one that fights the size containment the wrapper
 * also carries.
 */
export const useVirtualizerItem = (
  options: UseVirtualizerItemOptions,
): UseVirtualizerItemReturn => {
  const virtualizer = useVirtualizerStateContext();

  const measure = () => {
    const current = options.element.value;
    const layoutInfo = options.layoutInfo();

    if (!current || !layoutInfo) return;

    const bounds = current.getBoundingClientRect();

    virtualizer?.updateItemSize(layoutInfo.key, new Size(bounds.width, bounds.height));
  };

  // A row placed at an estimate is measured as soon as it is in the DOM, every time it is placed
  // at an estimate again — a resize invalidates every measurement.
  watch(
    () => [options.element.value, options.layoutInfo()] as const,
    ([current, layoutInfo]) => {
      if (current && layoutInfo?.estimatedSize) measure();
    },
    { flush: "post", immediate: true },
  );

  // Watching the children rather than the wrapper: the wrapper's height is set by the layout, so
  // it never changes on its own, while what is inside it does.
  watch(
    () => [options.element.value, virtualizer?.shouldObserveItemSize.value] as const,
    ([current, shouldObserve], _previous, onCleanup) => {
      if (!current || !shouldObserve || typeof ResizeObserver === "undefined") return;

      const observer = new ResizeObserver(() => measure());

      for (const child of current.children) observer.observe(child);

      onCleanup(() => observer.disconnect());
    },
    { flush: "post", immediate: true },
  );

  return {
    style: computed(() => {
      const layoutInfo = options.layoutInfo();

      return layoutInfo ? layoutInfoToStyle(layoutInfo, options.parentLayoutInfo?.()) : undefined;
    }),
  };
};
