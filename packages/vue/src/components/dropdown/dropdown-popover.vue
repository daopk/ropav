<script setup lang="ts" vapor>
import type {DropdownPopoverProps} from "./dropdown.types";

import {computed} from "vue";

import {OverlayPopover} from "../overlay";

import {useDropdownContext} from "./dropdown.context";

// `isKeyboardDismissDisabled` and `shouldFlip` declare an explicit `undefined` default so an absent
// prop stays absent rather than reading as an explicit `false`.
const props = withDefaults(defineProps<DropdownPopoverProps>(), {
  isKeyboardDismissDisabled: undefined,
  shouldFlip: undefined,
});

defineSlots<{default?: () => unknown}>();

const {slots} = useDropdownContext();

const styles = computed(() => slots.value.popover({class: props.class}));
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
  >
    <slot />
  </OverlayPopover>
</template>
