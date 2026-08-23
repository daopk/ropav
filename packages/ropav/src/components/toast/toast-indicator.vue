<script setup lang="ts" vapor>
import type {ToastIndicatorProps} from "./toast.types";

import {computed} from "vue";

import {composeSlotClassName} from "../../utils/compose";
import {DangerIcon, InfoIcon, SuccessIcon, WarningIcon} from "../icons";

import {useToastItemContext, useToastRegionContext} from "./toast.context";

const props = defineProps<ToastIndicatorProps>();

defineSlots<{default?: () => unknown}>();

const {slots} = useToastRegionContext();
const item = useToastItemContext();

const variant = computed(() => props.variant ?? item.variant.value);

// `default` and `accent` are both informational; the variant changes the colour, not the glyph.
const defaultIcon = computed(() => {
  switch (variant.value) {
    case "success":
      return SuccessIcon;
    case "warning":
      return WarningIcon;
    case "danger":
      return DangerIcon;
    default:
      return InfoIcon;
  }
});
</script>

<template>
  <div :class="composeSlotClassName(slots.indicator, props.class)" data-slot="toast-indicator">
    <slot>
      <component :is="defaultIcon" data-slot="toast-default-icon" />
    </slot>
  </div>
</template>
