<script setup lang="ts" vapor>
import type { AlertDescriptionProps } from "./alert.types";

const props = defineProps<AlertDescriptionProps>();

defineSlots<{ default?: () => unknown }>();
</script>

<template>
  <span :class="['rp-alert__description', props.class]" data-slot="alert-description">
    <slot />
  </span>
</template>
