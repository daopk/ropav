<script setup lang="ts">
import { ColorArea, ColorAreaThumb } from "ropav";
</script>

<template>
  <div class="flex flex-col gap-2">
    <p class="text-sm text-muted">Saturation × brightness</p>
    <ColorArea
      aria-label="Saturation and brightness"
      class="w-56"
      default-value="hsb(30, 100%, 100%)"
    >
      <ColorAreaThumb />
    </ColorArea>
  </div>

  <div class="flex flex-col gap-2">
    <p class="text-sm text-muted">Red × green</p>
    <ColorArea
      aria-label="Red and green"
      class="w-56"
      default-value="rgb(255, 100, 50)"
      x-channel="red"
      y-channel="green"
    >
      <ColorAreaThumb />
    </ColorArea>
  </div>
</template>
