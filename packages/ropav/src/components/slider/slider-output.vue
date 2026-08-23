<script setup lang="ts" vapor>
import type {SliderOutputProps} from "./slider.types";

import {computed} from "vue";

import {dataAttr} from "../../utils/assertion";
import {composeSlotClassName} from "../../utils/compose";

import {useSliderContext} from "./slider.context";

const props = defineProps<SliderOutputProps>();

defineSlots<{default?: () => unknown}>();

const {slider, slots, state} = useSliderContext();

// Every thumb's own label, joined — a range reads as "100 – 500" rather than as one value.
const label = computed(() =>
  state.values.value.map((_, index) => state.getThumbValueLabel(index)).join(" – "),
);
</script>

<template>
  <output
    v-bind="slider.outputProps.value"
    :class="composeSlotClassName(slots.output, props.class)"
    :data-disabled="dataAttr(state.isDisabled.value)"
    :data-orientation="state.orientation.value"
    data-slot="slider-output"
  >
    <slot>{{ label }}</slot>
  </output>
</template>
