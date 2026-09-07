<script setup lang="ts" vapor>
import type { ToastActionButtonProps } from "./toast.types";

import { normalizeClass } from "vue";

import ButtonRoot from "../button/button-root.vue";

// The receiver declares `class` as a string prop, so the list is joined here rather than by the
// template compiler, which only does that for a class landing on an element.
const props = withDefaults(defineProps<ToastActionButtonProps>(), {
  fullWidth: undefined,
  isDisabled: undefined,
  isIconOnly: undefined,
  isPending: undefined,
});

const emit = defineEmits<{ click: [event: MouseEvent] }>();

defineSlots<{ default?: () => unknown }>();
</script>

<template>
  <ButtonRoot
    :class="normalizeClass(['rp-toast__action', props.class])"
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
