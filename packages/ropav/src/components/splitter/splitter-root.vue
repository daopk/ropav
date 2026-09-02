<script setup lang="ts" vapor>
import type { CollectionKey } from "../../composables/use-collection";
import type { SplitterSize } from "./splitter.state";
import type { SplitterRootProps, SplitterSlotProps } from "./splitter.types";

import { splitterVariants } from "@ropav/styles";
import { computed, onMounted, onUnmounted, shallowRef } from "vue";

import { dataAttr } from "../../utils/assertion";

import { provideSplitterContext } from "./splitter.context";
import { useSplitterState } from "./splitter.state";

const props = withDefaults(defineProps<SplitterRootProps>(), { isDisabled: undefined });

const emit = defineEmits<{
  "update:sizes": [sizes: SplitterSize[]];
  resizeStart: [sizes: SplitterSize[]];
  resize: [sizes: SplitterSize[]];
  resizeEnd: [sizes: SplitterSize[]];
  collapse: [key: CollectionKey];
  expand: [key: CollectionKey];
}>();

defineSlots<{ default?: (props: SplitterSlotProps) => unknown }>();

const element = shallowRef<HTMLElement | null>(null);

const state = useSplitterState({
  defaultSizes: () => props.defaultSizes,
  isDisabled: () => props.isDisabled,
  onCollapse: (key) => emit("collapse", key),
  onExpand: (key) => emit("expand", key),
  onSizesChange: (sizes) => {
    emit("update:sizes", sizes);
    emit("resize", sizes);
  },
  orientation: () => props.orientation,
  sizes: () => props.sizes,
});

const orientation = computed(() => state.orientation.value);

/**
 * `clientWidth`/`clientHeight` rather than a bounding rect: it already excludes the scrollbar, and
 * a splitter laid out inside something hidden reports zero, which is what the state's guard wants.
 */
const measure = () => {
  const root = element.value;

  if (!root) return;

  state.setAvailableSize(orientation.value === "vertical" ? root.clientHeight : root.clientWidth);
};

let observer: ResizeObserver | undefined;

onMounted(() => {
  // Measured synchronously rather than waiting for the observer's first callback: waiting a frame
  // paints once at the wrong size, and jsdom's `ResizeObserver` stub never calls back at all.
  measure();

  if (typeof ResizeObserver === "undefined" || !element.value) return;

  // Only ever assigns to a ref. Writing the panels' sizes from inside the callback would resize
  // the very element being observed, which is the "loop completed with undelivered notifications"
  // warning.
  observer = new ResizeObserver(measure);
  observer.observe(element.value, { box: "border-box" });
});

onUnmounted(() => observer?.disconnect());

const styles = computed(() => splitterVariants({ orientation: orientation.value }));

provideSplitterContext({
  isDisabled: state.isDisabled,
  keyboardLargeStep: computed(() => props.keyboardLargeStep ?? 50),
  keyboardStep: computed(() => props.keyboardStep ?? 10),
  orientation,
  rootEl: computed(() => element.value),
  slots: styles,
  state,
});

defineExpose({ measure });
</script>

<template>
  <div
    ref="element"
    :aria-label="props.ariaLabel"
    :aria-labelledby="props.ariaLabelledby"
    :class="styles.base({ class: props.class })"
    :data-disabled="dataAttr(state.isDisabled.value)"
    :data-dragging="dataAttr(state.resizingHandle.value != null)"
    :data-orientation="orientation"
    data-slot="splitter"
    role="group"
  >
    <slot
      :is-disabled="state.isDisabled.value"
      :is-dragging="state.resizingHandle.value != null"
      :layout="state.layout.value"
      :orientation="orientation"
    />
  </div>
</template>
