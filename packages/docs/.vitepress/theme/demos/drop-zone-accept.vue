<script setup lang="ts">
import { DropZone, DropZoneTrigger } from "ropav";
</script>

<template>
  <DropZone accept="image/*" aria-label="Upload images" class="w-full max-w-md" multiple>
    <template #default="{ status }">
      <p v-if="status === 'reject'">Only images can be dropped here</p>
      <p v-else>Drop images here, or <DropZoneTrigger>browse</DropZoneTrigger></p>
    </template>
  </DropZone>
</template>
