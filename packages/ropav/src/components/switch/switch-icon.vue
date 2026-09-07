<script setup lang="ts" vapor>
import type { SwitchIconProps } from "./switch.types";

const props = defineProps<SwitchIconProps>();

defineSlots<{ default?: () => unknown }>();
</script>

<template>
  <span :class="['rp-switch__icon', props.class]" data-slot="switch-icon">
    <slot />
  </span>
</template>
