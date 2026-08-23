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
 * The inline height is cleared first: it is the estimate, and measuring through it would just
 * read the guess back. `scrollHeight` rather than `getBoundingClientRect` because that is what
 * React Aria reads, and a row whose content overflows should report the content.
 */
const measure = () => {
  const current = element.value;

  if (!current) return;

  const height = current.style.height;

  current.style.height = "";

  const measured = new Size(current.scrollWidth, current.scrollHeight);

  current.style.height = height;

  if (props.layoutInfo) virtualizer?.updateItemSize(props.layoutInfo.key, measured);
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
