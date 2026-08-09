<script setup lang="ts" vapor>
import type {ColorSwatchRootProps, ColorSwatchSlotProps} from "./color-swatch.types";

import {colorSwatchVariants} from "@heroui/styles";
import {computed} from "vue";

import {useColorSwatch} from "../../composables/use-color-swatch";

const props = defineProps<ColorSwatchRootProps>();

defineSlots<{default?: (props: ColorSwatchSlotProps) => unknown}>();

const swatch = useColorSwatch({
  ariaLabel: () => props.ariaLabel,
  ariaLabelledby: () => props.ariaLabelledby,
  color: () => props.color,
  colorName: () => props.colorName,
  id: () => props.id,
});

const styles = computed(() =>
  colorSwatchVariants({class: props.class, shape: props.shape, size: props.size}),
);

/**
 * The colour is written twice on purpose: as `background-color`, which is what actually paints,
 * and as `--color-swatch-current`, which `.color-swatch` composes into its `background` shorthand
 * over the transparency checkerboard. React ends up with both for the same reason — its render
 * props merge the default style under the custom property — so dropping either one is a divergence.
 */
const style = computed(() => ({
  ...(swatch.style.value as Record<string, unknown>),
  "--color-swatch-current": swatch.color.value.toString("css"),
}));
</script>

<template>
  <div v-bind="swatch.attrs.value" :class="styles" data-slot="color-swatch" :style="style">
    <slot :color="swatch.color.value" />
  </div>
</template>
