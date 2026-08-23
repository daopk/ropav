<script setup lang="ts" vapor>
import type { ColorPickerPopoverProps } from "./color-picker.types";

import { computed } from "vue";

import { OverlayPopover, createOverlaySlotContexts, provideOverlaySlotContexts } from "../overlay";
import { provideSurfaceContext } from "../surface";

import { useColorPickerContext } from "./color-picker.context";

// `shouldFlip` and `isKeyboardDismissDisabled` declare an explicit `undefined` default so an absent
// prop stays absent rather than reading as an explicit `false`.
const props = withDefaults(defineProps<ColorPickerPopoverProps>(), {
  isKeyboardDismissDisabled: undefined,
  placement: "bottom left",
  shouldFlip: undefined,
});

defineSlots<{ default?: () => unknown }>();

const { slots } = useColorPickerContext();

/**
 * Owned here rather than by the overlay itself.
 *
 * The colour components are handed to this component and forwarded through its slot, so they
 * resolve their contexts against this component and not against the overlay that teleports them.
 */
const contexts = createOverlaySlotContexts();

provideOverlaySlotContexts(contexts);

// Everything inside sits on an overlay rather than on the page and picks its colours from that:
// same as React, which wraps the popover in a default surface.
provideSurfaceContext({ variant: computed(() => "default" as const) });

const styles = computed(() => slots.value.popover({ class: props.class }));
</script>

<template>
  <OverlayPopover
    :class="styles"
    :container-padding="props.containerPadding"
    :cross-offset="props.crossOffset"
    data-slot="color-picker-popover"
    :is-keyboard-dismiss-disabled="props.isKeyboardDismissDisabled"
    :offset="props.offset"
    :placement="props.placement"
    :should-flip="props.shouldFlip"
    :slot-contexts="contexts"
  >
    <slot />
  </OverlayPopover>
</template>
