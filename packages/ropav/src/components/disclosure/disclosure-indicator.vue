<script setup lang="ts" vapor>
import type { DisclosureIndicatorProps } from "./disclosure.types";

import { computed } from "vue";

import { dataAttr } from "../../utils/assertion";
import { composeSlotClassName } from "../../utils/compose";
import { IconChevronDown } from "../icons";

import { useDisclosureContext } from "./disclosure.context";

const props = defineProps<DisclosureIndicatorProps>();

const iconSlots = defineSlots<{ default?: () => unknown }>();

const { isExpanded, slots } = useDisclosureContext();

/**
 * With no icon of its own to render, the built-in chevron carries the class and the state
 * directly, exactly as the React implementation does. That matters inside a button, where the
 * stylesheet reaches icons through an `svg` selector: a wrapper element would not match it, and
 * the trigger would lay out 4px wider than the same markup in React.
 *
 * A custom icon does need a wrapper. Reading a slot in Vapor renders it, so the icon cannot be
 * inspected and given the class the way React clones it into place; the wrapper carries the
 * class and the state instead, and the icon inside sets its own size.
 */
const hasCustomIcon = iconSlots.default !== undefined;

const className = computed(() => composeSlotClassName(slots.value.indicator, props.class));
</script>

<template>
  <span
    v-if="hasCustomIcon"
    :class="className"
    :data-expanded="dataAttr(isExpanded)"
    data-slot="disclosure-indicator"
  >
    <slot />
  </span>
  <IconChevronDown
    v-else
    :class="className"
    :data-expanded="dataAttr(isExpanded)"
    data-slot="disclosure-indicator"
  />
</template>
