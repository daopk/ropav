<script setup lang="ts" vapor>
import type {TabsListProps} from "./tabs.types";

import {computed} from "vue";

import {useTabsContext} from "./tabs.context";

const props = defineProps<TabsListProps>();

defineSlots<{default?: () => unknown}>();

const {keyboard, listElement, orientation, slots, state} = useTabsContext();

const isVertical = computed(() => orientation.value === "vertical");

// The element belongs to the root — it owns the keyboard and the collection — but this is the
// part that renders it, so the reference is handed back on mount.
const setListElement = (element: unknown) => {
  listElement.value = (element as HTMLElement | null) ?? null;
};

/**
 * The keys a tab list's delegate has no answer for.
 *
 * React Aria hands a tab list its own keyboard delegate rather than a list's: it navigates only
 * the axis the tabs run along, and has no notion of a page at all. Those keys are left alone
 * rather than claimed, so a page holding a row of tabs still scrolls under them.
 */
const onKeydown = (event: KeyboardEvent) => {
  if (event.key === "PageUp" || event.key === "PageDown") return;
  if (!isVertical.value && (event.key === "ArrowUp" || event.key === "ArrowDown")) return;

  keyboard.onKeydown(event);
};
</script>

<template>
  <div
    :id="state.tabsId.value"
    :ref="setListElement"
    :aria-label="props.ariaLabel"
    :aria-orientation="orientation"
    :class="slots.tabList({class: props.class})"
    :data-orientation="orientation"
    data-slot="tabs-list"
    role="tablist"
    @focusin="keyboard.onFocusin"
    @focusout="keyboard.onFocusout"
    @keydown="onKeydown"
  >
    <slot />
  </div>
</template>
