<script setup lang="ts" vapor>
import type {AccordionIndicatorProps} from "./accordion.types";

import {dataAttr} from "../../utils/assertion";
import {composeSlotClassName} from "../../utils/compose";
import {IconChevronDown} from "../icons";

import {useAccordionContext, useAccordionItemContext} from "./accordion.context";

const props = defineProps<AccordionIndicatorProps>();

defineSlots<{default?: () => unknown}>();

const {slots} = useAccordionContext();
const {isExpanded} = useAccordionItemContext();
</script>

<template>
  <!--
    The class and `data-expanded` sit on this wrapper rather than on the icon itself.
    Reading a slot in Vapor renders it, so the icon cannot be inspected and cloned the
    way the React implementation does; a custom icon arrives as slot content instead.
  -->
  <span
    :class="composeSlotClassName(slots.indicator, props.class)"
    :data-expanded="dataAttr(isExpanded)"
    data-slot="accordion-indicator"
  >
    <slot>
      <IconChevronDown />
    </slot>
  </span>
</template>
