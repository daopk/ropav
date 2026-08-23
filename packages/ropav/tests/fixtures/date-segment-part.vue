<script setup lang="ts" vapor>
import type { DateSegmentPartProps } from "./date-segment.types";

import { shallowRef } from "vue";

import { useDateSegment } from "@/composables/use-date-segment";

const props = defineProps<DateSegmentPartProps>();

const element = shallowRef<HTMLElement | null>(null);

const segment = useDateSegment({
  ariaDescribedBy: () => props.ariaDescribedBy,
  ariaLabel: () => props.ariaLabel,
  ariaLabelledBy: () => props.ariaLabelledBy,
  element,
  focusManager: props.focusManager,
  segment: () => props.segment,
  state: props.state,
});
</script>

<template>
  <span
    ref="element"
    v-bind="segment.attrs.value"
    data-slot="segment"
    :style="segment.style.value"
    @beforeinput="segment.onBeforeinput"
    @blur="segment.onBlur"
    @focus="segment.onFocus"
    @input="segment.onInput"
    @keydown="segment.onKeydown"
    @mousedown="segment.onMousedown"
    @pointerdown="segment.onPointerdown"
    >{{ props.segment.text }}</span
  >
</template>
