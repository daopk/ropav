<script setup lang="ts" vapor>
import type { SliderMarksProps } from "./slider.types";

const props = defineProps<SliderMarksProps>();

defineSlots<{ default?: () => unknown }>();
</script>

<template>
  <div :class="['rp-slider__marks', props.class]" data-slot="slider-marks">
    <slot />
  </div>
</template>
