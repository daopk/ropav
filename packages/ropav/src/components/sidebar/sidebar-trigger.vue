<script setup lang="ts" vapor>
import type { SidebarTriggerProps, SidebarTriggerSlotProps } from "./sidebar.types";

import { computed } from "vue";

import { useInteractionStates } from "../../composables/use-interaction-states";
import { dataAttr } from "../../utils/assertion";
import { composeSlotClassName } from "../../utils/compose";
import IconChevronLeft from "../icons/icon-chevron-left.vue";
import IconChevronRight from "../icons/icon-chevron-right.vue";

import { useSidebarContext } from "./sidebar.context";

const props = withDefaults(defineProps<SidebarTriggerProps>(), { isDisabled: undefined });

defineSlots<{ default?: (props: SidebarTriggerSlotProps) => unknown }>();

const { panelId, side, slots, state } = useSidebarContext();

// A sidebar pinned open has nothing to toggle, so its trigger is disabled rather than inert —
// it stays announced, which is what says the panel is fixed rather than missing.
const isDisabled = computed(() => Boolean(props.isDisabled) || state.collapsible.value === "none");

// The stylesheet keys the focus ring on `[data-focus-visible]`, so the state has to be rendered
// here rather than left to the native pseudo-classes.
const interaction = useInteractionStates({ isDisabled });

// Written even though a native button is already tabbable: Safari does not focus one unless an
// explicit tab index says so, which is the reason react-aria always sets it.
const tabindex = computed(() => (isDisabled.value ? undefined : 0));

// The default glyph points the way the panel would travel, which reads the same on either edge:
// a left sidebar tucks away to the left, a right one to the right.
const Icon = computed(() => {
  const towardsStart = side.value === "left" ? state.isOpen.value : !state.isOpen.value;

  return towardsStart ? IconChevronLeft : IconChevronRight;
});
</script>

<template>
  <button
    :aria-controls="panelId"
    :aria-expanded="state.isOpen.value"
    :aria-label="props.ariaLabel ?? 'Toggle sidebar'"
    :class="composeSlotClassName(slots.trigger, props.class)"
    :data-disabled="dataAttr(isDisabled)"
    :data-focus-visible="dataAttr(interaction.isFocusVisible.value)"
    :data-focused="dataAttr(interaction.isFocused.value)"
    :data-hovered="dataAttr(interaction.isHovered.value)"
    :data-pressed="dataAttr(interaction.isPressed.value)"
    data-slot="sidebar-trigger"
    :disabled="isDisabled || undefined"
    :tabindex="tabindex"
    type="button"
    @blur="interaction.onBlur"
    @click="state.toggle"
    @focus="interaction.onFocus"
    @pointerdown="interaction.onPointerdown"
    @pointerenter="interaction.onPointerenter"
    @pointerleave="interaction.onPointerleave"
  >
    <slot
      :is-collapsed="state.isCollapsed.value"
      :is-disabled="isDisabled"
      :is-focus-visible="interaction.isFocusVisible.value"
      :is-focused="interaction.isFocused.value"
      :is-hovered="interaction.isHovered.value"
      :is-open="state.isOpen.value"
      :is-pressed="interaction.isPressed.value"
    >
      <component :is="Icon" />
    </slot>
  </button>
</template>
