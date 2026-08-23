<script setup lang="ts" vapor>
import type { AlertIndicatorProps } from "./alert.types";

import { computed, useSlots } from "vue";

import { composeSlotClassName } from "../../utils/compose";
import { DangerIcon, InfoIcon, SuccessIcon, WarningIcon } from "../icons";

import { useAlertContext } from "./alert.context";

const props = defineProps<AlertIndicatorProps>();

defineSlots<{ default?: () => unknown }>();

const { slots, status } = useAlertContext();

const callerSlots = useSlots();

/**
 * Whether content was handed over at all, read off the presence of the slot rather than by
 * running it — presence is knowable in vapor, contents are not.
 *
 * The branch is what keeps parity with React's `{children ?? getDefaultIcon()}`: `<slot>` fallback
 * content runs whenever the slot renders nothing, so a caller who declares the slot and returns
 * nothing — `[]`, or a condition that is false — would get the built-in icon here while React
 * renders empty. Same reason as `Select.Indicator`, and it also keeps the icon out of fallback
 * content, which drops the slots of components a VDOM host nests inside.
 */
const hasSlot = computed(() => Boolean(callerSlots["default"]));

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
    <slot v-if="hasSlot" />
    <component :is="defaultIcon" v-else data-slot="alert-default-icon" />
  </div>
</template>
