<script setup lang="ts">
import { Card, Skeleton } from "ropav";
</script>

<template>
  <Card class="card">
    <Skeleton class="thumb" />
    <div class="lines">
      <Skeleton class="line line--short" />
      <Skeleton class="line line--long" />
      <Skeleton class="line line--stub" />
    </div>
  </Card>
</template>

<style scoped>
.card {
  display: flex;
  width: calc(var(--rp-spacing) * 56);
  flex-direction: column;
  gap: calc(var(--rp-spacing) * 5);
}

.thumb {
  height: calc(var(--rp-spacing) * 24);
  border-radius: calc(var(--rp-radius) * 1.5);
}

.lines {
  display: flex;
  flex-direction: column;
  gap: calc(var(--rp-spacing) * 3);
}

.line.line--short {
  height: calc(var(--rp-spacing) * 3);
  width: 60%;
  border-radius: var(--rp-radius);
}

.line.line--long {
  height: calc(var(--rp-spacing) * 3);
  width: 80%;
  border-radius: var(--rp-radius);
}

.line.line--stub {
  height: calc(var(--rp-spacing) * 3);
  width: 40%;
  border-radius: var(--rp-radius);
}
</style>
