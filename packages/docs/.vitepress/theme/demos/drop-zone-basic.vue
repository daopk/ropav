<script setup lang="ts">
import { DropZone, DropZoneTrigger } from "ropav";
import { shallowRef } from "vue";

const taken = shallowRef<string[]>([]);

const onSelect = (files: File[]) => {
  taken.value = files.map((file) => file.name);
};
</script>

<template>
  <div class="flex w-full max-w-md flex-col gap-3">
    <DropZone aria-label="Upload files" multiple @select="onSelect">
      <p>Drop files here, or <DropZoneTrigger>browse</DropZoneTrigger></p>
    </DropZone>

    <p v-if="taken.length" class="text-sm text-muted">Took: {{ taken.join(", ") }}</p>
  </div>
</template>
