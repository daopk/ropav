<script setup lang="ts" vapor>
import type { AccordionHeadingProps } from "./accordion.types";

const props = defineProps<AccordionHeadingProps>();

defineSlots<{ default?: () => unknown }>();
</script>

<template>
  <h3 :class="['rp-accordion__heading', props.class]" data-slot="accordion-heading">
    <slot />
  </h3>
</template>
