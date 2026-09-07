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
  width: calc(var(--spacing) * 56);
  flex-direction: column;
  gap: calc(var(--spacing) * 5);
}

.thumb {
  height: calc(var(--spacing) * 24);
  border-radius: calc(var(--radius) * 1.5);
}

.lines {
  display: flex;
  flex-direction: column;
  gap: calc(var(--spacing) * 3);
}

.line.line--short {
  height: calc(var(--spacing) * 3);
  width: 60%;
  border-radius: var(--radius);
}

.line.line--long {
  height: calc(var(--spacing) * 3);
  width: 80%;
  border-radius: var(--radius);
}

.line.line--stub {
  height: calc(var(--spacing) * 3);
  width: 40%;
  border-radius: var(--radius);
}
</style>
