<script setup lang="ts" vapor>
import type { RadioIndicatorProps, RadioSlotProps } from "./radio.types";

import { composeSlotClassName } from "../../utils/compose";

import { useRadioContext } from "./radio.context";

const props = defineProps<RadioIndicatorProps>();

// The mark a caller draws usually depends on the state, so the slot is handed the field
// state, standing in for React's render-prop children.
defineSlots<{ default?: (props: RadioSlotProps) => unknown }>();

const { isDisabled, isInvalid, isReadOnly, isRequired, isSelected, slots } = useRadioContext();
</script>

<template>
  <!--
    No default content: the stylesheet draws the dot with `.rp-radio__indicator:empty::before`,
    so an indicator nobody fills has to stay genuinely empty.
  -->
  <span
    aria-hidden="true"
    :class="composeSlotClassName(slots.indicator, props.class)"
    data-slot="radio-indicator"
  >
    <slot
      :is-disabled="isDisabled"
      :is-invalid="isInvalid"
      :is-read-only="isReadOnly"
      :is-required="isRequired"
      :is-selected="isSelected"
    />
  </span>
</template>
