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
  color: var(--rp-muted);
  display: flex;
  align-items: center;
  gap: calc(var(--rp-spacing) * 2);
  font-size: var(--rp-text-sm);
  line-height: var(--rp-text-sm--line-height);
}
</style>
