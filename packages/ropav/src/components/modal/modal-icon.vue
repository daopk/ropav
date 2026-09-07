<script setup lang="ts" vapor>
import type { ModalIconProps } from "./modal.types";

const props = defineProps<ModalIconProps>();

defineSlots<{ default?: () => unknown }>();
</script>

<template>
  <div :class="['rp-modal__icon', props.class]" data-slot="modal-icon">
    <slot />
  </div>
</template>
