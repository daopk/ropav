<script setup lang="ts" vapor>
import type { ColorSliderThumbProps, ColorSliderThumbSlotProps } from "./color-slider.types";

import { computed } from "vue";

import { useInteractionStates } from "../../composables/use-interaction-states";
import { dataAttr } from "../../utils/assertion";
import { composeSlotClassName } from "../../utils/compose";

import { useColorSliderContext } from "./color-slider.context";

const props = defineProps<ColorSliderThumbProps>();

defineSlots<{ default?: (props: ColorSliderThumbSlotProps) => unknown }>();

const { setInputEl, slider, slots } = useColorSliderContext();

// Hover and the focus ring are keyed on attributes rather than pseudo-classes, and focus lives on
// the hidden input while the ring is painted on the thumb.
const { isFocusVisible, isFocused, isHovered, onBlur, onFocus, onPointerenter, onPointerleave } =
  useInteractionStates({ isDisabled: () => slider.isDisabled.value });

/**
 * A disabled thumb drops the colour and takes the stylesheet's grey instead: keeping it would
 * show a live value on a control that cannot be moved.
 */
const style = computed(() => ({
  ...slider.thumbStyle.value,
  ...(slider.isDisabled.value ? { backgroundColor: undefined } : {}),
}));

const onInputBlur = () => {
  onBlur();
  slider.inputHandlers.onBlur();
};

const onInputFocus = () => {
  onFocus();
  slider.inputHandlers.onFocus();
};
</script>

<template>
  <div
    :class="composeSlotClassName(slots.thumb, props.class)"
    :data-disabled="dataAttr(slider.isDisabled.value)"
    :data-dragging="dataAttr(slider.isDragging.value)"
    :data-focus-visible="dataAttr(isFocusVisible)"
    :data-focused="dataAttr(isFocused)"
    :data-hovered="dataAttr(isHovered)"
    data-slot="color-slider-thumb"
    :style="style"
    @keydown="slider.thumbHandlers.onKeydown"
    @pointerdown="slider.thumbHandlers.onPointerdown"
    @pointerenter="onPointerenter"
    @pointerleave="onPointerleave"
  >
    <input
      :ref="setInputEl"
      v-bind="slider.inputProps.value"
      :style="slider.inputStyle"
      @blur="onInputBlur"
      @change="slider.inputHandlers.onChange"
      @focus="onInputFocus"
    />
    <slot
      :color="slider.displayColor.value"
      :is-disabled="slider.isDisabled.value"
      :is-dragging="slider.isDragging.value"
      :is-focus-visible="isFocusVisible"
      :is-focused="isFocused"
      :is-hovered="isHovered"
    />
  </div>
</template>
