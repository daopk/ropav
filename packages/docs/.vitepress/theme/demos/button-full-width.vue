<script setup lang="ts">
import { Button } from "ropav";
</script>

<template>
  <div class="stack">
    <Button full-width>Continue</Button>
    <Button full-width variant="secondary">Cancel</Button>
  </div>
</template>

<style scoped>
.stack {
  display: flex;
  width: 100%;
  max-width: var(--container-sm);
  flex-direction: column;
  gap: calc(var(--spacing) * 3);
}
</style>
