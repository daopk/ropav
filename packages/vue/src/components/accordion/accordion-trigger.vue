<script setup lang="ts" vapor>
import type {AccordionTriggerProps} from "./accordion.types";

import {computed, shallowRef, watch} from "vue";

import {composeSlotClassName} from "../../utils/compose";

import {useAccordionContext, useAccordionItemContext} from "./accordion.context";

const props = defineProps<AccordionTriggerProps>();

defineSlots<{default?: () => unknown}>();

const {slots} = useAccordionContext();
const {isDisabled, isExpanded, onTriggerKeydown, panelId, registerTrigger, toggle, triggerId} =
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

// Registered with the group so Arrow/Home/End can move focus between triggers.
watch(
  triggerEl,
  (element, _previous, onCleanup) => {
    if (element) onCleanup(registerTrigger(element));
  },
  {flush: "post", immediate: true},
);
</script>

<template>
  <button
    :id="triggerId"
    :ref="setTriggerEl"
    :aria-controls="panelId"
    :aria-expanded="isExpanded"
    :class="composeSlotClassName(slots.trigger, props.class)"
    data-slot="accordion-trigger"
    :disabled="isDisabled || undefined"
    :tabindex="tabindex"
    type="button"
    @click="toggle"
    @keydown="onTriggerKeydown"
  >
    <slot />
  </button>
</template>
