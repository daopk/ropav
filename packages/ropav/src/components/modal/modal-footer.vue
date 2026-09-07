<script setup lang="ts" vapor>
import type { ModalFooterProps } from "./modal.types";

const props = defineProps<ModalFooterProps>();

defineSlots<{ default?: () => unknown }>();
</script>

<template>
  <div :class="['rp-modal__footer', props.class]" data-slot="modal-footer">
    <slot />
  </div>
</template>
