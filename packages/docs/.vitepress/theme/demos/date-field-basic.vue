<script setup lang="ts">
import { DateField, DateFieldGroup, DateFieldInput, DateFieldSegment, Label } from "ropav";
</script>

<template>
  <DateField class="w-64" name="date">
    <Label>Date of birth</Label>
    <DateFieldGroup>
      <DateFieldInput>
        <template #default="{ segment }">
          <DateFieldSegment :segment />
        </template>
      </DateFieldInput>
    </DateFieldGroup>
  </DateField>
</template>
