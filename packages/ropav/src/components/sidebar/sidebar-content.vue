<script setup lang="ts" vapor>
import type { SidebarContentProps, SidebarPartSlotProps } from "./sidebar.types";

import { computed } from "vue";

import { composeSlotClassName } from "../../utils/compose";
import ScrollShadowRoot from "../scroll-shadow/scroll-shadow-root.vue";
import { provideSeparatorContext } from "../separator/separator.context";

import { useSidebarContext } from "./sidebar.context";

// A real default rather than the tri-state `undefined` the other booleans use: Vue casts an absent
// boolean prop to `false`, so "not given" and "turned off" would be indistinguishable here — and
// this one is on unless someone says otherwise.
const props = withDefaults(defineProps<SidebarContentProps>(), { showScrollShadow: true });

defineSlots<{ default?: (props: SidebarPartSlotProps) => unknown }>();

const { slots, state } = useSidebarContext();

// The content is a flex column that lays its own children out, so a rule between two of them has
// to take part in that layout rather than being the block-level `hr` it would be on its own —
// the same hand-down `menu-root.vue` makes. Provided here rather than on the panel, because a rule
// drawn between the header and the content is a block-level one and an `hr` is right for it.
provideSeparatorContext({ elementType: "div" });

/*
 * The scroll region is a shadow container rather than holding one, which is the whole reason this
 * reuses `ScrollShadow` instead of wrapping it: the fade has to be on the element that scrolls,
 * and a wrapper around it would fade a box that never moves.
 *
 * `isEnabled` rather than an unrendered component, so turning the fade off leaves the same element
 * behind and a caller's own styles keep landing on it.
 */
const className = computed(() => composeSlotClassName(slots.value.content, props.class));
</script>

<template>
  <ScrollShadowRoot
    :class="className"
    data-slot="sidebar-content"
    :is-enabled="props.showScrollShadow"
    :size="props.scrollShadowSize"
  >
    <slot
      :is-collapsed="state.isCollapsed.value"
      :is-mobile="state.isMobile.value"
      :is-open="state.isOpen.value"
    />
  </ScrollShadowRoot>
</template>
