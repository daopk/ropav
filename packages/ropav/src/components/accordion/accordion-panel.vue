<script setup lang="ts" vapor>
import type {AccordionPanelProps} from "./accordion.types";

import {useDisclosurePanel} from "../../composables/use-disclosure-panel";
import {dataAttr} from "../../utils/assertion";
import {composeSlotClassName} from "../../utils/compose";

import {useAccordionContext, useAccordionItemContext} from "./accordion.context";

const props = withDefaults(defineProps<AccordionPanelProps>(), {role: "group"});

defineSlots<{default?: () => unknown}>();

const {slots} = useAccordionContext();
const {isExpanded, panelId, toggle, triggerId} = useAccordionItemContext();

// Owns the height variables the stylesheet animates and the `hidden` attribute that keeps a
// collapsed panel out of the tab order.
const {setPanelElement} = useDisclosurePanel({isExpanded});

/** Fired when find-in-page reveals the panel; the browser has already dropped `hidden`. */
const onBeforeMatch = () => {
  if (!isExpanded.value) toggle();
};
</script>

<template>
  <div
    :id="panelId"
    :ref="setPanelElement"
    :aria-hidden="!isExpanded"
    :aria-labelledby="triggerId"
    :class="composeSlotClassName(slots.panel, props.class)"
    :data-expanded="dataAttr(isExpanded)"
    data-slot="accordion-panel"
    :role="props.role"
    @beforematch="onBeforeMatch"
  >
    <slot />
  </div>
</template>
