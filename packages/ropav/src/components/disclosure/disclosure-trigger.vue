<script setup lang="ts" vapor>
import type { DisclosureTriggerProps } from "./disclosure.types";

import { computed, shallowRef, watch } from "vue";

import { useInteractionStates } from "../../composables/use-interaction-states";
import { dataAttr } from "../../utils/assertion";
import { composeSlotClassName } from "../../utils/compose";

import { useDisclosureContext } from "./disclosure.context";

const props = defineProps<DisclosureTriggerProps>();

defineSlots<{ default?: () => unknown }>();

const {
  isDisabled,
  isExpanded,
  onTriggerKeydown,
  panelId,
  registerTrigger,
  slots,
  toggle,
  triggerId,
} = useDisclosureContext();

const triggerEl = shallowRef<HTMLElement | null>(null);

const setTriggerEl = (element: unknown) => {
  triggerEl.value = element instanceof HTMLElement ? element : null;
};

// Written even though a native button is already tabbable: Safari does not focus one unless an
// explicit tab index says so, which is the reason react-aria always sets it. A disabled trigger
// should not be reachable at all, so it gets none.
const tabindex = computed(() => (isDisabled.value ? undefined : 0));

// The stylesheet keys the focus ring on `[data-focus-visible]`, so the state has to be rendered
// here rather than left to the native pseudo-classes.
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

// Registered with the group, if there is one, so Arrow/Home/End can move focus between triggers.
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
    data-slot="disclosure-trigger"
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
