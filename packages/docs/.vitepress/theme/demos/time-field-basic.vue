<script setup lang="ts">
import { Label, TimeField, TimeFieldGroup, TimeFieldInput, TimeFieldSegment } from "ropav";
</script>

<template>
  <TimeField class="field" name="time">
    <Label>Start time</Label>
    <TimeFieldGroup>
      <TimeFieldInput>
        <template #default="{ segment }">
          <TimeFieldSegment :segment />
        </template>
      </TimeFieldInput>
    </TimeFieldGroup>
  </TimeField>
</template>

<style scoped>
.field {
  width: calc(var(--spacing) * 64);
}
</style>
