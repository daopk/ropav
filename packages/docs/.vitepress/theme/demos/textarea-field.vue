<script setup lang="ts">
import { Description, Label, TextArea, TextField } from "ropav";
</script>

<template>
  <TextField class="field" name="notes" size="sm" variant="secondary">
    <Label>Release notes</Label>
    <TextArea full-width placeholder="What changed in this release?" rows="4" />
    <Description>Markdown is rendered on the changelog page.</Description>
  </TextField>
</template>

<style scoped>
.field {
  width: 100%;
  max-width: var(--container-sm);
}
</style>
