<script setup lang="ts" vapor>
import type { SidebarRootProps, SidebarSlotProps } from "./sidebar.types";

import { sidebarVariants } from "@ropav/styles";
import { computed, onMounted, shallowRef } from "vue";

import { useId } from "../../composables/use-id";
import { useMediaQuery } from "../../composables/use-media-query";
import { dataAttr } from "../../utils/assertion";

import { provideSidebarContext } from "./sidebar.context";
import { useSidebarState } from "./sidebar.state";
import { readSidebarLayout, writeSidebarLayout } from "./sidebar.storage";

// Every prop whose type includes `boolean` declares an explicit `undefined` default. Vue casts an
// absent boolean to `false`, so a sidebar nobody configured would start collapsed and a controlled
// flag nobody passed would claim to be controlling it.
const props = withDefaults(defineProps<SidebarRootProps>(), {
  defaultExpanded: undefined,
  defaultMobileOpen: undefined,
  isExpanded: undefined,
  isMobileOpen: undefined,
});

// Spelled out rather than `defineEmits<SidebarRootEmits>()`, which is how the rest of the library
// writes it: the published interface and the SFC are checked against each other by reading source,
// and a declaration behind a type alias leaves nothing there to read.
const emit = defineEmits<{
  expandedChange: [isExpanded: boolean];
  "update:isExpanded": [isExpanded: boolean];
  mobileOpenChange: [isOpen: boolean];
  "update:isMobileOpen": [isOpen: boolean];
  "update:width": [width: string];
}>();

defineSlots<{ default?: (props: SidebarSlotProps) => unknown }>();

/*
 * Just under the `md` step rather than at it, so the drawer takes over exactly where the wide
 * layout stops — a query written `max-width: 48rem` would claim the first pixel of `md` as well.
 */
const DEFAULT_BREAKPOINT = "(max-width: 47.99rem)";

const matchesNarrow = useMediaQuery(() => props.breakpoint ?? DEFAULT_BREAKPOINT);

/*
 * Held false until mounted, never resolved during setup. A server has no `matchMedia` to ask, so
 * it renders the wide layout; a client that answered honestly on its first render would disagree
 * with what it is hydrating and have a whole drawer to reconcile. The cost is one frame of the
 * wide layout, the same trade `splitter-root.vue` takes for its stored layout.
 */
const isMounted = shallowRef(false);

onMounted(() => {
  isMounted.value = true;
});

const isMobile = computed(() => isMounted.value && matchesNarrow.value);

const state = useSidebarState({
  collapsible: () => props.collapsible,
  defaultExpanded: props.defaultExpanded,
  defaultMobileOpen: props.defaultMobileOpen,
  defaultWidth: props.defaultWidth,
  isExpanded: () => props.isExpanded,
  isMobile,
  isMobileOpen: () => props.isMobileOpen,
  onExpandedChange: (isExpanded) => {
    emit("update:isExpanded", isExpanded);
    emit("expandedChange", isExpanded);
    persist();
  },
  onMobileOpenChange: (isOpen) => {
    emit("update:isMobileOpen", isOpen);
    emit("mobileOpenChange", isOpen);
  },
  onWidthChange: (width) => {
    emit("update:width", width);
    persist();
  },
  width: () => props.width,
});

/*
 * Written on the change rather than debounced. A drag reports continuously and this is one small
 * `setItem` per frame at most, where a splitter writes a whole layout for every panel it holds —
 * and skipping the timer means nothing is left unwritten when the sidebar goes away mid-gesture.
 */
function persist() {
  if (!props.autoSaveId || isRestoring) return;

  writeSidebarLayout(props.autoSaveId, state.isExpanded.value, state.width.value);
}

/*
 * Restored after mount, never during setup, so a server render and the first client render agree
 * and there is nothing to reconcile — the same call `splitter-root.vue` makes, and the same cost:
 * one frame of the declared state.
 */
let isRestoring = false;

onMounted(() => {
  if (!props.autoSaveId) return;

  const restored = readSidebarLayout(props.autoSaveId);

  if (!restored) return;

  isRestoring = true;
  state.setOpen(restored.isExpanded);
  if (restored.width !== undefined) state.setWidth(restored.width);
  isRestoring = false;
});

const side = computed(() => props.side ?? "left");

const slots = computed(() =>
  sidebarVariants({
    collapsible: state.collapsible.value,
    side: side.value,
    variant: props.variant,
  }),
);

const panelId = useId();

const panelElement = shallowRef<HTMLElement | null>(null);

// Nothing written until someone sets a width, so an untouched sidebar is sized by the stylesheet
// rather than by a value restated here — the same call `splitter-panel.vue` makes about its basis.
const style = computed(() =>
  state.width.value === undefined ? undefined : { "--sidebar-width": state.width.value },
);

provideSidebarContext({
  panelEl: computed(() => panelElement.value),
  panelId,
  setPanelEl: (element) => {
    panelElement.value = element;
  },
  side,
  slots,
  state,
});

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
