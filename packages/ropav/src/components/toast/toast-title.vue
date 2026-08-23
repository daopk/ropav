<script setup lang="ts" vapor>
import type { ToastTitleProps } from "./toast.types";

import { composeSlotClassName } from "../../utils/compose";

import { useToastItemContext, useToastRegionContext } from "./toast.context";

const props = defineProps<ToastTitleProps>();

defineSlots<{ default?: () => unknown }>();

const { slots } = useToastRegionContext();
const { titleAttrs } = useToastItemContext();
</script>

<template>
  <span
    :class="composeSlotClassName(slots.title, props.class)"
    data-slot="toast-title"
    v-bind="{ ...titleAttrs, slot: 'title' }"
  >
    <slot />
  </span>
</template>
