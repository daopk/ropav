<script setup lang="ts" vapor>
import type {ListBoxLoadMoreItemProps} from "./list-box.types";

import {onUnmounted, shallowRef, watch} from "vue";

import {getScrollParent} from "../../utils/focus";

import {useListBoxContext} from "./list-box.context";

// `isLoading` declares an explicit `undefined` default so an absent prop stays absent rather than
// reading as an explicit `false`.
const props = withDefaults(defineProps<ListBoxLoadMoreItemProps>(), {
  isLoading: undefined,
  scrollOffset: 1,
});

const emit = defineEmits<{loadMore: []}>();

defineSlots<{default?: () => unknown}>();

const {collection} = useListBoxContext();

const sentinel = shallowRef<HTMLElement | null>(null);

/** Never in the layout, and never in the collection — it is a marker, not an option. */
const SENTINEL_WRAPPER_STYLE = {height: "0px", position: "relative", width: "0px"} as const;
const SENTINEL_STYLE = {height: "1px", position: "absolute", width: "1px"} as const;

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
 * time the options change: a large margin means the callback does not fire again while the
 * sentinel stays visible, so a page that did not fill the box would otherwise never ask for the
 * next one.
 */
const observe = () => {
  disconnect();

  // jsdom implements no `IntersectionObserver`, and a listbox that never scrolls has no edge to
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

watch([sentinel, () => collection.size.value, () => props.scrollOffset], observe, {
  flush: "post",
  immediate: true,
});

onUnmounted(disconnect);
</script>

<template>
  <!--
    The sentinel is always rendered, loading or not: one that is absent can never report that it
    came into view, so the next page would never be asked for.
  -->
  <div inert :style="SENTINEL_WRAPPER_STYLE">
    <div ref="sentinel" :style="SENTINEL_STYLE" />
  </div>
  <div v-if="props.isLoading" :class="props.class" role="option" tabindex="-1">
    <slot />
  </div>
</template>
