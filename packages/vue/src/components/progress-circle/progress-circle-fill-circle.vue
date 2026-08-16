<script setup lang="ts" vapor>
import type {ProgressCircleFillCircleProps} from "./progress-circle.types";

import {computed} from "vue";

import {composeSlotClassName} from "../../utils/compose";

import {useProgressCircleContext} from "./progress-circle.context";

const props = defineProps<ProgressCircleFillCircleProps>();

const {slots, state} = useProgressCircleContext();
const circumference = 2 * Math.PI * 16;
const strokeDashoffset = computed(() =>
  state.isIndeterminate.value
    ? circumference * 0.75
    : circumference - ((state.percentage.value ?? 0) / 100) * circumference,
);
</script>

<template>
  <circle
    :class="composeSlotClassName(slots.fillCircle, props.class)"
    cx="18"
    cy="18"
    data-slot="progress-circle-fill-circle"
    r="16"
    :stroke-dasharray="circumference"
    :stroke-dashoffset="strokeDashoffset"
    stroke-linecap="round"
    stroke-width="4"
    transform="rotate(-90 18 18)"
  />
</template>
