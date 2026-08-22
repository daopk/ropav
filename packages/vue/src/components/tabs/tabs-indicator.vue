<script setup lang="ts" vapor>
import type {TabsIndicatorProps} from "./tabs.types";

import {shallowRef} from "vue";

import {useSharedElement, useSharedElementScope} from "../../composables/use-shared-element";
import {dataAttr} from "../../utils/assertion";
import {composeSlotClassName} from "../../utils/compose";

import {useTabsContext, useTabsTabContext} from "./tabs.context";

const props = defineProps<TabsIndicatorProps>();

const {slots} = useTabsContext();
const {isSelected} = useTabsTabContext();

const element = shallowRef<HTMLElement | null>(null);

/*
 * One indicator is rendered inside every tab and only the selected one is present, so what looks
 * like a single strip sliding along is really one element handing its place to the next. The name
 * is what the two ends of that handoff have in common.
 */
const {isEntering, isExiting, isPresent} = useSharedElement({
  elementRef: element,
  isVisible: () => isSelected.value,
  name: "SelectionIndicator",
  scope: useSharedElementScope(),
});
</script>

<template>
  <span
    v-if="isPresent"
    ref="element"
    aria-hidden="true"
    :class="composeSlotClassName(slots.tabIndicator, props.class)"
    :data-entering="dataAttr(isEntering)"
    :data-exiting="dataAttr(isExiting)"
    data-slot="tabs-indicator"
  />
</template>
