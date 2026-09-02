<script setup lang="ts" vapor>
import type { SidebarGroupProps, SidebarPartSlotProps } from "./sidebar.types";

import { computed, shallowRef } from "vue";

import { useId } from "../../composables/use-id";
import { dataAttr } from "../../utils/assertion";
import { composeSlotClassName } from "../../utils/compose";

import { provideSidebarGroupContext, useSidebarContext } from "./sidebar.context";

const props = defineProps<SidebarGroupProps>();

defineSlots<{ default?: (props: SidebarPartSlotProps) => unknown }>();

const { slots, state } = useSidebarContext();

const labelId = useId();

// Counted rather than flagged, so a group whose label is swapped behind a `v-if` — the new one
// mounting before the old one unregisters — does not end up reporting that it has none.
const labels = shallowRef(0);

provideSidebarGroupContext({
  labelId,
  registerLabel: () => {
    labels.value += 1;

    return () => {
      labels.value -= 1;
    };
  },
});

const labelledBy = computed(() => (labels.value > 0 ? labelId.value : undefined));
</script>

<template>
  <div
    :aria-label="labelledBy ? undefined : props.ariaLabel"
    :aria-labelledby="labelledBy"
    :class="composeSlotClassName(slots.group, props.class)"
    :data-collapsed="dataAttr(state.isCollapsed.value)"
    data-slot="sidebar-group"
    role="group"
  >
    <slot
      :is-collapsed="state.isCollapsed.value"
      :is-mobile="state.isMobile.value"
      :is-open="state.isOpen.value"
    />
  </div>
</template>
