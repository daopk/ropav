<script setup lang="ts" vapor>
import type { SurfaceProps } from "@/components/surface";

import { Surface } from "@/components/surface";

import SurfaceConsumer from "../../fixtures/surface-consumer.vue";

const props = defineProps<SurfaceProps & { nestedVariant?: SurfaceProps["variant"] }>();
</script>

<template>
  <Surface :class="props.class" :variant="props.variant">
    <SurfaceConsumer data-testid="consumer" />
    <Surface v-if="props.nestedVariant" :variant="props.nestedVariant">
      <SurfaceConsumer data-testid="nested-consumer" />
    </Surface>
  </Surface>
</template>
