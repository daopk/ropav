<script setup lang="ts" vapor>
import type {PopoverContentProps} from "./popover.types";

import {computed} from "vue";

import {
  OverlayPopover,
  createOverlaySlotContexts,
  provideOverlayArrowContext,
  provideOverlayScopeContext,
} from "../overlay";

import {usePopoverContext} from "./popover.context";

// The three-state booleans declare an explicit `undefined` default so an absent prop stays absent
// rather than reading as an explicit `false`.
const props = withDefaults(defineProps<PopoverContentProps>(), {
  isEntering: undefined,
  isExiting: undefined,
  isKeyboardDismissDisabled: undefined,
  isNonModal: undefined,
  shouldCloseOnInteractOutside: undefined,
  shouldFlip: undefined,
});

defineSlots<{default?: () => unknown}>();

const {slots} = usePopoverContext();

/**
 * Owned here rather than by the overlay itself.
 *
 * The overlay renders its content into a teleport, and a `provide` made there does not reach
 * content handed in from outside and forwarded through this component's slot — so the dialog and
 * the arrow would find nothing. Provided from here, where they are direct descendants, it holds.
 */
const contexts = createOverlaySlotContexts();

provideOverlayArrowContext(contexts.arrow);
provideOverlayScopeContext(contexts.scope);

const styles = computed(() => slots.value.base({class: props.class}));
</script>

<template>
  <OverlayPopover
    :arrow-boundary-offset="props.arrowBoundaryOffset"
    :class="styles"
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
