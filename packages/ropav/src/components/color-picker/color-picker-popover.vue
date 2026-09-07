<script setup lang="ts" vapor>
import type { ColorPickerPopoverProps } from "./color-picker.types";

import { computed, normalizeClass } from "vue";

import { OverlayPopover, createOverlaySlotContexts, provideOverlaySlotContexts } from "../overlay";
import { provideSurfaceContext } from "../surface";

// `shouldFlip` and `isKeyboardDismissDisabled` declare an explicit `undefined` default so an absent
// prop stays absent rather than reading as an explicit `false`.
// The receiver declares `class` as a string prop, so the list is joined here rather than by the
// template compiler, which only does that for a class landing on an element.
const props = withDefaults(defineProps<ColorPickerPopoverProps>(), {
  isKeyboardDismissDisabled: undefined,
  placement: "bottom left",
  shouldFlip: undefined,
});

defineSlots<{ default?: () => unknown }>();

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
</script>

<template>
  <OverlayPopover
    :class="normalizeClass(['rp-color-picker__popover', props.class])"
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
