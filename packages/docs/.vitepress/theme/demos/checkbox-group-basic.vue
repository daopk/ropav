<script setup lang="ts">
import {
  Checkbox,
  CheckboxContent,
  CheckboxControl,
  CheckboxGroup,
  CheckboxIndicator,
  Description,
  Label,
} from "ropav";

const interests = [
  { label: "Coding", value: "coding" },
  { label: "Design", value: "design" },
  { label: "Writing", value: "writing" },
] as const;
</script>

<template>
  <CheckboxGroup class="group" :default-value="['coding']" name="interests">
    <Label>Interests</Label>
    <Description>Choose all that apply.</Description>

    <Checkbox v-for="interest in interests" :key="interest.value" :value="interest.value">
      <CheckboxContent>
        <CheckboxControl>
          <CheckboxIndicator />
        </CheckboxControl>
        {{ interest.label }}
      </CheckboxContent>
    </Checkbox>
  </CheckboxGroup>
</template>

<style scoped>
.group {
  width: 100%;
  max-width: var(--container-md);
}
</style>
