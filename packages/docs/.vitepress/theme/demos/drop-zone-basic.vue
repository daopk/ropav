<script setup lang="ts">
import { DropZone, DropZoneTrigger } from "ropav";
import { shallowRef } from "vue";

const taken = shallowRef<string[]>([]);

const onSelect = (files: File[]) => {
  taken.value = files.map((file) => file.name);
};
</script>

<template>
  <div class="stack">
    <DropZone aria-label="Upload files" multiple @select="onSelect">
      <p>Drop files here, or <DropZoneTrigger>browse</DropZoneTrigger></p>
    </DropZone>

    <p v-if="taken.length" class="note">Took: {{ taken.join(", ") }}</p>
  </div>
</template>

<style scoped>
.stack {
  display: flex;
  width: 100%;
  max-width: var(--rp-container-md);
  flex-direction: column;
  gap: calc(var(--rp-spacing) * 3);
}

.note {
  color: var(--rp-muted);
  font-size: var(--rp-text-sm);
  line-height: var(--rp-text-sm--line-height);
}
</style>
