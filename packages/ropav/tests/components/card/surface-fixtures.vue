<script setup lang="ts" vapor>
import type { CardProps } from "@/components/card";
import type { SurfaceProps } from "@/components/surface";

import { Card } from "@/components/card";
import { Surface } from "@/components/surface";

import SurfaceConsumer from "../../fixtures/surface-consumer.vue";

/** `outerVariant` puts a real surface above the card, which is what transparent forwards. */
const props = defineProps<CardProps & { outerVariant?: SurfaceProps["variant"] }>();
</script>

<template>
  <Surface v-if="props.outerVariant" :variant="props.outerVariant">
    <Card :variant="props.variant">
      <SurfaceConsumer data-testid="consumer" />
    </Card>
  </Surface>
  <Card v-else :variant="props.variant">
    <SurfaceConsumer data-testid="consumer" />
  </Card>
</template>
