<script setup lang="ts" vapor>
import type { AutocompletePopoverProps } from "./autocomplete.types";

import { computed } from "vue";

import { OverlayPopover, createOverlaySlotContexts, provideOverlaySlotContexts } from "../overlay";

import { useAutocompleteContext } from "./autocomplete.context";

// `isKeyboardDismissDisabled` and `shouldFlip` declare an explicit `undefined` default so an
// absent prop stays absent rather than reading as an explicit `false`.
const props = withDefaults(defineProps<AutocompletePopoverProps>(), {
  isKeyboardDismissDisabled: undefined,
  placement: "bottom",
  shouldFlip: undefined,
});

defineSlots<{ default?: () => unknown }>();

const { slots } = useAutocompleteContext();

/**
 * Owned here rather than by the overlay itself.
 *
 * The search field and the listbox are handed to this component and forwarded through its slot, so
 * they resolve their contexts against this component and not against the overlay that teleports
 * them.
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
    data-slot="autocomplete-popover"
    :is-keyboard-dismiss-disabled="props.isKeyboardDismissDisabled"
    :offset="props.offset"
    :placement="props.placement"
    :should-flip="props.shouldFlip"
    :slot-contexts="contexts"
  >
    <slot />
  </OverlayPopover>
</template>
