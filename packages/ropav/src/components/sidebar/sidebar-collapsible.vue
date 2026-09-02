<script setup lang="ts" vapor>
import type { SidebarCollapsibleProps, SidebarCollapsibleSlotProps } from "./sidebar.types";

import { computed } from "vue";

import { useControllableState } from "../../composables/use-controllable-state";
import { useId } from "../../composables/use-id";
import { dataAttr } from "../../utils/assertion";
import { composeSlotClassName } from "../../utils/compose";

import { provideSidebarCollapsibleContext, useSidebarContext } from "./sidebar.context";

// Every prop whose type includes `boolean` declares an explicit `undefined` default. Vue casts an
// absent boolean to `false`, so a controlled flag nobody passed would claim to be controlling it.
const props = withDefaults(defineProps<SidebarCollapsibleProps>(), {
  defaultExpanded: undefined,
  isDisabled: undefined,
  isExpanded: undefined,
});

// Spelled out rather than `defineEmits<SidebarCollapsibleEmits>()`: the published interface and the
// SFC are checked against each other by reading source, and a declaration behind a type alias
// leaves nothing there to read.
const emit = defineEmits<{
  expandedChange: [isExpanded: boolean];
  "update:isExpanded": [isExpanded: boolean];
}>();

defineSlots<{ default?: (props: SidebarCollapsibleSlotProps) => unknown }>();

const { slots, state } = useSidebarContext();

const id = useId();
const triggerId = computed(() => `${id.value}-trigger`);
const subMenuId = computed(() => `${id.value}-submenu`);

const isDisabled = computed(() => Boolean(props.isDisabled));

const { setState, state: expanded } = useControllableState<boolean>({
  defaultValue: props.defaultExpanded ?? false,
  onValueChange: (isExpanded) => {
    emit("update:isExpanded", isExpanded);
    emit("expandedChange", isExpanded);
  },
  value: () => props.isExpanded,
});

/*
 * Always shut while the sidebar is a rail, whatever the item's own flag says. There is no submenu
 * rendered at that width — a child row has no icon, so it would be a nameless blank on the rail —
 * and reporting `aria-expanded="true"` for a region that is not there is a promise to a screen
 * reader that nothing keeps.
 */
const isExpanded = computed(() => !state.isCollapsed.value && expanded.value);

const toggle = () => {
  if (isDisabled.value) return;

  // On the rail the press is asking for the children, and the children live at the wider size.
  // Opening the panel and the item together is what the gesture meant; flipping a flag under a
  // submenu that is not rendered would look like a control that does nothing.
  if (state.isCollapsed.value) {
    state.open();
    setState(true);

    return;
  }

  setState(!expanded.value);
};

provideSidebarCollapsibleContext({ isDisabled, isExpanded, subMenuId, toggle, triggerId });
</script>

<template>
  <div
    :class="composeSlotClassName(slots.group, props.class)"
    :data-collapsed="dataAttr(state.isCollapsed.value)"
    :data-disabled="dataAttr(isDisabled)"
    :data-expanded="dataAttr(isExpanded)"
    data-slot="sidebar-collapsible"
  >
    <slot
      :is-collapsed="state.isCollapsed.value"
      :is-disabled="isDisabled"
      :is-expanded="isExpanded"
    />
  </div>
</template>
