<script setup lang="ts" vapor>
import type { PopoverContentProps } from "./popover.types";

import { normalizeClass } from "vue";

import { OverlayPopover, createOverlaySlotContexts, provideOverlaySlotContexts } from "../overlay";

// The three-state booleans declare an explicit `undefined` default so an absent prop stays absent
// rather than reading as an explicit `false`.
// The receiver declares `class` as a string prop, so the list is joined here rather than by the
// template compiler, which only does that for a class landing on an element.
const props = withDefaults(defineProps<PopoverContentProps>(), {
  isEntering: undefined,
  isExiting: undefined,
  isKeyboardDismissDisabled: undefined,
  isNonModal: undefined,
  shouldCloseOnInteractOutside: undefined,
  shouldFlip: undefined,
});

defineSlots<{ default?: () => unknown }>();

/**
 * Owned here rather than by the overlay itself.
 *
 * The overlay renders its content into a teleport, and a `provide` made there does not reach
 * content handed in from outside and forwarded through this component's slot — so the dialog and
 * the arrow would find nothing, and a button in the content would still inherit the trigger's
 * press. Provided from here, where the content is a direct descendant, it holds.
 */
const contexts = createOverlaySlotContexts();

provideOverlaySlotContexts(contexts);
</script>

<template>
  <OverlayPopover
    :arrow-boundary-offset="props.arrowBoundaryOffset"
    :class="normalizeClass(['rp-popover', props.class])"
    :container-padding="props.containerPadding"
    :cross-offset="props.crossOffset"
    :is-entering="props.isEntering"
    :is-exiting="props.isExiting"
    :is-keyboard-dismiss-disabled="props.isKeyboardDismissDisabled"
    :is-non-modal="props.isNonModal"
    :offset="props.offset"
    :placement="props.placement"
    :should-close-on-interact-outside="props.shouldCloseOnInteractOutside"
    :should-flip="props.shouldFlip"
    :slot-contexts="contexts"
  >
    <slot />
  </OverlayPopover>
</template>
