<script setup lang="ts" vapor>
import {useSurfaceContext} from "@/components/surface";

/** Reports the innermost surface above it, which is all a real consumer needs to know. */
const surface = useSurfaceContext();
</script>

<template>
  <span :data-surface="surface?.variant.value ?? 'none'" />
</template>
