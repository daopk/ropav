<script setup lang="ts" vapor>
import type {TableLoadMoreProps} from "./table.types";

import {computed, onUnmounted, shallowRef, watch} from "vue";

import {composeSlotClassName} from "../../utils/compose";
import {getScrollParent} from "../../utils/focus";

import {useTableContext, useTableGridContext} from "./table.context";

const props = withDefaults(defineProps<TableLoadMoreProps>(), {
  isLoading: undefined,
  scrollOffset: 1,
});

const emit = defineEmits<{loadMore: []}>();

defineSlots<{default?: () => unknown}>();

const {slots} = useTableContext();
const {collection} = useTableGridContext();

const sentinel = shallowRef<HTMLElement | null>(null);

// One is the floor: `colspan="0"` means "to the end of the section" in some engines.
const columnCount = computed(() => Math.max(1, collection.columns.size.value));

let observer: IntersectionObserver | undefined;

const disconnect = () => {
  observer?.disconnect();
  observer = undefined;
};

/**
 * Watch for the end of the list coming into view.
 *
 * Ported from React Aria's `useLoadMoreSentinel`. Two details carry the behaviour. The margin is
 * expressed as a **percentage of the scroll box**, so `scrollOffset` reads as "how many screens
 * from the bottom" rather than a pixel distance. And the observer is torn down and rebuilt every
 * time the rows change: a large margin means the callback does not fire again while the sentinel
 * stays visible, so a page that did not fill the box would otherwise never ask for the next one.
 */
const observe = () => {
  disconnect();

  // jsdom implements no `IntersectionObserver`, and a table that never scrolls has no edge to
  // reach either — the caller can still drive loading itself.
  if (typeof IntersectionObserver === "undefined" || !sentinel.value) return;

  const margin = 100 * props.scrollOffset;

  observer = new IntersectionObserver(
    (entries) => {
      // `isIntersecting` rather than a ratio comparison: a ratio of zero gets reported for an
      // element that is genuinely in view, which a one-pixel sentinel hits often.
      if (entries.some((entry) => entry.isIntersecting)) emit("loadMore");
    },
    {
      root: getScrollParent(sentinel.value),
      rootMargin: `0px ${margin}% ${margin}% ${margin}%`,
    },
  );

  observer.observe(sentinel.value);
};

watch([sentinel, () => collection.rows.size.value, () => props.scrollOffset], observe, {
  flush: "post",
  immediate: true,
});

onUnmounted(disconnect);
</script>

<template>
  <tr inert :style="{height: '0px'}">
    <td :style="{border: 0, padding: 0}">
      <div ref="sentinel" :style="{height: '1px', position: 'relative', width: '1px'}" />
    </td>
  </tr>
  <tr
    v-if="props.isLoading"
    aria-level="1"
    :class="composeSlotClassName(slots.loadMore, props.class)"
    data-level="1"
    data-slot="table-load-more"
    role="row"
  >
    <td :colspan="columnCount" role="rowheader">
      <slot />
    </td>
  </tr>
</template>
