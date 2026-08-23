<script setup lang="ts" vapor>
import type { AccordionBodyProps } from "./accordion.types";

import { composeSlotClassName } from "../../utils/compose";

import { useAccordionContext } from "./accordion.context";

const props = defineProps<AccordionBodyProps>();

defineSlots<{ default?: () => unknown }>();

const { slots } = useAccordionContext();
</script>

<template>
  <div :class="slots.body()" data-slot="accordion-body">
    <div :class="composeSlotClassName(slots.bodyInner, props.class)">
      <slot />
    </div>
  </div>
</template>
