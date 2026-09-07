<script setup lang="ts">
import { ColorArea, ColorAreaThumb } from "ropav";
</script>

<template>
  <div class="stack">
    <p class="note">Saturation × brightness</p>
    <ColorArea
      aria-label="Saturation and brightness"
      class="area"
      default-value="hsb(30, 100%, 100%)"
    >
      <ColorAreaThumb />
    </ColorArea>
  </div>

  <div class="stack">
    <p class="note">Red × green</p>
    <ColorArea
      aria-label="Red and green"
      class="area"
      default-value="rgb(255, 100, 50)"
      x-channel="red"
      y-channel="green"
    >
      <ColorAreaThumb />
    </ColorArea>
  </div>
</template>

<style scoped>
.stack {
  display: flex;
  flex-direction: column;
  gap: calc(var(--rp-spacing) * 2);
}

.stack .note {
  color: var(--rp-muted);
  font-size: var(--rp-text-sm);
  line-height: var(--rp-text-sm--line-height);
}

.area {
  width: calc(var(--rp-spacing) * 56);
}
</style>
