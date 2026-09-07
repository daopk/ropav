<script setup lang="ts" vapor>
import type { AlertContentProps } from "./alert.types";

const props = defineProps<AlertContentProps>();

defineSlots<{ default?: () => unknown }>();
</script>

<template>
  <div :class="['rp-alert__content', props.class]" data-slot="alert-content">
    <slot />
  </div>
</template>
