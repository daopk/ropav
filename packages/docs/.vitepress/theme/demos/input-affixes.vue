<script setup lang="ts">
import { Input, Label, TextField } from "ropav";

const sizes = ["sm", "md", "lg"] as const;
</script>

<template>
  <div class="stack">
    <TextField v-for="size in sizes" :key="size" :size="size">
      <Label class="label">{{ size }}</Label>
      <Input class="field" :placeholder="`A ${size} control`" />
    </TextField>
  </div>
</template>

<style scoped>
.stack {
  display: flex;
  flex-direction: column;
  gap: calc(var(--spacing) * 4);
}

.label {
  text-transform: capitalize;
}

.field {
  width: calc(var(--spacing) * 64);
}
</style>
