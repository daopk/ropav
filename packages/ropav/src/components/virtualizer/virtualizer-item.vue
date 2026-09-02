<script setup lang="ts" vapor>
import type { VirtualizerItemProps } from "./virtualizer.types";

import { computed, shallowRef, watch } from "vue";

import { Size } from "../../utils/virtualizer-geometry";
import { layoutInfoToStyle } from "../../utils/virtualizer-layout-info";

import { useVirtualizerStateContext } from "./virtualizer.context";

const props = defineProps<VirtualizerItemProps>();

defineSlots<{ default?: () => unknown }>();

const virtualizer = useVirtualizerStateContext();

const element = shallowRef<HTMLElement | null>(null);

const style = computed(() =>
  props.layoutInfo ? layoutInfoToStyle(props.layoutInfo, props.parentLayoutInfo) : undefined,
);

/**
 * Measure what the layout could only estimate.
 *
 * A wrapper still carrying an estimate has no height of its own, so what it reports is what its
 * content came to. React Aria writes the estimate on, clears it to read `scrollHeight`, and writes
 * it back — a forced reflow per element, and one that fights the size containment the wrapper
 * also carries.
 */
const measure = () => {
  const current = element.value;

  if (!current) return;

  const bounds = current.getBoundingClientRect();

  if (props.layoutInfo) {
    virtualizer?.updateItemSize(props.layoutInfo.key, new Size(bounds.width, bounds.height));
  }
};

// A row placed at an estimate is measured as soon as it is in the DOM, every time it is placed
// at an estimate again — a resize invalidates every measurement.
watch(
  () => [element.value, props.layoutInfo] as const,
  ([current, layoutInfo]) => {
    if (current && layoutInfo?.estimatedSize) measure();
  },
  { flush: "post", immediate: true },
);

/**
 * Watching the children rather than the wrapper: the wrapper's height is set by the layout, so it
 * never changes on its own, while what is inside it does.
 */
watch(
  () => [element.value, virtualizer?.shouldObserveItemSize.value] as const,
  ([current, shouldObserve], _previous, onCleanup) => {
    if (!current || !shouldObserve || typeof ResizeObserver === "undefined") return;

    const observer = new ResizeObserver(() => measure());

    for (const child of current.children) observer.observe(child);

    onCleanup(() => observer.disconnect());
  },
  { flush: "post", immediate: true },
);
</script>

<template>
  <div ref="element" role="presentation" :style="style">
    <slot />
  </div>
</template>
