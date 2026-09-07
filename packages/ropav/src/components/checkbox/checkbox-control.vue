<script setup lang="ts" vapor>
import type { CheckboxControlProps } from "./checkbox.types";

const props = defineProps<CheckboxControlProps>();

defineSlots<{ default?: () => unknown }>();
</script>

<template>
  <span :class="['rp-checkbox__control', props.class]" data-slot="checkbox-control">
    <slot />
  </span>
</template>
