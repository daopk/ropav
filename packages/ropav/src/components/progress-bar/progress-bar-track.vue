<script setup lang="ts" vapor>
import type { ProgressBarTrackProps } from "./progress-bar.types";

const props = defineProps<ProgressBarTrackProps>();

defineSlots<{ default?: () => unknown }>();
</script>

<template>
  <div :class="['rp-progress-bar__track', props.class]" data-slot="progress-bar-track">
    <slot />
  </div>
</template>
