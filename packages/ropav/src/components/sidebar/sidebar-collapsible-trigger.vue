<script setup lang="ts" vapor>
import type {
  SidebarCollapsibleTriggerProps,
  SidebarCollapsibleTriggerSlotProps,
} from "./sidebar.types";

import { computed } from "vue";

import { useInteractionStates } from "../../composables/use-interaction-states";
import { dataAttr } from "../../utils/assertion";
import { composeSlotClassName } from "../../utils/compose";

import { useSidebarCollapsibleContext, useSidebarContext } from "./sidebar.context";

const props = withDefaults(defineProps<SidebarCollapsibleTriggerProps>(), {
  isDisabled: undefined,
});

defineSlots<{ default?: (props: SidebarCollapsibleTriggerSlotProps) => unknown }>();

const { slots, state } = useSidebarContext();
const collapsible = useSidebarCollapsibleContext();

const isDisabled = computed(() => Boolean(props.isDisabled) || collapsible.isDisabled.value);

// The stylesheet keys its states on `data-*`, so they have to be rendered here rather than left to
// the native pseudo-classes.
const interaction = useInteractionStates({ isDisabled });

// Written even though a native button is already tabbable: Safari does not focus one unless an
// explicit tab index says so, which is the reason react-aria always sets it.
const tabindex = computed(() => (isDisabled.value ? undefined : 0));

/*
 * Neither attribute is written on the rail, and that is the point rather than an omission: the
 * submenu is not rendered at that width, so `aria-controls` would name an element that does not
 * exist and `aria-expanded` would describe a region nobody can reach.
 */
const isControlling = computed(() => !state.isCollapsed.value);

// Styled as the row it is: the same slot every other item uses, so a parent and a leaf sit at the
// same height, take the same hover and round the same corner.
const className = computed(() => composeSlotClassName(slots.value.item, props.class));
</script>

<template>
  <button
    :id="collapsible.triggerId.value"
    :aria-controls="isControlling ? collapsible.subMenuId.value : undefined"
    :aria-expanded="isControlling ? collapsible.isExpanded.value : undefined"
    :aria-label="props.ariaLabel"
    :class="className"
    :data-collapsed="dataAttr(state.isCollapsed.value)"
    :data-disabled="dataAttr(isDisabled)"
    :data-expanded="dataAttr(collapsible.isExpanded.value)"
    :data-focus-visible="dataAttr(interaction.isFocusVisible.value)"
    :data-focused="dataAttr(interaction.isFocused.value)"
    :data-hovered="dataAttr(interaction.isHovered.value)"
    :data-pressed="dataAttr(interaction.isPressed.value)"
    data-slot="sidebar-collapsible-trigger"
    :disabled="isDisabled || undefined"
    :tabindex="tabindex"
    type="button"
    @blur="interaction.onBlur"
    @click="collapsible.toggle"
    @focus="interaction.onFocus"
    @pointerdown="interaction.onPointerdown"
    @pointerenter="interaction.onPointerenter"
    @pointerleave="interaction.onPointerleave"
  >
    <slot
      :is-collapsed="state.isCollapsed.value"
      :is-disabled="isDisabled"
      :is-expanded="collapsible.isExpanded.value"
      :is-focus-visible="interaction.isFocusVisible.value"
      :is-focused="interaction.isFocused.value"
      :is-hovered="interaction.isHovered.value"
      :is-pressed="interaction.isPressed.value"
    />
  </button>
</template>
