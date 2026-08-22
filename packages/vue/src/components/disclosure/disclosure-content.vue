<script setup lang="ts" vapor>
import type {DisclosureContentProps} from "./disclosure.types";

import {providePressResponder} from "../../composables/press-responder";
import {useDisclosurePanel} from "../../composables/use-disclosure-panel";
import {dataAttr} from "../../utils/assertion";
import {composeSlotClassName} from "../../utils/compose";

import {useDisclosureContext} from "./disclosure.context";

const props = withDefaults(defineProps<DisclosureContentProps>(), {role: "group"});

defineSlots<{default?: () => unknown}>();

const {isExpanded, panelId, slots, toggle, triggerId} = useDisclosureContext();

// Owns the height variables the stylesheet animates and the `hidden` attribute that keeps a
// collapsed panel out of the tab order.
const {setPanelElement} = useDisclosurePanel({isExpanded});

// Shadows the trigger press the root hands down, so an ordinary button inside the panel stays an
// ordinary button instead of toggling the disclosure it sits in.
providePressResponder(null);

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
    :class="composeSlotClassName(slots.content, props.class)"
    :data-expanded="dataAttr(isExpanded)"
    data-slot="disclosure-content"
    :role="props.role"
    @beforematch="onBeforeMatch"
  >
    <slot />
  </div>
</template>
