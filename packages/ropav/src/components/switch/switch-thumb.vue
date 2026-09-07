<script setup lang="ts" vapor>
import type { SwitchThumbProps } from "./switch.types";

const props = defineProps<SwitchThumbProps>();

defineSlots<{ default?: () => unknown }>();
</script>

<template>
  <span :class="['rp-switch__thumb', props.class]" data-slot="switch-thumb">
    <slot />
  </span>
</template>
