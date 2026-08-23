<script setup lang="ts" vapor>
import type { AlertDialogBodyProps } from "./alert-dialog.types";

import { computed } from "vue";

import { useAlertDialogContext } from "./alert-dialog.context";

const props = defineProps<AlertDialogBodyProps>();

defineSlots<{ default?: () => unknown }>();

const { slots } = useAlertDialogContext();

const styles = computed(() => slots.value.body({ class: props.class }));
</script>

<template>
  <div :class="styles" data-slot="alert-dialog-body">
    <slot />
  </div>
</template>
