<script setup lang="ts">
import { Label, ProgressBar, ProgressBarFill, ProgressBarOutput, ProgressBarTrack } from "ropav";

const bars = [
  { animated: false, label: "Striped", striped: true },
  { animated: true, label: "Animated", striped: false },
] as const;
</script>

<template>
  <div class="flex w-full max-w-md flex-col gap-6">
    <ProgressBar
      v-for="bar in bars"
      :key="bar.label"
      :is-animated="bar.animated"
      :is-striped="bar.striped"
      :value="60"
    >
      <Label>{{ bar.label }}</Label>
      <ProgressBarOutput />
      <ProgressBarTrack><ProgressBarFill /></ProgressBarTrack>
    </ProgressBar>
  </div>
</template>
