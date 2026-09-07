<script setup lang="ts" vapor>
import type { ProgressCircleTrackCircleProps } from "./progress-circle.types";

import { CENTER, RADIUS, STROKE_WIDTH } from "./progress-circle.constants";

const props = defineProps<ProgressCircleTrackCircleProps>();
</script>

<template>
  <circle
    :class="['rp-progress-circle__track-circle', props.class]"
    :cx="CENTER"
    :cy="CENTER"
    data-slot="progress-circle-track-circle"
    :r="RADIUS"
    :stroke-width="STROKE_WIDTH"
  />
</template>
