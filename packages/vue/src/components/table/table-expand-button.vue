<script setup lang="ts" vapor>
import type {TableExpandButtonProps} from "./table.types";

import {computed} from "vue";

import {useTableRowContext} from "./table.context";

const props = defineProps<TableExpandButtonProps>();

defineSlots<{default?: (props: {isExpanded: boolean}) => unknown}>();

const {ariaLabelledBy, isDisabled, isExpanded, toggle} = useTableRowContext();

// React Aria's own en-US strings, and the label flips with the state so it says what the press
// will do rather than what the row currently is.
const ariaLabel = computed(() => props.ariaLabel ?? (isExpanded.value ? "Collapse" : "Expand"));

/**
 * Kept out of the tab order on purpose, matching react-aria's `excludeFromTabOrder` on the same
 * button: the row already answers the arrow keys, so a second tab stop per row would make walking
 * a tree with the keyboard far slower than it needs to be.
 */
const onClick = (event: MouseEvent) => {
  // The row would otherwise treat the same click as a selection.
  event.stopPropagation();
  if (!isDisabled.value) toggle();
};

// Focus stays where it was: react-aria passes `preventFocusOnPress`, so pressing the chevron
// never moves the caret off the row it belongs to.
const onPointerdown = (event: PointerEvent) => event.preventDefault();
</script>

<template>
  <button
    :aria-label="ariaLabel"
    :aria-labelledby="ariaLabelledBy || undefined"
    :class="props.class"
    :data-expanded="isExpanded || undefined"
    data-slot="table-expand-button"
    :disabled="isDisabled || undefined"
    :tabindex="-1"
    type="button"
    @click="onClick"
    @pointerdown="onPointerdown"
  >
    <slot :is-expanded="isExpanded" />
  </button>
</template>
