<script setup lang="ts" vapor>
import type { ModalBodyProps } from "./modal.types";

import { computed } from "vue";

import { useModalContext } from "./modal.context";

const props = defineProps<ModalBodyProps>();

defineSlots<{ default?: () => unknown }>();

const { slots } = useModalContext();

const styles = computed(() => slots.value.body({ class: props.class }));
</script>

<template>
  <div :class="styles" data-slot="modal-body">
    <slot />
  </div>
</template>
