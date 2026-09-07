<script setup lang="ts" vapor>
import type { ChipLabelProps } from "./chip.types";

const props = defineProps<ChipLabelProps>();

defineSlots<{ default?: () => unknown }>();
</script>

<template>
  <span :class="['rp-chip__label', props.class]" data-slot="chip-label">
    <slot />
  </span>
</template>
