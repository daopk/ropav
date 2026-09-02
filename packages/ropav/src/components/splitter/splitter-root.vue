<script setup lang="ts" vapor>
import type { CollectionKey } from "../../composables/use-collection";
import type { SplitterSize } from "./splitter.state";
import type { SplitterRootProps, SplitterSlotProps } from "./splitter.types";

import { splitterVariants } from "@ropav/styles";
import { computed, onMounted, onUnmounted, shallowRef, watch } from "vue";

import { dataAttr } from "../../utils/assertion";

import { provideSplitterContext } from "./splitter.context";
import { useSplitterState } from "./splitter.state";
import { readSplitterLayout, writeSplitterLayout } from "./splitter.storage";

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
  onCollapse: (key) => {
    emit("collapse", key);
    schedulePersist();
  },
  onExpand: (key) => {
    emit("expand", key);
    schedulePersist();
  },
  onResizeEnd: (sizes) => emit("resizeEnd", sizes),
  onResizeStart: (sizes) => emit("resizeStart", sizes),
  onSizesChange: (sizes) => {
    emit("update:sizes", sizes);
    emit("resize", sizes);
    schedulePersist();
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

let pending: ReturnType<typeof setTimeout> | undefined;

const persist = () => {
  if (!props.autoSaveId) return;

  writeSplitterLayout(
    props.autoSaveId,
    orientation.value,
    state.panelKeys.value,
    state.sizes.value,
    state.isCollapsed,
  );
};

/*
 * Debounced, and the gesture check happens when the timer fires rather than when it is scheduled.
 * A pointer drag reports continuously, so the debounce lands after the last move; an arrow press
 * opens and closes the whole drag synchronously, so at schedule time it always looks like a drag
 * in flight and a check up front would drop every keyboard resize.
 */
const schedulePersist = () => {
  if (!props.autoSaveId || isRestoring) return;

  if (pending) clearTimeout(pending);
  pending = setTimeout(function write() {
    // Still under the pointer — wait for it to be let go rather than storing a half-finished drag.
    if (state.resizingHandle.value != null) {
      pending = setTimeout(write, 150);

      return;
    }

    pending = undefined;
    persist();
  }, 150);
};

/*
 * Restored on the first tick the panels have actually registered, not in `onMounted`: a panel
 * registers from a post-flush watcher so it can be sorted by document position, and the root's
 * own `mounted` can run before that has happened — leaving nothing to match a stored layout
 * against.
 *
 * After mount either way, never during setup, so a server render and the first client render
 * agree and there is nothing to reconcile. The cost is one frame of the declared layout, which is
 * the honest trade: hiding the splitter until it is ready would stall a nested one, whose own
 * measurement depends on the outer group having painted.
 */
let isRestoring = false;

const stop = watch(
  () => state.panelKeys.value,
  (keys) => {
    if (!props.autoSaveId || keys.length === 0) return;

    stop();

    const restored = readSplitterLayout(props.autoSaveId, orientation.value, keys);

    if (!restored) return;

    isRestoring = true;
    state.setSizes(restored.sizes);
    for (const key of restored.collapsed) state.collapse(key);
    isRestoring = false;
  },
  { flush: "post", immediate: true },
);

const flush = () => {
  if (!pending) return;

  clearTimeout(pending);
  pending = undefined;
  persist();
};

onUnmounted(() => {
  observer?.disconnect();
  flush();
});

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
