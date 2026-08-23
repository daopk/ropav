<script setup lang="ts" vapor>
import type { ModalHeaderProps } from "./modal.types";

import { computed } from "vue";

import { useModalContext } from "./modal.context";

const props = defineProps<ModalHeaderProps>();

defineSlots<{ default?: () => unknown }>();

const { slots } = useModalContext();

const styles = computed(() => slots.value.header({ class: props.class }));
</script>

<template>
  <div :class="styles" data-slot="modal-header">
    <slot />
  </div>
</template>
