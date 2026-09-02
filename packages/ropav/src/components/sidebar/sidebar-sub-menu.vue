<script setup lang="ts" vapor>
import type { SidebarSubMenuProps } from "./sidebar.types";

import { computed } from "vue";

import { useDisclosurePanel } from "../../composables/use-disclosure-panel";
import { dataAttr } from "../../utils/assertion";
import { composeSlotClassName } from "../../utils/compose";

import {
  provideSidebarSubMenuContext,
  useSidebarCollapsibleContext,
  useSidebarContext,
} from "./sidebar.context";

const props = defineProps<SidebarSubMenuProps>();

defineSlots<{ default?: (props: { isExpanded: boolean }) => unknown }>();

const { slots, state } = useSidebarContext();
const collapsible = useSidebarCollapsibleContext();

// Carried down rather than asked of every row: a child knows it is a child by where it was written,
// and a prop on each one is a thing to forget on the tenth.
provideSidebarSubMenuContext(true);

/*
 * Owns the height variable the stylesheet animates and the `hidden` attribute that keeps a shut
 * submenu out of the tab order. `hidden="until-found"` rather than plain `hidden`, so find-in-page
 * can still reveal a collapsed row — the composable's doing, and the reason to reuse it rather than
 * write a second collapse here.
 */
const { setPanelElement } = useDisclosurePanel({ isExpanded: collapsible.isExpanded });

const className = computed(() =>
  composeSlotClassName(slots.value.subMenu, props.class, { isCollapsible: true }),
);
</script>

<template>
  <!-- Gone entirely on the rail rather than merely shut. A child row carries no icon, so at 56px it
    would be a nameless blank; and the trigger stops claiming to control anything there, which is
    the other half of the same decision. -->
  <div
    v-if="!state.isCollapsed.value"
    :id="collapsible.subMenuId.value"
    :ref="setPanelElement"
    :aria-label="props.ariaLabel"
    :aria-labelledby="props.ariaLabel ? undefined : collapsible.triggerId.value"
    :class="className"
    :data-expanded="dataAttr(collapsible.isExpanded.value)"
    data-slot="sidebar-sub-menu"
    role="group"
  >
    <slot :is-expanded="collapsible.isExpanded.value" />
  </div>
</template>
