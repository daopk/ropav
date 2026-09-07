<script setup lang="ts">
import { Label, ProgressBar, ProgressBarFill, ProgressBarOutput, ProgressBarTrack } from "ropav";
</script>

<template>
  <div class="stack">
    <ProgressBar :value="60">
      <Label>Uploading</Label>
      <ProgressBarOutput />
      <ProgressBarTrack><ProgressBarFill /></ProgressBarTrack>
    </ProgressBar>

    <ProgressBar is-indeterminate>
      <Label>Contacting the server</Label>
      <ProgressBarTrack><ProgressBarFill /></ProgressBarTrack>
    </ProgressBar>
  </div>
</template>

<style scoped>
.stack {
  display: flex;
  width: 100%;
  max-width: var(--container-md);
  flex-direction: column;
  gap: calc(var(--spacing) * 6);
}
</style>
