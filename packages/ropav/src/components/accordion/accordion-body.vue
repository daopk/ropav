<script setup lang="ts" vapor>
import type { AccordionBodyProps } from "./accordion.types";

const props = defineProps<AccordionBodyProps>();

defineSlots<{ default?: () => unknown }>();
</script>

<template>
  <div class="rp-accordion__body" data-slot="accordion-body">
    <div :class="['rp-accordion__body-inner', props.class]">
      <slot />
    </div>
  </div>
</template>
