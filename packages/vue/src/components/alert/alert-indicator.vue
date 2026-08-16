<script setup lang="ts" vapor>
import type {AlertIndicatorProps} from "./alert.types";

import {computed} from "vue";

import {composeSlotClassName} from "../../utils/compose";
import {DangerIcon, InfoIcon, SuccessIcon, WarningIcon} from "../icons";

import {useAlertContext} from "./alert.context";

const props = defineProps<AlertIndicatorProps>();

defineSlots<{default?: () => unknown}>();

const {slots, status} = useAlertContext();

// `default` and `accent` are both informational; the status changes their colour, not the glyph.
const defaultIcon = computed(() => {
  switch (status.value) {
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
  <div :class="composeSlotClassName(slots.indicator, props.class)" data-slot="alert-indicator">
    <slot>
      <component :is="defaultIcon" data-slot="alert-default-icon" />
    </slot>
  </div>
</template>
