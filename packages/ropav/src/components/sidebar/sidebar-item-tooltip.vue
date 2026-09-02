<script setup lang="ts" vapor>
import type { SidebarItemTooltipProps } from "./sidebar.types";

import { computed } from "vue";

import { composeSlotClassName } from "../../utils/compose";
import TooltipContent from "../tooltip/tooltip-content.vue";
import TooltipRoot from "../tooltip/tooltip-root.vue";
import TooltipTrigger from "../tooltip/tooltip-trigger.vue";

import { useSidebarContext } from "./sidebar.context";

const props = defineProps<SidebarItemTooltipProps>();

defineSlots<{ default?: () => unknown }>();

const { side, slots, state } = useSidebarContext();

/*
 * Only on the rail. Everywhere else the label is on screen already, and a tooltip repeating a word
 * the pointer is sitting next to is noise — in the drawer as much as in the wide layout, which is
 * why this reads `isCollapsed` rather than asking whether the sidebar is open.
 *
 * Disabled rather than left unrendered: the wrapper is what the item is laid out inside, so
 * dropping it on every collapse would tear the item out of the DOM and rebuild it, losing focus
 * and any transition it was part of.
 */
const isDisabled = computed(() => !state.isCollapsed.value);

/*
 * Away from the panel, which for the ordinary left-hand sidebar is the right.
 *
 * `end`/`start` rather than `right`/`left` so a page in Arabic or Hebrew mirrors with everything
 * else: the tooltip belongs on the side the content is, and that side changes with the direction.
 */
const placement = computed(() => (side.value === "left" ? ("end" as const) : ("start" as const)));
</script>

<template>
  <TooltipRoot :close-delay="props.closeDelay" :delay="props.delay" :is-disabled="isDisabled">
    <TooltipTrigger :class="composeSlotClassName(slots.itemTooltip, props.class)">
      <slot />
    </TooltipTrigger>
    <TooltipContent :placement="placement">{{ props.label }}</TooltipContent>
  </TooltipRoot>
</template>
