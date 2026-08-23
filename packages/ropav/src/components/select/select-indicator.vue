<script setup lang="ts" vapor>
import type {SelectIndicatorProps} from "./select.types";

import {computed, useSlots} from "vue";

import {dataAttr} from "../../utils/assertion";
import {composeSlotClassName} from "../../utils/compose";
import {IconChevronDown} from "../icons";

import {useSelectContext} from "./select.context";

const props = defineProps<SelectIndicatorProps>();

defineSlots<{default?: () => unknown}>();

const {slots, state} = useSelectContext();

const callerSlots = useSlots();

/**
 * Which `data-slot` this carries, which the stylesheet reads: only the built-in chevron is given
 * a size, since a glyph of its own brings one.
 *
 * Read off whether a slot was handed over at all, never by running it: presence is knowable in
 * vapor, contents are not. Branching on it also keeps the built-in icon out of `<slot>` fallback
 * content, which drops the slots of components a VDOM host nests inside.
 */
const hasSlot = computed(() => Boolean(callerSlots["default"]));

const dataSlot = computed(() => (hasSlot.value ? "select-indicator" : "select-default-indicator"));

// Resolved here rather than in the template: a template unwraps the ref, and one of the slots is
// itself named `value`, so `slots.value` in a template reads that slot instead of the ref.
const styles = computed(() => composeSlotClassName(slots.value.indicator, props.class));
</script>

<template>
  <!--
    The class and `data-open` sit on this wrapper rather than on the icon itself. Reading a slot
    in vapor renders it, so the icon cannot be inspected and cloned the way the React build does;
    a custom icon arrives as slot content instead and sizes itself.
  -->
  <span :class="styles" :data-open="dataAttr(state.isOpen.value)" :data-slot="dataSlot">
    <slot v-if="hasSlot" />
    <IconChevronDown v-else />
  </span>
</template>
