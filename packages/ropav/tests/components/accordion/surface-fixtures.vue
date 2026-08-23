<script setup lang="ts" vapor>
import type {AccordionRootProps} from "@/components/accordion";
import type {SurfaceRootProps} from "@/components/surface";

import {Accordion} from "@/components/accordion";
import {SurfaceRoot} from "@/components/surface";

import SurfaceConsumer from "../../fixtures/surface-consumer.vue";

/** `outerVariant` puts a real surface above the accordion, which is what non-surface forwards. */
const props = defineProps<AccordionRootProps & {outerVariant?: SurfaceRootProps["variant"]}>();
</script>

<template>
  <SurfaceRoot v-if="props.outerVariant" :variant="props.outerVariant">
    <Accordion :variant="props.variant">
      <SurfaceConsumer data-testid="consumer" />
    </Accordion>
  </SurfaceRoot>
  <Accordion v-else :variant="props.variant">
    <SurfaceConsumer data-testid="consumer" />
  </Accordion>
</template>
