<script setup lang="ts" vapor>
import type { DropdownPopoverProps } from "./dropdown.types";

import { computed } from "vue";

import { OverlayPopover, createOverlaySlotContexts, provideOverlaySlotContexts } from "../overlay";

import { useDropdownContext } from "./dropdown.context";

// `isKeyboardDismissDisabled` and `shouldFlip` declare an explicit `undefined` default so an absent
// prop stays absent rather than reading as an explicit `false`.
const props = withDefaults(defineProps<DropdownPopoverProps>(), {
  isKeyboardDismissDisabled: undefined,
  shouldFlip: undefined,
});

defineSlots<{ default?: () => unknown }>();

const { slots } = useDropdownContext();

/**
 * Owned here rather than by the overlay itself.
 *
 * The menu is handed to this component and forwarded through its slot, so it resolves its contexts
 * against this component and not against the overlay that teleports it. Clearing the trigger's
 * press is the part that matters for a menu: without it a button in the popover would toggle the
 * dropdown and claim the trigger's identity.
 */
const contexts = createOverlaySlotContexts();

provideOverlaySlotContexts(contexts);

const styles = computed(() => slots.value.popover({ class: props.class }));
</script>

<template>
  <OverlayPopover
    :arrow-boundary-offset="props.arrowBoundaryOffset"
    :class="styles"
    :container-padding="props.containerPadding"
    :cross-offset="props.crossOffset"
    data-slot="dropdown-popover"
    :is-keyboard-dismiss-disabled="props.isKeyboardDismissDisabled"
    :offset="props.offset"
    :placement="props.placement"
    :should-flip="props.shouldFlip"
    :slot-contexts="contexts"
  >
    <slot />
  </OverlayPopover>
</template>
