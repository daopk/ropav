<script setup lang="ts" vapor>
import type { CheckboxIndicatorProps, CheckboxSlotProps } from "./checkbox.types";

import { computed } from "vue";

import { composeSlotClassName } from "../../utils/compose";

import { useCheckboxContext } from "./checkbox.context";

const props = defineProps<CheckboxIndicatorProps>();

// The mark a caller draws usually depends on the state — a tick that only appears once
// selected, a different glyph while indeterminate — so the slot is handed the field state,
// standing in for React's render-prop children.
defineSlots<{ default?: (props: CheckboxSlotProps) => unknown }>();

const { isDisabled, isIndeterminate, isInvalid, isReadOnly, isRequired, isSelected, slots } =
  useCheckboxContext();

// The tick is drawn by revealing its stroke: the path is 22 long with a 22 dash, so an offset
// of 66 hides it entirely and 44 slides the visible dash into place. The stylesheet animates
// between the two, which is why both states render the same element.
const checkmarkOffset = computed(() => (isSelected.value ? 44 : 66));
</script>

<template>
  <span
    aria-hidden="true"
    :class="composeSlotClassName(slots.indicator, props.class)"
    data-slot="checkbox-indicator"
  >
    <slot
      :is-disabled="isDisabled"
      :is-indeterminate="isIndeterminate"
      :is-invalid="isInvalid"
      :is-read-only="isReadOnly"
      :is-required="isRequired"
      :is-selected="isSelected"
    >
      <svg
        v-if="isIndeterminate"
        aria-hidden="true"
        data-slot="checkbox-default-indicator--indeterminate"
        fill="none"
        role="presentation"
        stroke="currentColor"
        stroke-linecap="round"
        stroke-width="3"
        viewBox="0 0 24 24"
      >
        <line x1="21" x2="3" y1="12" y2="12" />
      </svg>
      <svg
        v-else
        aria-hidden="true"
        data-slot="checkbox-default-indicator--checkmark"
        fill="none"
        role="presentation"
        stroke="currentColor"
        stroke-dasharray="22"
        :stroke-dashoffset="checkmarkOffset"
        stroke-linecap="round"
        stroke-linejoin="round"
        stroke-width="2"
        viewBox="0 0 17 18"
      >
        <polyline points="1 9 7 14 15 4" />
      </svg>
    </slot>
  </span>
</template>
