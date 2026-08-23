<script setup lang="ts" vapor>
import type { ColorSliderOutputProps } from "./color-slider.types";

import { computed } from "vue";

import { dataAttr } from "../../utils/assertion";
import { composeSlotClassName } from "../../utils/compose";

import { useColorSliderContext } from "./color-slider.context";

const props = defineProps<ColorSliderOutputProps>();

defineSlots<{ default?: () => unknown }>();

const { slider, slots, state } = useColorSliderContext();

// The channel's own formatting, not the raw number: "200°" rather than "200".
const label = computed(() => state.getThumbValueLabel(0));
</script>

<template>
  <output
    v-bind="slider.outputProps.value"
    :class="composeSlotClassName(slots.output, props.class)"
    :data-disabled="dataAttr(state.isDisabled.value)"
    :data-orientation="state.orientation.value"
    data-slot="color-slider-output"
  >
    <slot>{{ label }}</slot>
  </output>
</template>
