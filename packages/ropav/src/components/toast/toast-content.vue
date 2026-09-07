<script setup lang="ts" vapor>
import type { ToastContentProps } from "./toast.types";

import { useToastItemContext } from "./toast.context";

const props = defineProps<ToastContentProps>();

defineSlots<{ default?: () => unknown }>();

// The announcement lives here rather than on the toast: the toast is a dialog, and it is the
// content inside that a screen reader reads out when it appears.
const { contentAttrs } = useToastItemContext();
</script>

<template>
  <div :class="['rp-toast__content', props.class]" data-slot="toast-content" v-bind="contentAttrs">
    <slot />
  </div>
</template>
