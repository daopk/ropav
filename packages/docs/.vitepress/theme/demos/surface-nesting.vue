<script setup lang="ts">
import { Surface, Typography } from "ropav";
</script>

<template>
  <Surface class="outer">
    <Typography type="h4">Billing</Typography>

    <Surface class="middle" variant="secondary">
      <Typography type="body-sm">Card ending 4242</Typography>

      <Surface class="inner" variant="tertiary">
        <Typography color="muted" type="body-xs">Next charge on 1 October</Typography>
      </Surface>
    </Surface>
  </Surface>
</template>

<style scoped>
.outer {
  display: flex;
  width: 100%;
  max-width: var(--rp-container-sm);
  flex-direction: column;
  gap: calc(var(--rp-spacing) * 3);
  border-radius: calc(var(--rp-radius) * 2);
  padding: calc(var(--rp-spacing) * 5);
}

.middle {
  display: flex;
  flex-direction: column;
  gap: calc(var(--rp-spacing) * 2);
  border-radius: calc(var(--rp-radius) * 1.5);
  padding: calc(var(--rp-spacing) * 4);
}

.inner {
  border-radius: var(--rp-radius);
  padding: calc(var(--rp-spacing) * 3);
}
</style>
