<script setup lang="ts" vapor>
import type { SidebarRootEmits, SidebarRootProps, SidebarSlotProps } from "./sidebar.types";

import { sidebarVariants } from "@ropav/styles";
import { computed } from "vue";

import { useId } from "../../composables/use-id";
import { dataAttr } from "../../utils/assertion";

import { provideSidebarContext } from "./sidebar.context";
import { useSidebarState } from "./sidebar.state";

// Every prop whose type includes `boolean` declares an explicit `undefined` default. Vue casts an
// absent boolean to `false`, so a sidebar nobody configured would start collapsed and a controlled
// flag nobody passed would claim to be controlling it.
const props = withDefaults(defineProps<SidebarRootProps>(), {
  defaultExpanded: undefined,
  defaultMobileOpen: undefined,
  isExpanded: undefined,
  isMobileOpen: undefined,
});

const emit = defineEmits<SidebarRootEmits>();

defineSlots<{ default?: (props: SidebarSlotProps) => unknown }>();

const state = useSidebarState({
  collapsible: () => props.collapsible,
  defaultExpanded: props.defaultExpanded,
  defaultMobileOpen: props.defaultMobileOpen,
  defaultWidth: props.defaultWidth,
  isExpanded: () => props.isExpanded,
  isMobile: undefined,
  isMobileOpen: () => props.isMobileOpen,
  onExpandedChange: (isExpanded) => {
    emit("update:isExpanded", isExpanded);
    emit("expandedChange", isExpanded);
  },
  onMobileOpenChange: (isOpen) => {
    emit("update:isMobileOpen", isOpen);
    emit("mobileOpenChange", isOpen);
  },
  onWidthChange: (width) => emit("update:width", width),
  width: () => props.width,
});

const side = computed(() => props.side ?? "left");

const slots = computed(() =>
  sidebarVariants({ collapsible: state.collapsible.value, side: side.value }),
);

const panelId = useId();

// Nothing written until someone sets a width, so an untouched sidebar is sized by the stylesheet
// rather than by a value restated here — the same call `splitter-panel.vue` makes about its basis.
const style = computed(() =>
  state.width.value === undefined ? undefined : { "--sidebar-width": state.width.value },
);

provideSidebarContext({ panelId, side, slots, state });

defineExpose({ close: state.close, open: state.open, toggle: state.toggle });
</script>

<template>
  <!-- No role: the shell holds a landmark and the whole page beside it, and wrapping that in a
    `group` only puts a boundary in the reading order that means nothing. The rail is a focusable
    `separator`, which needs no group of its own. -->
  <div
    :class="slots.base({ class: props.class })"
    :data-collapsed="dataAttr(state.isCollapsed.value)"
    :data-mobile="dataAttr(state.isMobile.value)"
    :data-side="side"
    data-slot="sidebar"
    :style="style"
  >
    <slot
      :collapsible="state.collapsible.value"
      :is-collapsed="state.isCollapsed.value"
      :is-expanded="state.isExpanded.value"
      :is-mobile="state.isMobile.value"
      :is-open="state.isOpen.value"
      :side="side"
    />
  </div>
</template>
