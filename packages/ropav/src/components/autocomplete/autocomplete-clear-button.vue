<script setup lang="ts" vapor>
import type {AutocompleteClearButtonProps} from "./autocomplete.types";

import {computed} from "vue";

import {dataAttr} from "../../utils/assertion";
import {IconClose} from "../icons";

import {useAutocompleteContext} from "./autocomplete.context";

const props = defineProps<AutocompleteClearButtonProps>();

const {isDisabled, onClear, setClearButtonElement, slots, state} = useAutocompleteContext();

const styles = computed(() => slots.value.clearButton({class: props.class}));

/**
 * Whether there is nothing to clear, which is what the stylesheet fades the button out on.
 *
 * It stays in the DOM either way: a button that appeared and disappeared would reflow the field
 * every time a choice was made or undone.
 */
const isEmpty = computed(() => state.selection.selectedKeys.value.size === 0);

// The trigger around this reads the element to tell a press here from a press on itself, which is
// what keeps clearing the selection from also reopening the popover.
const setElement = (element: unknown) => {
  setClearButtonElement((element as HTMLElement | null) ?? null);
};

/** Empties the selection, and only the selection — the text that was typed is left alone. */
const onClick = () => {
  state.selection.clearSelection();
  onClear();
};
</script>

<template>
  <button
    :ref="setElement"
    :aria-hidden="isEmpty || undefined"
    aria-label="Clear selection"
    :class="styles"
    :data-empty="dataAttr(isEmpty)"
    data-slot="autocomplete-clear-button"
    :disabled="isDisabled"
    tabindex="-1"
    type="button"
    @click="onClick"
  >
    <IconClose data-slot="autocomplete-clear-button-icon" />
  </button>
</template>
