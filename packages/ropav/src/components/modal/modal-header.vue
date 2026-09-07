<script setup lang="ts" vapor>
import type { ModalHeaderProps } from "./modal.types";

const props = defineProps<ModalHeaderProps>();

defineSlots<{ default?: () => unknown }>();
</script>

<template>
  <div :class="['rp-modal__header', props.class]" data-slot="modal-header">
    <slot />
  </div>
</template>
