<script setup lang="ts" vapor>
import type { CardRootProps } from "@/components/card";
import type { SurfaceRootProps } from "@/components/surface";

import { Card } from "@/components/card";
import { SurfaceRoot } from "@/components/surface";

import SurfaceConsumer from "../../fixtures/surface-consumer.vue";

/** `outerVariant` puts a real surface above the card, which is what transparent forwards. */
const props = defineProps<CardRootProps & { outerVariant?: SurfaceRootProps["variant"] }>();
</script>

<template>
  <SurfaceRoot v-if="props.outerVariant" :variant="props.outerVariant">
    <Card :variant="props.variant">
      <SurfaceConsumer data-testid="consumer" />
    </Card>
  </SurfaceRoot>
  <Card v-else :variant="props.variant">
    <SurfaceConsumer data-testid="consumer" />
  </Card>
</template>
