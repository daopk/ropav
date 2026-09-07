<script setup lang="ts" vapor>
import type { SearchFieldClearButtonProps } from "./search-field.types";

import { normalizeClass } from "vue";

import { CloseButton } from "../close-button";

// The receiver declares `class` as a string prop, so the list is joined here rather than by the
// template compiler, which only does that for a class landing on an element.
const props = defineProps<SearchFieldClearButtonProps>();

defineSlots<{ default?: () => unknown }>();

/**
 * `slot="clear"` is a live CSS contract, not a leftover of React Aria's slot system: the
 * stylesheet strips the trailing radius and padding off the control through
 * `.rp-search-field__group:has([slot="clear"])`, so dropping it changes the geometry in silence.
 *
 * Bound from here rather than written in the template because Vue 2 read a literal `slot`
 * attribute as slot syntax, and the linter still flags either spelling. The vapor compiler
 * passes both straight through to the button — measured in the DOM — so this is only about
 * keeping the contract stated in one place, next to the reason for it.
 */
const clearSlot = { slot: "clear" };
</script>

<template>
  <CloseButton
    :class="normalizeClass(['rp-search-field__clear-button', props.class])"
    data-slot="search-field-clear-button"
    v-bind="clearSlot"
  >
    <slot />
  </CloseButton>
</template>
