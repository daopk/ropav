<script setup lang="ts" vapor>
import type {ColorSwatchPickerSwatchProps} from "./color-swatch-picker.types";

import {computed} from "vue";

import {useColorSwatch} from "../../composables/use-color-swatch";

import {
  useColorSwatchPickerContext,
  useColorSwatchPickerItemContext,
} from "./color-swatch-picker.context";

const props = defineProps<ColorSwatchPickerSwatchProps>();

const {slots} = useColorSwatchPickerContext();
const item = useColorSwatchPickerItemContext();

const swatch = useColorSwatch({
  ariaLabel: () => props.ariaLabel,
  ariaLabelledby: () => props.ariaLabelledby,
  // The item's colour is the ordinary case; a caller overriding it is not, but the prop exists
  // because the React build forwards one too.
  color: () => props.color ?? item.color.value,
  colorName: () => props.colorName,
  id: () => props.id,
});

/**
 * Only `background-color` and `forced-color-adjust`, deliberately.
 *
 * A standalone `ColorSwatch` also writes `--color-swatch-current`, because `.color-swatch`
 * composes it into a `background` shorthand over the transparency checkerboard. This swatch is a
 * different block with no such rule, and the variable it would set is already on the item — where
 * the selected border reads it. Writing it here as well would put two declarations of the same
 * variable at two levels, and the React build has exactly one.
 */
const style = computed(() => swatch.style.value);
</script>

<template>
  <div
    v-bind="swatch.attrs.value"
    :class="slots.swatch({class: props.class})"
    data-slot="color-swatch-picker-swatch"
    :style="style"
  />
</template>
