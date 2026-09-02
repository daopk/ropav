<script setup lang="ts" vapor>
import type { SidebarPanelProps, SidebarPartSlotProps } from "./sidebar.types";

import { computed } from "vue";

import { dataAttr } from "../../utils/assertion";
import { composeSlotClassName } from "../../utils/compose";
import DrawerBackdrop from "../drawer/drawer-backdrop.vue";
import DrawerContent from "../drawer/drawer-content.vue";
import DrawerDialog from "../drawer/drawer-dialog.vue";
import DrawerHeading from "../drawer/drawer-heading.vue";
import DrawerRoot from "../drawer/drawer-root.vue";

import { useSidebarContext } from "./sidebar.context";

const props = defineProps<SidebarPanelProps>();

defineSlots<{ default?: (props: SidebarPartSlotProps) => unknown }>();

const { panelId, setPanelEl, side, slots, state } = useSidebarContext();

const setElement = (next: unknown) => setPanelEl((next as HTMLElement | null) ?? null);

/*
 * Only the mode that hides the panel outright takes it out of the tab order. Collapsed to the icon
 * rail every item is still on screen and still a target, so `inert` there would strand a nav a
 * keyboard user can see — the same distinction `splitter-panel.vue` draws for a panel dragged shut.
 */
const isHidden = computed(() => state.collapsible.value === "offcanvas" && state.isCollapsed.value);

const label = computed(() => props.ariaLabel ?? "Sidebar");

// Only where nothing else names the landmark: `aria-labelledby` outranks `aria-label`, so writing
// both would leave the fallback claiming a name it never gets to give.
const ariaLabel = computed(() => (props.ariaLabelledby ? undefined : label.value));

const panelClass = computed(() =>
  composeSlotClassName(slots.value.panel, props.class, { inDrawer: state.isMobile.value }),
);
</script>

<template>
  <!-- On a narrow viewport the panel is handed to the drawer wholesale: the backdrop, the focus
    scope, the dismiss boundary and the swipe-to-close all come from there rather than being built
    a second time here. The dialog gives up its own padding, because the sidebar's parts already
    carry the nav's gutter and two insets read as a margin nobody asked for. -->
  <DrawerRoot
    v-if="state.isMobile.value"
    :is-open="state.isMobileOpen.value"
    @open-change="state.setOpen"
  >
    <DrawerBackdrop>
      <DrawerContent :placement="side">
        <DrawerDialog class="p-0">
          <!-- The drawer names itself from its heading and falls back to the button that opened
            it; the sidebar's trigger is not that button, so the name is given here instead. -->
          <DrawerHeading class="sr-only">{{ label }}</DrawerHeading>
          <nav
            :id="panelId"
            :ref="setElement"
            :aria-label="ariaLabel"
            :aria-labelledby="props.ariaLabelledby"
            :class="panelClass"
            :data-side="side"
            data-slot="sidebar-panel"
          >
            <slot :is-collapsed="false" :is-mobile="true" :is-open="state.isOpen.value" />
          </nav>
        </DrawerDialog>
      </DrawerContent>
    </DrawerBackdrop>
  </DrawerRoot>
  <nav
    v-else
    :id="panelId"
    :ref="setElement"
    :aria-label="ariaLabel"
    :aria-labelledby="props.ariaLabelledby"
    :class="panelClass"
    :data-collapsed="dataAttr(state.isCollapsed.value)"
    :data-resizing="dataAttr(state.isResizing.value)"
    :data-side="side"
    data-slot="sidebar-panel"
    :inert="isHidden || undefined"
  >
    <slot
      :is-collapsed="state.isCollapsed.value"
      :is-mobile="false"
      :is-open="state.isOpen.value"
    />
  </nav>
</template>
