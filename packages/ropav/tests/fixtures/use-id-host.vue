<script setup lang="ts" vapor>
import { useId } from "@/composables/use-id";

const props = defineProps<{ idOverride?: string }>();

const first = useId(() => props.idOverride);
const second = useId();
</script>

<template>
  <div>
    <span data-testid="first">{{ first }}</span>
    <span data-testid="second">{{ second }}</span>
  </div>
</template>
