<script setup lang="ts" vapor>
import type { ColorSliderSlotProps, ColorSliderTrackProps } from "./color-slider.types";

import { computed } from "vue";

import { dataAttr } from "../../utils/assertion";
import { composeSlotClassName } from "../../utils/compose";

import { useColorSliderContext } from "./color-slider.context";

const props = defineProps<ColorSliderTrackProps>();

defineSlots<{ default?: (props: ColorSliderSlotProps) => unknown }>();

const { channel, setTrackEl, slider, slots, state } = useColorSliderContext();

/**
 * The colours at the two ends of the channel. The track is inset by half a thumb at each end so
 * the thumb can reach the extremes without hanging over the edge, and the stylesheet fills those
 * two gaps with `::before` / `::after` — which need the end colours as custom properties, since
 * a pseudo-element cannot be given an inline style.
 */
const edgeColors = computed(() => {
  const color = slider.displayColor.value;
  const range = color.getChannelRange(channel.value);

  return {
    end: color.withChannelValue(channel.value, range.maxValue).toString("css"),
    start: color.withChannelValue(channel.value, range.minValue).toString("css"),
  };
});

/**
 * The generated gradient sits *over* a transparency checkerboard, so an alpha slider reads as
 * translucent rather than as a colour fading into whatever happens to be behind the page.
 */
const style = computed(() => ({
  ...slider.trackStyle.value,
  "--track-end-color": edgeColors.value.end,
  "--track-start-color": edgeColors.value.start,
  background: `${slider.trackStyle.value.background}, repeating-conic-gradient(#efefef 0% 25%, #f7f7f7 0% 50%) 50% / 16px 16px`,
}));
</script>

<template>
  <div
    :ref="setTrackEl"
    v-bind="slider.trackAttrs.value"
    :class="composeSlotClassName(slots.track, props.class)"
    :data-disabled="dataAttr(state.isDisabled.value)"
    :data-orientation="state.orientation.value"
    data-slot="color-slider-track"
    :style="style"
    @pointerdown="slider.trackHandlers.onPointerdown"
  >
    <slot
      :color="state.value.value"
      :is-disabled="state.isDisabled.value"
      :orientation="state.orientation.value"
    />
  </div>
</template>
