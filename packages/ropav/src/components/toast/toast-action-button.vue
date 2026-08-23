<script setup lang="ts" vapor>
import type { ToastActionButtonProps } from "./toast.types";

import { computed } from "vue";

import ButtonRoot from "../button/button-root.vue";

import { useToastRegionContext } from "./toast.context";

const props = withDefaults(defineProps<ToastActionButtonProps>(), {
  fullWidth: undefined,
  isDisabled: undefined,
  isIconOnly: undefined,
  isPending: undefined,
});

const emit = defineEmits<{ click: [event: MouseEvent] }>();

defineSlots<{ default?: () => unknown }>();

const { slots } = useToastRegionContext();

const styles = computed(() => slots.value.action({ class: props.class }));
</script>

<template>
  <ButtonRoot
    :class="styles"
    data-slot="toast-action-button"
    :full-width="props.fullWidth"
    :is-disabled="props.isDisabled"
    :is-icon-only="props.isIconOnly"
    :is-pending="props.isPending"
    :size="props.size"
    :type="props.type"
    :variant="props.variant"
    @click="emit('click', $event)"
  >
    <slot />
  </ButtonRoot>
</template>
