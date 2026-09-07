<script setup lang="ts" vapor>
import type { BadgeLabelProps } from "./badge.types";

const props = defineProps<BadgeLabelProps>();

defineSlots<{ default?: () => unknown }>();
</script>

<template>
  <span :class="['rp-badge__label', props.class]" data-slot="badge-label">
    <slot />
  </span>
</template>
