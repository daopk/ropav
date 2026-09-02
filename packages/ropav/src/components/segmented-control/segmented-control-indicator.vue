<script setup lang="ts" vapor>
import type { SegmentedControlIndicatorProps } from "./segmented-control.types";

import { shallowRef } from "vue";

import { useSharedElement, useSharedElementScope } from "../../composables/use-shared-element";
import { dataAttr } from "../../utils/assertion";
import { composeSlotClassName } from "../../utils/compose";

import {
  useSegmentedControlContext,
  useSegmentedControlItemContext,
} from "./segmented-control.context";

const props = defineProps<SegmentedControlIndicatorProps>();

const { slots } = useSegmentedControlContext();
const { isSelected } = useSegmentedControlItemContext();

const element = shallowRef<HTMLElement | null>(null);

/*
 * One indicator is rendered inside every segment and only the selected one is present, so what
 * looks like a single pill sliding along is really one element handing its place to the next.
 * The name is what the two ends of that handoff have in common.
 */
const { isEntering, isExiting, isPresent } = useSharedElement({
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
    :class="composeSlotClassName(slots.indicator, props.class)"
    :data-entering="dataAttr(isEntering)"
    :data-exiting="dataAttr(isExiting)"
    data-slot="segmented-control-indicator"
  />
</template>
