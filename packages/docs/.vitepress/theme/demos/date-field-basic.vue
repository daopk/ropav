<script setup lang="ts">
import { DateField, DateFieldGroup, DateFieldInput, DateFieldSegment, Label } from "ropav";
</script>

<template>
  <div class="field">
    <DateField name="date">
      <Label>Date of birth</Label>
      <DateFieldGroup>
        <DateFieldInput>
          <template #default="{ segment }">
            <DateFieldSegment :segment />
          </template>
        </DateFieldInput>
      </DateFieldGroup>
    </DateField>
  </div>
</template>

<style scoped>
/* The control renders two roots, so a scoped rule has nothing in it to attach to. The demo
   owns this box instead, and a column stretches the control across it. */
.field {
  display: flex;
  flex-direction: column;
  width: calc(var(--spacing) * 64);
}
</style>
