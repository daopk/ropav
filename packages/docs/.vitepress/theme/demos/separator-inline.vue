<script setup lang="ts">
import { Separator, Typography } from "ropav";

const links = ["Blog", "Docs", "Source"] as const;
</script>

<template>
  <div class="panel">
    <Typography type="h4">Ropav</Typography>
    <Typography class="note" type="body-sm">A component library for Vue.</Typography>

    <Separator class="rule" />

    <div class="row">
      <template v-for="(link, index) in links" :key="link">
        <Separator v-if="index > 0" orientation="vertical" />
        <Typography type="body-sm">{{ link }}</Typography>
      </template>
    </div>
  </div>
</template>

<style scoped>
.panel {
  width: 100%;
  max-width: var(--container-md);
}

.panel .note {
  color: var(--muted);
}

.panel .rule {
  margin-block: calc(var(--spacing) * 4);
}

.row {
  display: flex;
  height: calc(var(--spacing) * 5);
  align-items: center;
  gap: calc(var(--spacing) * 4);
}
</style>
