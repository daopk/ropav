<script setup lang="ts" vapor>
import type { AlertTitleProps } from "./alert.types";

const props = defineProps<AlertTitleProps>();

defineSlots<{ default?: () => unknown }>();
</script>

<template>
  <p :class="['rp-alert__title', props.class]" data-slot="alert-title">
    <slot />
  </p>
</template>
