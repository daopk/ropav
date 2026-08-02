<script setup lang="ts" vapor>
import type {AccordionTriggerProps} from "./accordion.types";

import {shallowRef, watch} from "vue";

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
    type="button"
    @click="toggle"
    @keydown="onTriggerKeydown"
  >
    <slot />
  </button>
</template>
