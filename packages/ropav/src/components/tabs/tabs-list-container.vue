<script setup lang="ts" vapor>
import type {TabsListContainerProps} from "./tabs.types";

import {computed, useTemplateRef} from "vue";

import {composeSlotClassName} from "../../utils/compose";
import IconChevronDown from "../icons/icon-chevron-down.vue";
import IconChevronLeft from "../icons/icon-chevron-left.vue";
import IconChevronRight from "../icons/icon-chevron-right.vue";
import IconChevronUp from "../icons/icon-chevron-up.vue";
import {ScrollShadowRoot as Scroller} from "../scroll-shadow";

import {useTabsContext} from "./tabs.context";

/** How much of the visible strip one press of a chevron travels. */
const SCROLL_FRACTION = 0.8;

/** How far the fade at each edge of the strip reaches. */
const SHADOW_SIZE = 64;

const props = defineProps<TabsListContainerProps>();

defineSlots<{default?: () => unknown}>();

const {orientation, slots} = useTabsContext();

const isVertical = computed(() => orientation.value === "vertical");

/*
 * Typed as the shape the scroller exposes rather than as the component: `vue-tsc` types a vapor
 * SFC as a function, so `InstanceType` has nothing to instantiate. Vue unwraps an exposed ref on
 * the way out, which is why `element` is the element itself and not a ref to it.
 */
const scroller = useTemplateRef<{element: HTMLElement | null}>("scroller");

const getScroller = () => scroller.value?.element ?? null;

const scrollBy = (direction: 1 | -1) => {
  const element = getScroller();

  if (!element) return;

  const vertical = isVertical.value;
  const size = vertical ? element.clientHeight : element.clientWidth;
  const scrollSize = vertical ? element.scrollHeight : element.scrollWidth;
  const maxScroll = Math.max(0, scrollSize - size);

  // In a right-to-left strip the horizontal scroll range runs from 0 at the start, on the right,
  // down into the negatives — so the sign of the delta has to flip for `scrollLeft` to move
  // towards the edge that was asked for.
  const isRtl = !vertical && getComputedStyle(element).direction === "rtl";
  const delta = direction * size * SCROLL_FRACTION * (isRtl ? -1 : 1);
  const current = vertical ? element.scrollTop : element.scrollLeft;

  // Clamped to the scrollable range, so a press near an edge lands flush on it rather than
  // asking for a position past the content — which can cut the smooth scroll short of the edge
  // or leave the strip visually stranded.
  const next = Math.min(isRtl ? 0 : maxScroll, Math.max(isRtl ? -maxScroll : 0, current + delta));

  if (next === current) return;

  element.scrollTo({behavior: "smooth", [vertical ? "top" : "left"]: next});
};

const previousLabel = computed(() => (isVertical.value ? "Scroll tabs up" : "Scroll tabs left"));
const nextLabel = computed(() => (isVertical.value ? "Scroll tabs down" : "Scroll tabs right"));
</script>

<template>
  <div
    :class="composeSlotClassName(slots.tabListContainer, props.class)"
    data-slot="tabs-list-container"
  >
    <Scroller
      ref="scroller"
      :class="composeSlotClassName(slots.scroller)"
      hide-scroll-bar
      :orientation="orientation"
      :size="SHADOW_SIZE"
    >
      <slot />
    </Scroller>

    <button
      :aria-label="previousLabel"
      :class="composeSlotClassName(slots.scrollPrev)"
      tabindex="-1"
      type="button"
      @click="scrollBy(-1)"
    >
      <IconChevronUp v-if="isVertical" />
      <IconChevronLeft v-else />
    </button>

    <button
      :aria-label="nextLabel"
      :class="composeSlotClassName(slots.scrollNext)"
      tabindex="-1"
      type="button"
      @click="scrollBy(1)"
    >
      <IconChevronDown v-if="isVertical" />
      <IconChevronRight v-else />
    </button>
  </div>
</template>
