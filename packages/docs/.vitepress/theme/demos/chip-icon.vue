<script setup lang="ts">
import { Chip, ChipLabel } from "ropav";

const runs = [
  { color: "success", label: "Passed" },
  { color: "warning", label: "Flaky" },
  { color: "danger", label: "Failed" },
] as const;
</script>

<template>
  <Chip v-for="run in runs" :key="run.label" :color="run.color" variant="soft">
    <span aria-hidden="true" class="dot" />
    <ChipLabel>{{ run.label }}</ChipLabel>
  </Chip>
</template>

<style scoped>
.dot {
  width: calc(var(--spacing) * 2);
  height: calc(var(--spacing) * 2);
  flex-shrink: 0;
  border-radius: 50%;
  background-color: currentcolor;
}
</style>
