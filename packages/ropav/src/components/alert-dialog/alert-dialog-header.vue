<script setup lang="ts" vapor>
import type { AlertDialogHeaderProps } from "./alert-dialog.types";

const props = defineProps<AlertDialogHeaderProps>();

defineSlots<{ default?: () => unknown }>();
</script>

<template>
  <div :class="['rp-alert-dialog__header', props.class]" data-slot="alert-dialog-header">
    <slot />
  </div>
</template>
