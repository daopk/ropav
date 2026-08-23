<script setup lang="ts" vapor>
import type { ToastContentProps } from "./toast.types";

import { composeSlotClassName } from "../../utils/compose";

import { useToastItemContext, useToastRegionContext } from "./toast.context";

const props = defineProps<ToastContentProps>();

defineSlots<{ default?: () => unknown }>();

const { slots } = useToastRegionContext();

// The announcement lives here rather than on the toast: the toast is a dialog, and it is the
// content inside that a screen reader reads out when it appears.
const { contentAttrs } = useToastItemContext();
</script>

<template>
  <div
    :class="composeSlotClassName(slots.content, props.class)"
    data-slot="toast-content"
    v-bind="contentAttrs"
  >
    <slot />
  </div>
</template>
