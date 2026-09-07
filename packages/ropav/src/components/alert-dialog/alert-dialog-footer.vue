<script setup lang="ts" vapor>
import type { AlertDialogFooterProps } from "./alert-dialog.types";

const props = defineProps<AlertDialogFooterProps>();

defineSlots<{ default?: () => unknown }>();
</script>

<template>
  <div :class="['rp-alert-dialog__footer', props.class]" data-slot="alert-dialog-footer">
    <slot />
  </div>
</template>
