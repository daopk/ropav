<script setup lang="ts" vapor>
import type {SliderMarksProps} from "./slider.types";

import {composeSlotClassName} from "../../utils/compose";

import {useSliderContext} from "./slider.context";

const props = defineProps<SliderMarksProps>();

defineSlots<{default?: () => unknown}>();

const {slots} = useSliderContext();
</script>

<template>
  <div :class="composeSlotClassName(slots.marks, props.class)" data-slot="slider-marks">
    <slot />
  </div>
</template>
