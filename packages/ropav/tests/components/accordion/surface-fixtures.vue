<script setup lang="ts" vapor>
import type { AccordionProps } from "@/components/accordion";
import type { SurfaceProps } from "@/components/surface";

import { Accordion } from "@/components/accordion";
import { Surface } from "@/components/surface";

import SurfaceConsumer from "../../fixtures/surface-consumer.vue";

/** `outerVariant` puts a real surface above the accordion, which is what non-surface forwards. */
const props = defineProps<AccordionProps & { outerVariant?: SurfaceProps["variant"] }>();
</script>

<template>
  <Surface v-if="props.outerVariant" :variant="props.outerVariant">
    <Accordion :variant="props.variant">
      <SurfaceConsumer data-testid="consumer" />
    </Accordion>
  </Surface>
  <Accordion v-else :variant="props.variant">
    <SurfaceConsumer data-testid="consumer" />
  </Accordion>
</template>
