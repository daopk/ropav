<script setup lang="ts">
import { Spinner } from "ropav";
</script>

<template>
  <div class="note">
    <Spinner color="current" size="sm" />
    Checking the domain
  </div>
</template>

<style scoped>
.note {
  color: var(--muted);
  display: flex;
  align-items: center;
  gap: calc(var(--spacing) * 2);
  font-size: var(--text-sm);
  line-height: var(--text-sm--line-height);
}
</style>
