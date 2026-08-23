<script setup lang="ts" vapor>
import type {AlertDialogIconProps} from "./alert-dialog.types";

import {alertDialogVariants} from "@ropav/styles";
import {computed} from "vue";

import {DangerIcon, InfoIcon, SuccessIcon, WarningIcon} from "../icons";

const props = defineProps<AlertDialogIconProps>();

defineSlots<{default?: () => unknown}>();

/**
 * Styled from its own status, not from the dialog's accumulated slots.
 *
 * That is what lets two icons in one dialog carry different meanings — a warning beside a success —
 * each keeping its own colours.
 */
const styles = computed(() =>
  alertDialogVariants({status: props.status}).icon({class: props.class}),
);

/**
 * The glyph that matches the status, used only when the caller supplies none.
 *
 * `accent` and `default` share the informational glyph: the status changes what the icon means to
 * the eye, not what it depicts.
 */
const defaultIcon = computed(() => {
  switch (props.status) {
    case "default":
    case "accent":
      return InfoIcon;
    case "success":
      return SuccessIcon;
    case "warning":
      return WarningIcon;
    default:
      return DangerIcon;
  }
});
</script>

<template>
  <div :class="styles" data-slot="alert-dialog-icon">
    <slot>
      <component :is="defaultIcon" data-slot="alert-dialog-default-icon" />
    </slot>
  </div>
</template>
