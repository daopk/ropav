<script setup lang="ts">
import { TextArea } from "ropav";
</script>

<template>
  <div class="stack">
    <TextArea class="field" placeholder="Resize is none by default" :rows="3" />
    <TextArea class="field" placeholder="Drag the bottom edge" resize="vertical" :rows="3" />
    <TextArea class="field" placeholder="Drag any edge" resize="both" :rows="3" />
  </div>
</template>

<style scoped>
.stack {
  display: flex;
  flex-direction: column;
  gap: calc(var(--rp-spacing) * 4);
}

.field {
  width: 100%;
  max-width: var(--rp-container-sm);
}
</style>
