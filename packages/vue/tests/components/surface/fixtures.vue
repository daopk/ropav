<script setup lang="ts" vapor>
import type {SurfaceRootProps} from "@/components/surface";

import {SurfaceRoot} from "@/components/surface";

import SurfaceConsumer from "./surface-consumer.vue";

const props = defineProps<SurfaceRootProps & {nestedVariant?: SurfaceRootProps["variant"]}>();
</script>

<template>
  <SurfaceRoot :class="props.class" :variant="props.variant">
    <SurfaceConsumer data-testid="consumer" />
    <SurfaceRoot v-if="props.nestedVariant" :variant="props.nestedVariant">
      <SurfaceConsumer data-testid="nested-consumer" />
    </SurfaceRoot>
  </SurfaceRoot>
</template>
