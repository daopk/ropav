<script setup lang="ts" vapor>
import type { ProgressCircleFillCircleProps } from "./progress-circle.types";

import { computed } from "vue";

import { composeSlotClassName } from "../../utils/compose";

import { CENTER, CIRCUMFERENCE, RADIUS, ROTATION, STROKE_WIDTH } from "./progress-circle.constants";
import { useProgressCircleContext } from "./progress-circle.context";

const props = defineProps<ProgressCircleFillCircleProps>();

const { slots, state } = useProgressCircleContext();
const strokeDashoffset = computed(() =>
  state.isIndeterminate.value
    ? CIRCUMFERENCE * 0.75
    : CIRCUMFERENCE - ((state.percentage.value ?? 0) / 100) * CIRCUMFERENCE,
);
</script>

<template>
  <circle
    :class="composeSlotClassName(slots.fillCircle, props.class)"
    :cx="CENTER"
    :cy="CENTER"
    data-slot="progress-circle-fill-circle"
    :r="RADIUS"
    :stroke-dasharray="CIRCUMFERENCE"
    :stroke-dashoffset="strokeDashoffset"
    stroke-linecap="round"
    :stroke-width="STROKE_WIDTH"
    :transform="ROTATION"
  />
</template>
