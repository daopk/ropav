<script setup lang="ts" vapor>
import type { ProgressCircleTrackProps } from "./progress-circle.types";

import { VIEW_BOX } from "./progress-circle.constants";

const props = defineProps<ProgressCircleTrackProps>();

defineSlots<{ default?: () => unknown }>();
</script>

<template>
  <svg
    :class="['rp-progress-circle__track', props.class]"
    data-slot="progress-circle-track"
    fill="none"
    :viewBox="VIEW_BOX"
  >
    <slot />
  </svg>
</template>
