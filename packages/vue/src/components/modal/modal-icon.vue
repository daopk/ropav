<script setup lang="ts" vapor>
import type {ModalIconProps} from "./modal.types";

import {computed} from "vue";

import {useModalContext} from "./modal.context";

const props = defineProps<ModalIconProps>();

defineSlots<{default?: () => unknown}>();

const {slots} = useModalContext();

const styles = computed(() => slots.value.icon({class: props.class}));
</script>

<template>
  <div :class="styles" data-slot="modal-icon">
    <slot />
  </div>
</template>
