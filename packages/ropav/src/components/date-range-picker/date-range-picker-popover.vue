<script setup lang="ts" vapor>
import type {DateRangePickerPopoverProps} from "./date-range-picker.types";

import {computed} from "vue";

import {OverlayPopover, createOverlaySlotContexts, provideOverlaySlotContexts} from "../overlay";
import {provideSurfaceContext} from "../surface";

import {useDateRangePickerContext} from "./date-range-picker.context";

// `shouldFlip` and `isKeyboardDismissDisabled` declare an explicit `undefined` default so an absent
// prop stays absent rather than reading as an explicit `false`.
const props = withDefaults(defineProps<DateRangePickerPopoverProps>(), {
  isKeyboardDismissDisabled: undefined,
  placement: "bottom",
  shouldFlip: undefined,
});

defineSlots<{default?: () => unknown}>();

const picker = useDateRangePickerContext();

/**
 * Owned here rather than by the overlay itself.
 *
 * The calendar is handed to this component and forwarded through its slot, so it resolves its
 * contexts against this component and not against the overlay that teleports it.
 */
const contexts = createOverlaySlotContexts();

provideOverlaySlotContexts(contexts);

// The calendar inside sits on an overlay rather than on the page, and picks its own colours from
// that: same as React, which wraps the popover in a default surface.
provideSurfaceContext({variant: computed(() => "default" as const)});

const styles = computed(() => picker.slots.value.popover({class: props.class}));
</script>

<template>
  <OverlayPopover
    :class="styles"
    :container-padding="props.containerPadding"
    :cross-offset="props.crossOffset"
    data-slot="date-range-picker-popover"
    :is-keyboard-dismiss-disabled="props.isKeyboardDismissDisabled"
    :offset="props.offset"
    :placement="props.placement"
    :should-flip="props.shouldFlip"
    :slot-contexts="contexts"
  >
    <slot />
  </OverlayPopover>
</template>
