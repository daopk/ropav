<script setup lang="ts" vapor>
import type {ComboBoxPopoverProps} from "./combo-box.types";

import {computed} from "vue";

import {OverlayPopover, createOverlaySlotContexts, provideOverlaySlotContexts} from "../overlay";
import {provideSurfaceContext} from "../surface";

import {useComboBoxContext} from "./combo-box.context";

// `isKeyboardDismissDisabled` and `shouldFlip` declare an explicit `undefined` default so an absent
// prop stays absent rather than reading as an explicit `false`.
const props = withDefaults(defineProps<ComboBoxPopoverProps>(), {
  isKeyboardDismissDisabled: undefined,
  placement: "bottom",
  shouldFlip: undefined,
});

defineSlots<{default?: () => unknown}>();

const {slots} = useComboBoxContext();

/**
 * Owned here rather than by the overlay itself.
 *
 * The listbox is handed to this component and forwarded through its slot, so it resolves its
 * contexts against this component and not against the overlay that teleports it.
 */
const contexts = createOverlaySlotContexts();

provideOverlaySlotContexts(contexts);

// Matches the React build, which wraps the popover in a default surface.
provideSurfaceContext({variant: computed(() => "default" as const)});

const styles = computed(() => slots.value.popover({class: props.class}));
</script>

<template>
  <OverlayPopover
    :arrow-boundary-offset="props.arrowBoundaryOffset"
    :class="styles"
    :container-padding="props.containerPadding"
    :cross-offset="props.crossOffset"
    data-slot="combo-box-popover"
    :is-keyboard-dismiss-disabled="props.isKeyboardDismissDisabled"
    :offset="props.offset"
    :placement="props.placement"
    :should-flip="props.shouldFlip"
    :slot-contexts="contexts"
  >
    <slot />
  </OverlayPopover>
</template>
