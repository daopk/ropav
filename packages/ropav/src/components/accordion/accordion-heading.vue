<script setup lang="ts" vapor>
import type {AccordionHeadingProps} from "./accordion.types";

import {composeSlotClassName} from "../../utils/compose";

import {useAccordionContext} from "./accordion.context";

const props = defineProps<AccordionHeadingProps>();

defineSlots<{default?: () => unknown}>();

const {slots} = useAccordionContext();
</script>

<template>
  <h3 :class="composeSlotClassName(slots.heading, props.class)" data-slot="accordion-heading">
    <slot />
  </h3>
</template>
