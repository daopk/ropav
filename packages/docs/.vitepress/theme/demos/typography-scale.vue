<script setup lang="ts">
import { Heading, Paragraph, Typography } from "ropav";
</script>

<template>
  <div class="stack">
    <Heading :level="1">Heading level 1</Heading>
    <Heading :level="3">Heading level 3</Heading>
    <Paragraph>Body text, the size everything else is measured against.</Paragraph>
    <Paragraph size="sm">Body small, for secondary lines.</Paragraph>
    <Typography color="muted" type="body-xs">Body extra small, muted.</Typography>
  </div>
</template>

<style scoped>
.stack {
  display: flex;
  flex-direction: column;
  gap: calc(var(--rp-spacing) * 2);
}
</style>
