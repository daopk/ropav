<script setup lang="ts" vapor>
import type { AlertDialogFooterProps } from "./alert-dialog.types";

import { computed } from "vue";

import { useAlertDialogContext } from "./alert-dialog.context";

const props = defineProps<AlertDialogFooterProps>();

defineSlots<{ default?: () => unknown }>();

const { slots } = useAlertDialogContext();

const styles = computed(() => slots.value.footer({ class: props.class }));
</script>

<template>
  <div :class="styles" data-slot="alert-dialog-footer">
    <slot />
  </div>
</template>
