<script setup lang="ts" vapor>
import type {
  ColorSwatchPickerIndicatorProps,
  ColorSwatchPickerIndicatorSlotProps,
} from "./color-swatch-picker.types";

import { computed } from "vue";

import { dataAttr } from "../../utils/assertion";

import {
  useColorSwatchPickerContext,
  useColorSwatchPickerItemContext,
} from "./color-swatch-picker.context";

const props = defineProps<ColorSwatchPickerIndicatorProps>();

defineSlots<{ default?: (props: ColorSwatchPickerIndicatorSlotProps) => unknown }>();

const { slots } = useColorSwatchPickerContext();
const item = useColorSwatchPickerItemContext();

/**
 * Relative luminance, `(0.2126r + 0.7152g + 0.0722b) / 255`.
 *
 * The channels are read in `rgb` whatever space the colour came in as, because the coefficients
 * are defined for linear red, green and blue. Above 0.5 the swatch is light, and the checkmark
 * over it should be dark.
 */
const isLightColor = computed(() => {
  const color = item.color.value.toFormat("rgb");

  const luminance =
    (0.2126 * color.getChannelValue("red") +
      0.7152 * color.getChannelValue("green") +
      0.0722 * color.getChannelValue("blue")) /
    255;

  return luminance > 0.5;
});
</script>

<template>
  <span
    aria-hidden="true"
    :class="slots.indicator({ class: props.class })"
    :data-light-color="dataAttr(isLightColor)"
    data-slot="color-swatch-picker-indicator"
  >
    <slot
      :color="item.color.value"
      :is-disabled="item.isDisabled.value"
      :is-focus-visible="item.isFocusVisible.value"
      :is-focused="item.isFocused.value"
      :is-hovered="item.isHovered.value"
      :is-pressed="item.isPressed.value"
      :is-selected="item.isSelected.value"
    >
      <svg
        aria-hidden="true"
        data-slot="color-swatch-picker-checkmark"
        fill="none"
        role="presentation"
        stroke="currentColor"
        stroke-linecap="round"
        stroke-linejoin="round"
        stroke-width="1.5"
        viewBox="0 0 12 12"
      >
        <polyline points="2.5 6 5 8.5 9.5 3" />
      </svg>
    </slot>
  </span>
</template>
