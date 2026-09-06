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
    <span aria-hidden="true" class="size-2 shrink-0 rounded-full bg-current" />
    <ChipLabel>{{ run.label }}</ChipLabel>
  </Chip>
</template>
