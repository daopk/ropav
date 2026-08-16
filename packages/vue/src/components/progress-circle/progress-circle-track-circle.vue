<script setup lang="ts" vapor>
import type {ProgressCircleTrackCircleProps} from "./progress-circle.types";

import {composeSlotClassName} from "../../utils/compose";

import {CENTER, RADIUS, STROKE_WIDTH} from "./progress-circle.constants";
import {useProgressCircleContext} from "./progress-circle.context";

const props = defineProps<ProgressCircleTrackCircleProps>();

const {slots} = useProgressCircleContext();
</script>

<template>
  <circle
    :class="composeSlotClassName(slots.trackCircle, props.class)"
    :cx="CENTER"
    :cy="CENTER"
    data-slot="progress-circle-track-circle"
    :r="RADIUS"
    :stroke-width="STROKE_WIDTH"
  />
</template>
