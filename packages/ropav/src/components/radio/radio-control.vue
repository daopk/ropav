<script setup lang="ts" vapor>
import type { RadioControlProps } from "./radio.types";

const props = defineProps<RadioControlProps>();

defineSlots<{ default?: () => unknown }>();
</script>

<template>
  <span :class="['rp-radio__control', props.class]" data-slot="radio-control">
    <slot />
  </span>
</template>
