<script setup lang="ts" vapor>
import type { AlertDialogBodyProps } from "./alert-dialog.types";

const props = defineProps<AlertDialogBodyProps>();

defineSlots<{ default?: () => unknown }>();
</script>

<template>
  <div :class="['rp-alert-dialog__body', props.class]" data-slot="alert-dialog-body">
    <slot />
  </div>
</template>
