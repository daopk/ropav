<script setup lang="ts" vapor>
import type { ToastIndicatorProps } from "./toast.types";

import { computed } from "vue";

import { dataAttr } from "../../utils/assertion";
import { DangerIcon, InfoIcon, SuccessIcon, WarningIcon } from "../icons";

import { useToastItemContext } from "./toast.context";

const props = defineProps<ToastIndicatorProps>();

defineSlots<{ default?: () => unknown }>();

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
  <div
    :class="['rp-toast__indicator', props.class]"
    :data-swapped="dataAttr(props.isSwapped)"
    data-slot="toast-indicator"
  >
    <slot>
      <component :is="defaultIcon" data-slot="toast-default-icon" />
    </slot>
  </div>
</template>
