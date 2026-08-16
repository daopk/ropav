<script setup lang="ts" vapor>
import type {ProgressCircleTrackCircleProps} from "./progress-circle.types";

import {composeSlotClassName} from "../../utils/compose";

import {useProgressCircleContext} from "./progress-circle.context";

const props = defineProps<ProgressCircleTrackCircleProps>();

const {slots} = useProgressCircleContext();
</script>

<template>
  <circle
    :class="composeSlotClassName(slots.trackCircle, props.class)"
    cx="18"
    cy="18"
    data-slot="progress-circle-track-circle"
    r="16"
    stroke-width="4"
  />
</template>
