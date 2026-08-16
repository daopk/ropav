<script setup lang="ts" vapor>
import type {ProgressCircleTrackProps} from "./progress-circle.types";

import {composeSlotClassName} from "../../utils/compose";

import {useProgressCircleContext} from "./progress-circle.context";

const props = defineProps<ProgressCircleTrackProps>();

defineSlots<{default?: () => unknown}>();

const {slots} = useProgressCircleContext();
</script>

<template>
  <svg
    :class="composeSlotClassName(slots.track, props.class)"
    data-slot="progress-circle-track"
    fill="none"
    viewBox="0 0 36 36"
  >
    <slot />
  </svg>
</template>
