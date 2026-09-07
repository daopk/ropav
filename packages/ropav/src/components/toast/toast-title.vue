<script setup lang="ts" vapor>
import type { ToastTitleProps } from "./toast.types";

import { useToastItemContext } from "./toast.context";

const props = defineProps<ToastTitleProps>();

defineSlots<{ default?: () => unknown }>();

const { titleAttrs } = useToastItemContext();
</script>

<template>
  <span
    :class="['rp-toast__title', props.class]"
    data-slot="toast-title"
    v-bind="{ ...titleAttrs, slot: 'title' }"
  >
    <slot />
  </span>
</template>
