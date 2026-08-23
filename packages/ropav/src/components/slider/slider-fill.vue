<script setup lang="ts" vapor>
import type { SliderFillProps } from "./slider.types";

import { computed } from "vue";

import { dataAttr } from "../../utils/assertion";
import { composeSlotClassName } from "../../utils/compose";

import { useSliderContext } from "./slider.context";

const props = defineProps<SliderFillProps>();

const { slots, state } = useSliderContext();

/**
 * A single thumb fills from the start of the track; a range fills between its two thumbs.
 * Both ends are inline styles rather than classes, because they are a measurement.
 */
const style = computed(() => {
  const values = state.values.value;
  const [start, end] = [
    values.length > 1 ? state.getThumbPercent(0) : 0,
    state.getThumbPercent(values.length - 1),
  ].sort();

  const offset = `${(start ?? 0) * 100}%`;
  const length = `${((end ?? 0) - (start ?? 0)) * 100}%`;

  // A vertical slider fills upwards from the bottom.
  return state.orientation.value === "vertical"
    ? { bottom: offset, height: length }
    : { left: offset, width: length };
});
</script>

<template>
  <div
    :class="composeSlotClassName(slots.fill, props.class)"
    :data-disabled="dataAttr(state.isDisabled.value)"
    data-slot="slider-fill"
    :style="style"
  />
</template>
