<script setup lang="ts" vapor>
import type { ModalFooterProps } from "./modal.types";

import { computed } from "vue";

import { useModalContext } from "./modal.context";

const props = defineProps<ModalFooterProps>();

defineSlots<{ default?: () => unknown }>();

const { slots } = useModalContext();

const styles = computed(() => slots.value.footer({ class: props.class }));
</script>

<template>
  <div :class="styles" data-slot="modal-footer">
    <slot />
  </div>
</template>
