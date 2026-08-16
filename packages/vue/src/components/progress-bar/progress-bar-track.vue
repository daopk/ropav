<script setup lang="ts" vapor>
import type {ProgressBarTrackProps} from "./progress-bar.types";

import {composeSlotClassName} from "../../utils/compose";

import {useProgressBarContext} from "./progress-bar.context";

const props = defineProps<ProgressBarTrackProps>();

defineSlots<{default?: () => unknown}>();

const {slots} = useProgressBarContext();
</script>

<template>
  <div :class="composeSlotClassName(slots.track, props.class)" data-slot="progress-bar-track">
    <slot />
  </div>
</template>
