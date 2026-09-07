<script setup lang="ts" vapor>
import type { SwitchControlProps } from "./switch.types";

const props = defineProps<SwitchControlProps>();

defineSlots<{ default?: () => unknown }>();
</script>

<template>
  <span :class="['rp-switch__control', props.class]" data-slot="switch-control">
    <slot />
  </span>
</template>
