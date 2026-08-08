<script setup lang="ts" vapor>
import type {SliderSlotProps, SliderTrackProps} from "./slider.types";

import {computed} from "vue";

import {useInteractionStates} from "../../composables/use-interaction-states";
import {dataAttr} from "../../utils/assertion";
import {composeSlotClassName} from "../../utils/compose";

import {useSliderContext} from "./slider.context";

const props = defineProps<SliderTrackProps>();

defineSlots<{default?: (props: SliderSlotProps) => unknown}>();

const {setTrackEl, slider, slots, state} = useSliderContext();

const {isHovered, onPointerenter, onPointerleave} = useInteractionStates({
  isDisabled: () => state.isDisabled.value,
});

/** Where the filled part of the track starts and ends, as fractions of its length. */
const offsets = computed(() => {
  const values = state.values.value;
  const [start, end] = [
    values.length > 1 ? state.getThumbPercent(0) : 0,
    state.getThumbPercent(values.length - 1),
  ].sort();

  return {end: end ?? 0, start: start ?? 0};
});

/**
 * The ends of the track are drawn as coloured borders rather than by the fill, so the track
 * has to say which of them the fill reaches. A single thumb fills from the start, while a
 * range only touches an end when a thumb is parked on it.
 */
const fill = computed(() => {
  const {end, start} = offsets.value;
  const width = (end - start) * 100;

  if (state.values.value.length === 1) return {end: width === 100, start: width > 0};

  return {end: start * 100 + width === 100, start: start === 0};
});
</script>

<template>
  <div
    :ref="setTrackEl"
    v-bind="slider.trackHandlers"
    :class="composeSlotClassName(slots.track, props.class)"
    :data-disabled="dataAttr(state.isDisabled.value)"
    :data-fill-end="dataAttr(fill.end)"
    :data-fill-start="dataAttr(fill.start)"
    :data-hovered="dataAttr(isHovered)"
    :data-orientation="state.orientation.value"
    data-slot="slider-track"
    :style="slider.trackStyle"
    @pointerenter="onPointerenter"
    @pointerleave="onPointerleave"
  >
    <slot
      :is-disabled="state.isDisabled.value"
      :orientation="state.orientation.value"
      :values="state.values.value"
    />
  </div>
</template>
