<script setup lang="ts" vapor>
import type { AlertDialogHeaderProps } from "./alert-dialog.types";

import { computed } from "vue";

import { useAlertDialogContext } from "./alert-dialog.context";

const props = defineProps<AlertDialogHeaderProps>();

defineSlots<{ default?: () => unknown }>();

const { slots } = useAlertDialogContext();

const styles = computed(() => slots.value.header({ class: props.class }));
</script>

<template>
  <div :class="styles" data-slot="alert-dialog-header">
    <slot />
  </div>
</template>
