<script setup lang="ts" vapor>
import type { SkeletonVariants } from "@ropav/styles";

import { Skeleton } from "@/components/skeleton";

const props = defineProps<{
  animationType?: SkeletonVariants["animationType"];
  class?: string;
}>();
</script>

<template>
  <Skeleton :animation-type="props.animationType" :class="props.class" data-foo="bar">
    <span data-testid="content">Loading</span>
  </Skeleton>
</template>
