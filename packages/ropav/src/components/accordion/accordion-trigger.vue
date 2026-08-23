<script setup lang="ts" vapor>
import type { AccordionTriggerProps } from "./accordion.types";

import { computed, shallowRef, watch } from "vue";

import { useInteractionStates } from "../../composables/use-interaction-states";
import { dataAttr } from "../../utils/assertion";
import { composeSlotClassName } from "../../utils/compose";

import { useAccordionContext, useAccordionItemContext } from "./accordion.context";

const props = defineProps<AccordionTriggerProps>();

defineSlots<{ default?: () => unknown }>();

const { slots } = useAccordionContext();
const { isDisabled, isExpanded, onTriggerKeydown, panelId, registerTrigger, toggle, triggerId } =
  useAccordionItemContext();

const triggerEl = shallowRef<HTMLElement | null>(null);

const setTriggerEl = (element: unknown) => {
  triggerEl.value = element instanceof HTMLElement ? element : null;
};

// Written even though a native button is already tabbable: Safari does not focus one unless an
// explicit tab index says so, which is the reason react-aria always sets it. Every enabled
// trigger keeps its own tab stop — the accordion pattern does not use a roving tab index — and a
// disabled one should not be reachable at all, so it gets none.
const tabindex = computed(() => (isDisabled.value ? undefined : 0));

// React builds this part on React Aria's `Button`, which renders the same five attributes. The
// focus ring is the one that has to be here: `accordion.css` paints it from
// `[data-focus-visible="true"]`, and the `&:focus-visible:not(:focus)` branch beside it can never
// match on a real button, so without this the trigger has no ring at all.
const {
  isFocusVisible,
  isFocused,
  isHovered,
  isPressed,
  onBlur,
  onFocus,
  onPointerdown,
  onPointerenter,
  onPointerleave,
} = useInteractionStates({ isDisabled });

// Registered with the group so Arrow/Home/End can move focus between triggers.
watch(
  triggerEl,
  (element, _previous, onCleanup) => {
    if (element) onCleanup(registerTrigger(element));
  },
  { flush: "post", immediate: true },
);
</script>

<template>
  <button
    :id="triggerId"
    :ref="setTriggerEl"
    :aria-controls="panelId"
    :aria-expanded="isExpanded"
    :class="composeSlotClassName(slots.trigger, props.class)"
    :data-disabled="dataAttr(isDisabled)"
    :data-focus-visible="dataAttr(isFocusVisible)"
    :data-focused="dataAttr(isFocused)"
    :data-hovered="dataAttr(isHovered)"
    :data-pressed="dataAttr(isPressed)"
    data-slot="accordion-trigger"
    :disabled="isDisabled || undefined"
    :tabindex="tabindex"
    type="button"
    @blur="onBlur"
    @click="toggle"
    @focus="onFocus"
    @keydown="onTriggerKeydown"
    @pointerdown="onPointerdown"
    @pointerenter="onPointerenter"
    @pointerleave="onPointerleave"
  >
    <slot />
  </button>
</template>
