<script setup lang="ts" vapor>
import type {SliderThumbProps, SliderThumbSlotProps} from "./slider.types";

import {shallowRef} from "vue";

import {useInteractionStates} from "../../composables/use-interaction-states";
import {useSliderThumb} from "../../composables/use-slider-thumb";
import {dataAttr} from "../../utils/assertion";
import {composeSlotClassName} from "../../utils/compose";
import {visuallyHiddenStyle} from "../../utils/visually-hidden";

import {useSliderContext} from "./slider.context";

const props = defineProps<SliderThumbProps>();

defineSlots<{default?: (props: SliderThumbSlotProps) => unknown}>();

const {slider, slots, state, trackEl} = useSliderContext();

const inputEl = shallowRef<HTMLInputElement | null>(null);

const setInputEl = (element: unknown) => {
  inputEl.value = element instanceof HTMLInputElement ? element : null;
};

const thumb = useSliderThumb({
  describedBy: slider.describedBy,
  form: () => props.form,
  id: () => slider.getThumbId(props.index ?? 0),
  index: () => props.index,
  inputEl,
  isDisabled: () => props.isDisabled,
  labelledBy: slider.labelledBy,
  name: () => props.name,
  state,
  trackEl,
});

// Hover and the focus ring are keyed on attributes rather than pseudo-classes, and focus
// lives on the hidden input while the ring is painted on the thumb.
const {isFocusVisible, isFocused, isHovered, onBlur, onFocus, onPointerenter, onPointerleave} =
  useInteractionStates({isDisabled: () => thumb.isDisabled.value});

const onInputBlur = () => {
  onBlur();
  thumb.inputHandlers.onBlur();
};

const onInputFocus = () => {
  onFocus();
  thumb.inputHandlers.onFocus();
};
</script>

<template>
  <div
    :class="composeSlotClassName(slots.thumb, props.class)"
    :data-disabled="dataAttr(thumb.isDisabled.value)"
    :data-dragging="dataAttr(thumb.isDragging.value)"
    :data-focus-visible="dataAttr(isFocusVisible)"
    :data-focused="dataAttr(isFocused)"
    :data-hovered="dataAttr(isHovered)"
    data-slot="slider-thumb"
    :style="thumb.thumbStyle.value"
    @keydown="thumb.thumbHandlers.onKeydown"
    @pointerdown="thumb.thumbHandlers.onPointerdown"
    @pointerenter="onPointerenter"
    @pointerleave="onPointerleave"
  >
    <span :style="visuallyHiddenStyle">
      <input
        :ref="setInputEl"
        v-bind="thumb.inputProps.value"
        @blur="onInputBlur"
        @change="thumb.inputHandlers.onChange"
        @focus="onInputFocus"
      />
    </span>
    <slot
      :is-disabled="thumb.isDisabled.value"
      :is-dragging="thumb.isDragging.value"
      :is-focus-visible="isFocusVisible"
      :is-focused="isFocused"
      :is-hovered="isHovered"
    />
  </div>
</template>
