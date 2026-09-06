<script setup lang="ts">
import { Label, Meter, MeterFill, MeterOutput, MeterTrack } from "ropav";

const disks = [
  { label: "Documents", value: 34 },
  { label: "Photos", value: 71 },
  { label: "System", value: 94 },
] as const;

// The colour is the reading, so it is derived from the value rather than written per row.
const colorFor = (value: number) => (value >= 90 ? "danger" : value >= 70 ? "warning" : "success");
</script>

<template>
  <div class="flex w-full max-w-md flex-col gap-6">
    <Meter
      v-for="disk in disks"
      :key="disk.label"
      :color="colorFor(disk.value)"
      :value="disk.value"
    >
      <Label>{{ disk.label }}</Label>
      <MeterOutput />
      <MeterTrack><MeterFill /></MeterTrack>
    </Meter>
  </div>
</template>
