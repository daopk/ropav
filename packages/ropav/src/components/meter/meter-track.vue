<script setup lang="ts" vapor>
import type { MeterTrackProps } from "./meter.types";

const props = defineProps<MeterTrackProps>();

defineSlots<{ default?: () => unknown }>();
</script>

<template>
  <div :class="['rp-meter__track', props.class]" data-slot="meter-track">
    <slot />
  </div>
</template>
