<script setup lang="ts" vapor>
import type { ColorAreaThumbProps, ColorAreaThumbSlotProps } from "./color-area.types";

import { computed } from "vue";

import { useInteractionStates } from "../../composables/use-interaction-states";
import { dataAttr } from "../../utils/assertion";
import { composeSlotClassName } from "../../utils/compose";

import { useColorAreaContext } from "./color-area.context";

const props = defineProps<ColorAreaThumbProps>();

defineSlots<{ default?: (props: ColorAreaThumbSlotProps) => unknown }>();

const { area, setInputXEl, setInputYEl, slots, state } = useColorAreaContext();

// Hover and the focus ring are keyed on attributes rather than pseudo-classes, and focus lives on
// one of the two hidden inputs while the ring is painted on the thumb.
const { isFocusVisible, isFocused, isHovered, onBlur, onFocus, onPointerenter, onPointerleave } =
  useInteractionStates({ isDisabled: () => area.isDisabled.value });

const displayColor = computed(() => state.getDisplayColor());

/**
 * The colour is written twice on purpose — see the note on the root. Unlike `ColorSlider`, a
 * disabled colour area thumb *keeps* its colour; the stylesheet dims the whole area instead.
 */
const style = computed(() => ({
  ...area.thumbStyle.value,
  "--color-area-thumb-color": displayColor.value.toString("css"),
  backgroundColor: displayColor.value.toString("css"),
}));

const onInputBlur = (event: FocusEvent) => {
  onBlur();
  area.thumbHandlers.onFocusout(event);
};
</script>

<template>
  <div
    v-bind="area.thumbAttrs"
    :class="composeSlotClassName(slots.thumb, props.class)"
    :data-disabled="dataAttr(area.isDisabled.value)"
    :data-dragging="dataAttr(state.isDragging.value)"
    :data-focus-visible="dataAttr(isFocusVisible)"
    :data-focused="dataAttr(isFocused)"
    :data-hovered="dataAttr(isHovered)"
    data-slot="color-area-thumb"
    :style="style"
    @focusout="onInputBlur"
    @keydown="area.thumbHandlers.onKeydown"
    @pointerdown="area.thumbHandlers.onPointerdown"
    @pointerenter="onPointerenter"
    @pointerleave="onPointerleave"
  >
    <input
      :ref="setInputXEl"
      v-bind="area.xInputProps.value"
      :style="area.inputStyle"
      @change="area.xInputHandlers.onChange"
      @focus="(onFocus(), area.xInputHandlers.onFocus())"
    />
    <input
      :ref="setInputYEl"
      v-bind="area.yInputProps.value"
      :style="area.inputStyle"
      @change="area.yInputHandlers.onChange"
      @focus="(onFocus(), area.yInputHandlers.onFocus())"
    />
    <slot
      :color="displayColor"
      :is-disabled="area.isDisabled.value"
      :is-dragging="state.isDragging.value"
      :is-focus-visible="isFocusVisible"
      :is-focused="isFocused"
      :is-hovered="isHovered"
    />
  </div>
</template>
