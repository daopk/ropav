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
  max-width: var(--container-md);
  flex-direction: column;
  gap: calc(var(--spacing) * 3);
}

.note {
  color: var(--muted);
  font-size: var(--text-sm);
  line-height: var(--text-sm--line-height);
}
</style>
